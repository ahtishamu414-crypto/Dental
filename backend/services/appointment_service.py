from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId

from backend.services.database import get_database
from backend.models.appointment_models import (
    AppointmentRequest,
    AppointmentDocument,
    AppointmentStatus,
    ServiceType,
    SERVICE_DURATIONS,
    STANDARD_SLOTS,
    validate_appointment_date
)


class AppointmentService:
    """
    Service for managing dental appointment requests.
    
    Handles all CRUD operations for appointments in MongoDB.
    """
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.appointments

    async def get_booked_slots(self, date: str, doctor: Optional[str] = None) -> List[str]:
        """
        Get all booked time slots for a specific date and doctor.
        Considers only 'pending' and 'confirmed' appointments.
        """
        query = {
            "preferred_date": date.strip(),
            "status": {"$in": [AppointmentStatus.PENDING.value, AppointmentStatus.CONFIRMED.value]}
        }
        if doctor and doctor != "Any Available Doctor":
            query["$or"] = [
                {"doctor_name": doctor},
                {"doctor_name": "Any Available Doctor"}
            ]

        cursor = self.collection.find(query, {"preferred_time": 1})
        booked = []
        async for doc in cursor:
            if "preferred_time" in doc and doc["preferred_time"]:
                booked.append(doc["preferred_time"])
        return list(set(booked))

    async def is_slot_available(self, date: str, time: str, doctor: Optional[str] = None) -> bool:
        """Check if a time slot is available on the specified date."""
        booked = await self.get_booked_slots(date, doctor)
        return time.strip() not in booked

    async def create_appointment(self, request: AppointmentRequest) -> AppointmentDocument:
        """
        Create a new appointment request with date validation and collision prevention.
        
        Args:
            request: AppointmentRequest object from user
            
        Returns:
            AppointmentDocument with generated ID and timestamps
        """
        # 1. Validate date (prevents past dates & invalid years)
        validate_appointment_date(request.preferred_date)

        # 2. Resolve duration and doctor
        doctor = request.doctor_name or "Any Available Doctor"
        duration = request.duration_minutes
        if not duration:
            duration = SERVICE_DURATIONS.get(request.service_type, 30)

        # 3. Collision check: prevent double booking
        available = await self.is_slot_available(
            request.preferred_date,
            request.preferred_time,
            doctor
        )
        if not available:
            raise ValueError(
                f"The time slot '{request.preferred_time}' on {request.preferred_date} has already been reserved for {doctor}. Please select another time."
            )

        now = datetime.utcnow()
        
        # Create document for MongoDB
        document = {
            "patient_name": request.patient_name,
            "patient_email": request.patient_email,
            "patient_phone": request.patient_phone,
            "service_type": request.service_type.value if hasattr(request.service_type, 'value') else str(request.service_type),
            "doctor_name": doctor,
            "duration_minutes": duration,
            "preferred_date": request.preferred_date,
            "preferred_time": request.preferred_time,
            "notes": request.notes,
            "clinic_name": request.clinic_name,
            "status": AppointmentStatus.PENDING.value,
            "created_at": now,
            "updated_at": now,
            "confirmed_by": None,
            "confirmation_date": None
        }
        
        # Insert into MongoDB
        result = await self.collection.insert_one(document)
        
        # Return the created document with ID
        document["id"] = str(result.inserted_id)
        
        return AppointmentDocument(**document)
    
    async def get_appointment_by_id(self, appointment_id: str) -> Optional[AppointmentDocument]:
        """
        Retrieve an appointment by its MongoDB ID.
        
        Args:
            appointment_id: MongoDB document ID as string
            
        Returns:
            AppointmentDocument if found, None otherwise
        """
        try:
            object_id = ObjectId(appointment_id)
            document = await self.collection.find_one({"_id": object_id})
            
            if document is None:
                return None
            
            document["id"] = str(document["_id"])
            del document["_id"]
            
            return AppointmentDocument(**document)
            
        except Exception as e:
            print(f"Error retrieving appointment: {e}")
            return None
    
    async def get_appointments_by_status(
        self, 
        status: AppointmentStatus, 
        limit: int = 50
    ) -> List[AppointmentDocument]:
        """
        Retrieve appointments filtered by status.
        
        Args:
            status: AppointmentStatus to filter by
            limit: Maximum number of results
            
        Returns:
            List of AppointmentDocument objects
        """
        documents = await self.collection.find(
            {"status": status.value}
        ).limit(limit).to_list(length=limit)
        
        appointments = []
        for doc in documents:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            appointments.append(AppointmentDocument(**doc))
        
        return appointments
    
    async def get_all_appointments(self, limit: int = 100) -> List[AppointmentDocument]:
        """
        Retrieve all appointments (for admin dashboard).
        
        Args:
            limit: Maximum number of results
            
        Returns:
            List of AppointmentDocument objects
        """
        documents = await self.collection.find({}).limit(limit).to_list(length=limit)
        
        appointments = []
        for doc in documents:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            appointments.append(AppointmentDocument(**doc))
        
        return appointments
    
    async def update_appointment_status(
        self, 
        appointment_id: str, 
        new_status: AppointmentStatus,
        confirmed_by: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Optional[AppointmentDocument]:
        """
        Update the status of an appointment.
        
        Args:
            appointment_id: MongoDB document ID as string
            new_status: New AppointmentStatus
            confirmed_by: Staff member name (optional)
            notes: Update notes (optional)
            
        Returns:
            Updated AppointmentDocument if successful, None otherwise
        """
        try:
            object_id = ObjectId(appointment_id)
            now = datetime.utcnow()
            
            update_data = {
                "status": new_status.value,
                "updated_at": now
            }
            
            # Add confirmation details if confirming
            if new_status == AppointmentStatus.CONFIRMED:
                update_data["confirmed_by"] = confirmed_by
                update_data["confirmation_date"] = now
            
            # Add notes if provided
            if notes:
                update_data["notes"] = notes
            
            await self.collection.update_one(
                {"_id": object_id},
                {"$set": update_data}
            )
            
            # Return updated document
            return await self.get_appointment_by_id(appointment_id)
            
        except Exception as e:
            print(f"Error updating appointment: {e}")
            return None
    
    async def cancel_appointment(
        self, 
        appointment_id: str, 
        reason: Optional[str] = None
    ) -> Optional[AppointmentDocument]:
        """
        Cancel an appointment.
        
        Args:
            appointment_id: MongoDB document ID as string
            reason: Cancellation reason (optional)
            
        Returns:
            Updated AppointmentDocument if successful, None otherwise
        """
        return await self.update_appointment_status(
            appointment_id,
            AppointmentStatus.CANCELLED,
            notes=reason
        )
    
    async def confirm_appointment(
        self, 
        appointment_id: str, 
        confirmed_by: str
    ) -> Optional[AppointmentDocument]:
        """
        Confirm an appointment.
        
        Args:
            appointment_id: MongoDB document ID as string
            confirmed_by: Staff member name
            
        Returns:
            Updated AppointmentDocument if successful, None otherwise
        """
        return await self.update_appointment_status(
            appointment_id,
            AppointmentStatus.CONFIRMED,
            confirmed_by=confirmed_by
        )
    
    async def delete_appointment(self, appointment_id: str) -> bool:
        """
        Delete an appointment from the database.
        
        Args:
            appointment_id: MongoDB document ID as string
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            object_id = ObjectId(appointment_id)
            result = await self.collection.delete_one({"_id": object_id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting appointment: {e}")
            return False
    
    async def get_appointment_count(self) -> int:
        """
        Get total number of appointments in the database.
        
        Returns:
            Total count as integer
        """
        return await self.collection.count_documents({})
    
    async def get_appointments_by_date(
        self, 
        date: str, 
        limit: int = 50
    ) -> List[AppointmentDocument]:
        """
        Retrieve appointments for a specific date.
        
        Args:
            date: Date string (e.g., "2026-10-25")
            limit: Maximum number of results
            
        Returns:
            List of AppointmentDocument objects
        """
        documents = await self.collection.find(
            {"preferred_date": date}
        ).limit(limit).to_list(length=limit)
        
        appointments = []
        for doc in documents:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            appointments.append(AppointmentDocument(**doc))
        
        return appointments


# Global service instance
_appointment_service: Optional[AppointmentService] = None


def get_appointment_service() -> AppointmentService:
    """
    Get or create the appointment service instance.
    
    Returns:
        AppointmentService instance
    """
    global _appointment_service
    
    if _appointment_service is None:
        _appointment_service = AppointmentService()
    
    return _appointment_service
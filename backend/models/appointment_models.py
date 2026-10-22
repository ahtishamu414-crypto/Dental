from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class AppointmentStatus(str, Enum):
    """Appointment status options."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class ServiceType(str, Enum):
    """Available dental service types."""
    GENERAL_CHECKUP = "General Checkup"
    PROFESSIONAL_CLEANING = "Professional Cleaning"
    TEETH_WHITENING = "Teeth Whitening"
    DENTAL_FILLINGS = "Dental Fillings"
    ROOT_CANAL_THERAPY = "Root Canal Therapy"
    TOOTH_EXTRACTION = "Tooth Extraction"
    ORTHODONTIC_CONSULTATION = "Orthodontic Consultation"
    OTHER = "Other"


class AppointmentRequest(BaseModel):
    """
    Model for incoming appointment request from user.
    
    This is what the AI receptionist collects from the patient.
    """
    
    patient_name: str = Field(min_length=1, max_length=100, description="Patient's full name")
    patient_email: EmailStr = Field(description="Patient's email address")
    patient_phone: str = Field(min_length=7, max_length=20, description="Patient's phone number")
    
    service_type: ServiceType = Field(description="Requested dental service")
    doctor_name: Optional[str] = Field(default="Any Available Doctor", description="Selected dentist/doctor")
    duration_minutes: Optional[int] = Field(default=30, description="Duration in minutes")
    preferred_date: str = Field(min_length=1, max_length=50, description="Preferred appointment date")
    preferred_time: str = Field(min_length=1, max_length=50, description="Preferred appointment time")
    
    notes: Optional[str] = Field(default=None, max_length=500, description="Additional notes or concerns")
    
    clinic_name: str = Field(default="Bright Smile Dental", description="Clinic name")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_name": "John Doe",
                "patient_email": "john.doe@example.com",
                "patient_phone": "(555) 123-4567",
                "service_type": "General Checkup",
                "doctor_name": "Dr. Sarah Jenkins",
                "duration_minutes": 30,
                "preferred_date": "2026-10-25",
                "preferred_time": "10:00 AM",
                "notes": "First visit, nervous about dental work",
                "clinic_name": "Bright Smile Dental"
            }
        }


class AppointmentDocument(AppointmentRequest):
    """
    Model for appointment document stored in MongoDB.
    
    Extends AppointmentRequest with database fields.
    """
    
    id: Optional[str] = Field(default=None, description="MongoDB document ID")
    status: AppointmentStatus = Field(default=AppointmentStatus.PENDING, description="Appointment status")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Request creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    confirmed_by: Optional[str] = Field(default=None, description="Staff member who confirmed")
    confirmation_date: Optional[datetime] = Field(default=None, description="When appointment was confirmed")
    
    class Config:
        json_schema_extra = {
            "example": {
                "patient_name": "John Doe",
                "patient_email": "john.doe@example.com",
                "patient_phone": "(555) 123-4567",
                "service_type": "General Checkup",
                "preferred_date": "2026-10-25",
                "preferred_time": "10:00 AM",
                "notes": "First visit, nervous about dental work",
                "clinic_name": "Bright Smile Dental",
                "status": "pending",
                "created_at": "2026-10-17T13:00:00Z"
            }
        }


class AppointmentResponse(BaseModel):
    """
    Model for API response when creating an appointment.
    
    Returned to the frontend/AI after successful submission.
    """
    
    success: bool = Field(description="Whether the request was successful")
    message: str = Field(description="Response message")
    appointment_id: Optional[str] = Field(default=None, description="MongoDB document ID")
    status: Optional[str] = Field(default=None, description="Appointment status")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Appointment request submitted successfully. Our staff will contact you within 24 hours.",
                "appointment_id": "6ad334ed2005f129acb908d2",
                "status": "pending"
            }
        }


class AppointmentListResponse(BaseModel):
    """
    Model for API response when listing appointments.
    
    Used for admin dashboard.
    """
    
    success: bool = Field(description="Whether the request was successful")
    total: int = Field(description="Total number of appointments")
    appointments: list = Field(description="List of appointment documents")


class UpdateAppointmentStatusRequest(BaseModel):
    """
    Model for updating appointment status.
    
    Used by admin/staff to confirm, cancel, or reschedule.
    """
    
    status: AppointmentStatus = Field(description="New appointment status")
    confirmed_by: Optional[str] = Field(default=None, description="Staff member making the update")
    notes: Optional[str] = Field(default=None, max_length=500, description="Update notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "confirmed",
                "confirmed_by": "Dr. Smith",
                "notes": "Confirmed via phone call"
            }
        }


# Clinic doctors list
CLINIC_DOCTORS = [
    "Any Available Doctor",
    "Dr. Sarah Jenkins (General & Preventative)",
    "Dr. Michael Chen (Orthodontics & Cosmetic)",
    "Dr. Emily Rodriguez (Oral Surgery & Endodontics)"
]

# Dedicated duration per treatment type (in minutes)
SERVICE_DURATIONS = {
    ServiceType.GENERAL_CHECKUP: 30,
    ServiceType.PROFESSIONAL_CLEANING: 45,
    ServiceType.TEETH_WHITENING: 60,
    ServiceType.DENTAL_FILLINGS: 60,
    ServiceType.ROOT_CANAL_THERAPY: 90,
    ServiceType.TOOTH_EXTRACTION: 60,
    ServiceType.ORTHODONTIC_CONSULTATION: 45,
    ServiceType.OTHER: 30,
}

# Standard clinic operating slots
STANDARD_SLOTS = [
    "9:00 AM",
    "9:45 AM",
    "10:30 AM",
    "11:15 AM",
    "1:00 PM",
    "1:45 PM",
    "2:30 PM",
    "3:15 PM",
    "4:00 PM",
    "4:45 PM"
]


class AvailableSlotsResponse(BaseModel):
    """Model for available appointment time slots response."""
    success: bool
    date: str
    doctor: str
    service_type: str
    duration_minutes: int
    available_slots: list[str]
    booked_slots: list[str]


def validate_appointment_date(date_str: str) -> None:
    """
    Validate that the appointment date:
    1. Is a valid ISO date YYYY-MM-DD
    2. Is not in the past
    3. Is not beyond 90 days in the future (prevents absurd years like 222333)
    """
    from datetime import date, timedelta
    try:
        parts = [int(p) for p in date_str.strip().split("-")]
        if len(parts) != 3:
            raise ValueError
        parsed_date = date(parts[0], parts[1], parts[2])
    except Exception:
        raise ValueError("Invalid date format. Please use YYYY-MM-DD.")

    today = date.today()
    if parsed_date < today:
        raise ValueError("Appointment date cannot be in the past.")

    max_date = today + timedelta(days=90)
    if parsed_date > max_date:
        raise ValueError(
            f"Appointments can only be booked up to 90 days in advance (on or before {max_date.isoformat()})."
        )
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional

from backend.models.appointment_models import (
    AppointmentRequest,
    AppointmentResponse,
    AppointmentDocument,
    AppointmentListResponse,
    UpdateAppointmentStatusRequest,
    AppointmentStatus,
    AvailableSlotsResponse,
    STANDARD_SLOTS,
    SERVICE_DURATIONS,
    CLINIC_DOCTORS,
    validate_appointment_date
)
from backend.services.appointment_service import get_appointment_service
from backend.services.email_service import get_email_service
from backend.services.database import connect_to_database
from backend.services.user_service import get_user_service
from backend.routers.auth import get_current_user, get_optional_user

router = APIRouter(
    prefix="/api/appointments",
    tags=["Appointments"],
    responses={404: {"description": "Appointment not found"}}
)


@router.get(
    "/doctors",
    summary="Get Clinic Doctors",
    description="Get the list of active doctors and dentists at Bright Smile Dental."
)
async def get_doctors():
    """Return available doctors and specialists."""
    return {
        "success": True,
        "doctors": CLINIC_DOCTORS
    }


@router.get(
    "/available-slots",
    response_model=AvailableSlotsResponse,
    summary="Get Available Time Slots",
    description="Get real-time available time slots for a given date, doctor, and treatment duration."
)
async def get_available_slots(
    date: str,
    doctor: Optional[str] = "Any Available Doctor",
    service_type: Optional[str] = "General Checkup"
) -> AvailableSlotsResponse:
    """
    Check slot availability for a specific date and doctor.
    Ensures that other patients cannot double-book the same slot.
    """
    try:
        # Validate date (no past dates, no absurd future years)
        validate_appointment_date(date)
        
        await connect_to_database()
        service = get_appointment_service()
        
        # Get duration for requested service
        duration = 30
        for st, mins in SERVICE_DURATIONS.items():
            st_val = st.value if hasattr(st, 'value') else str(st)
            if st_val.lower() == (service_type or "").lower():
                duration = mins
                break
        
        # Retrieve booked slots from MongoDB
        booked_slots = await service.get_booked_slots(date, doctor)
        
        # Determine available slots
        available_slots = [s for s in STANDARD_SLOTS if s not in booked_slots]
        
        return AvailableSlotsResponse(
            success=True,
            date=date,
            doctor=doctor or "Any Available Doctor",
            service_type=service_type or "General Checkup",
            duration_minutes=duration,
            available_slots=available_slots,
            booked_slots=booked_slots
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Error fetching available slots: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available slots."
        )


@router.post(
    "/",
    response_model=AppointmentResponse,
    summary="Create Appointment Request",
    description="Submit a new appointment request. Checks for slot collisions and validates date."
)
async def create_appointment(
    request: AppointmentRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
) -> AppointmentResponse:
    """
    Create a new appointment request from patient.
    
    Rejects double-booking collisions with HTTP 409 and invalid dates with HTTP 400.
    """
    try:
        # Ensure database is connected
        await connect_to_database()
        
        service = get_appointment_service()
        email_service = get_email_service()
        
        # Create appointment (performs validation & collision checking)
        appointment = await service.create_appointment(request)
        
        # Send email notification to admin safely
        try:
            email_service.send_appointment_notification_to_admin(
                patient_name=request.patient_name,
                patient_email=request.patient_email,
                patient_phone=request.patient_phone,
                service_type=request.service_type.value if hasattr(request.service_type, 'value') else str(request.service_type),
                preferred_date=request.preferred_date,
                preferred_time=request.preferred_time,
                notes=request.notes,
                appointment_id=appointment.id
            )
        except Exception as email_err:
            print(f"⚠️ Email notification warning: {email_err}")
        
        return AppointmentResponse(
            success=True,
            message="Appointment request submitted successfully. Our staff will contact you within 24 hours to confirm.",
            appointment_id=appointment.id,
            status=appointment.status.value
        )
        
    except ValueError as ve:
        err_msg = str(ve)
        if "already been reserved" in err_msg or "booked" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=err_msg
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating appointment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create appointment request. Please try again."
        )


@router.get(
    "/",
    response_model=AppointmentListResponse,
    summary="List All Appointments",
    description="Retrieve all appointments (clinic staff/admin only). Requires authentication."
)
async def list_appointments(
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
) -> AppointmentListResponse:
    """
    Get all appointments for clinic admin/staff dashboard.
    """
    try:
        if current_user.get("role") not in ["admin", "staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or staff privileges required"
            )

        await connect_to_database()
        
        service = get_appointment_service()
        appointments = await service.get_all_appointments(limit=limit)
        
        return AppointmentListResponse(
            success=True,
            total=len(appointments),
            appointments=[app.model_dump() for app in appointments]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error listing appointments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve appointments."
        )


@router.get(
    "/my",
    response_model=AppointmentListResponse,
    summary="Get Current Patient Appointments",
    description="Retrieve appointments for the authenticated patient."
)
async def get_my_appointments(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
) -> AppointmentListResponse:
    """
    Get appointments for the logged-in patient using their account email.
    """
    try:
        user_email = current_user.get("email")
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient email not found in session."
            )

        await connect_to_database()
        service = get_appointment_service()
        appointments = await service.get_appointments_by_email(user_email, limit=limit)
        
        return AppointmentListResponse(
            success=True,
            total=len(appointments),
            appointments=[app.model_dump() for app in appointments]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting patient appointments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve your appointments."
        )


@router.get(
    "/{appointment_id}",
    response_model=AppointmentDocument,
    summary="Get Appointment by ID",
    description="Retrieve a specific appointment by its MongoDB ID."
)
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
) -> AppointmentDocument:
    """
    Get a single appointment by ID.
    Enforces authorization: staff/admin can view any appointment, patients can only view their own.
    """
    try:
        await connect_to_database()
        
        service = get_appointment_service()
        appointment = await service.get_appointment_by_id(appointment_id)
        
        if appointment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )

        # Patient access restriction
        user_role = current_user.get("role")
        user_email = (current_user.get("email") or "").strip().lower()
        if user_role not in ["admin", "staff"] and appointment.patient_email.strip().lower() != user_email:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this appointment."
            )
        
        return appointment
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting appointment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve appointment."
        )


@router.get(
    "/status/{status}",
    response_model=AppointmentListResponse,
    summary="Get Appointments by Status",
    description="Filter appointments by status (pending, confirmed, cancelled, etc.). Admin/staff only."
)
async def get_appointments_by_status(
    status: AppointmentStatus,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
) -> AppointmentListResponse:
    """
    Get appointments filtered by status (admin/staff use).
    """
    try:
        if current_user.get("role") not in ["admin", "staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or staff privileges required"
            )

        await connect_to_database()
        
        service = get_appointment_service()
        appointments = await service.get_appointments_by_status(status, limit=limit)
        
        return AppointmentListResponse(
            success=True,
            total=len(appointments),
            appointments=[app.model_dump() for app in appointments]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting appointments by status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve appointments."
        )


@router.put(
    "/{appointment_id}/status",
    response_model=AppointmentDocument,
    summary="Update Appointment Status",
    description="Update appointment status (confirm, cancel, reschedule). Admin/staff use."
)
async def update_appointment_status(
    appointment_id: str,
    update_request: UpdateAppointmentStatusRequest,
    current_user: dict = Depends(get_current_user)
) -> AppointmentDocument:
    """
    Update the status of an appointment.
    
    Used by clinic staff to confirm, cancel, or reschedule appointments.
    Sends email notification to patient on status change.
    """
    try:
        if current_user.get("role") not in ["admin", "staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or staff privileges required"
            )

        await connect_to_database()
        
        service = get_appointment_service()
        email_service = get_email_service()
        
        # Get current appointment before update
        old_appointment = await service.get_appointment_by_id(appointment_id)
        
        if old_appointment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Update status
        appointment = await service.update_appointment_status(
            appointment_id,
            update_request.status,
            confirmed_by=update_request.confirmed_by or current_user.get("email"),
            notes=update_request.notes
        )
        
        if appointment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        # Send email notification based on new status
        try:
            service_str = appointment.service_type.value if hasattr(appointment.service_type, 'value') else str(appointment.service_type)
            if update_request.status == AppointmentStatus.CONFIRMED:
                email_service.send_appointment_confirmation_to_patient(
                    patient_name=appointment.patient_name,
                    patient_email=appointment.patient_email,
                    service_type=service_str,
                    appointment_date=appointment.preferred_date,
                    appointment_time=appointment.preferred_time,
                    clinic_address="123 Demo Avenue, New York, NY 10001",
                    clinic_phone="(212) 555-0199",
                    notes=appointment.notes,
                    doctor_name=appointment.doctor_name,
                    duration_minutes=appointment.duration_minutes
                )
            elif update_request.status == AppointmentStatus.CANCELLED:
                email_service.send_appointment_cancellation_to_patient(
                    patient_name=appointment.patient_name,
                    patient_email=appointment.patient_email,
                    service_type=service_str,
                    original_date=appointment.preferred_date,
                    reason=update_request.notes
                )
        except Exception as email_err:
            print(f"⚠️ Email notification warning (appointment status still updated): {email_err}")
        
        return appointment
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating appointment status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update appointment status."
        )


@router.delete(
    "/{appointment_id}",
    summary="Delete Appointment",
    description="Delete an appointment from the database. Admin use."
)
async def delete_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Delete an appointment permanently.
    
    ⚠️ This action cannot be undone. Requires admin role.
    """
    try:
        if current_user.get("role") not in ["admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clinic administrators can delete appointment records."
            )

        await connect_to_database()
        
        service = get_appointment_service()
        deleted = await service.delete_appointment(appointment_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Appointment not found"
            )
        
        return {
            "success": True,
            "message": "Appointment deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting appointment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete appointment."
        )


@router.get(
    "/date/{date}",
    response_model=AppointmentListResponse,
    summary="Get Appointments by Date",
    description="Retrieve all appointments for a specific date. Admin/staff use."
)
async def get_appointments_by_date(
    date: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
) -> AppointmentListResponse:
    """
    Get all appointments for a specific date.
    
    Date format: YYYY-MM-DD (e.g., 2026-10-25)
    """
    try:
        if current_user.get("role") not in ["admin", "staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or staff privileges required"
            )

        await connect_to_database()
        
        service = get_appointment_service()
        appointments = await service.get_appointments_by_date(date, limit=limit)
        
        return AppointmentListResponse(
            success=True,
            total=len(appointments),
            appointments=[app.model_dump() for app in appointments]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting appointments by date: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve appointments for this date."
        )
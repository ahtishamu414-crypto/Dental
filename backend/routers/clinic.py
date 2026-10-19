from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any

from backend.models.clinic_models import (
    ServiceModel,
    ServiceUpdateRequest,
    HoursModel
)
from backend.services.knowledge_service import get_knowledge_service
from backend.services.database import connect_to_database
from backend.routers.auth import get_current_user

router = APIRouter(
    prefix="/api/clinic",
    tags=["Clinic Management"],
    responses={401: {"description": "Unauthorized"}, 403: {"description": "Admin forbidden"}}
)


def verify_admin_role(current_user: dict):
    """Helper dependency to ensure the requesting user is an admin."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required to modify clinic configurations."
        )


# ==================== SERVICES & PRICING ENDPOINTS ====================

@router.get(
    "/services",
    summary="Get All Services (Admin / Public)",
    description="Retrieve list of services offered by the clinic."
)
async def get_services() -> List[Dict[str, Any]]:
    """Retrieve all clinic services from MongoDB."""
    try:
        await connect_to_database()
        service = get_knowledge_service()
        return await service.get_all_services_admin()
    except Exception as e:
        print(f"Error fetching services: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve services."
        )


@router.post(
    "/services",
    summary="Add New Service (Admin Only)",
    description="Add a new dental service and price to the clinic."
)
async def add_service(
    service_input: ServiceModel,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Add a new service to MongoDB. Requires Admin token."""
    verify_admin_role(current_user)
    
    try:
        await connect_to_database()
        knowledge_svc = get_knowledge_service()
        added_service = await knowledge_svc.add_service(service_input)
        return {
            "success": True,
            "message": "Service added successfully.",
            "service": added_service
        }
    except Exception as e:
        print(f"Error adding service: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add service."
        )


@router.put(
    "/services/{service_id}",
    summary="Update Service / Price (Admin Only)",
    description="Update service name, description, price, or active status."
)
async def update_service(
    service_id: str,
    updates: ServiceUpdateRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update existing service by ID. Requires Admin token."""
    verify_admin_role(current_user)

    try:
        await connect_to_database()
        knowledge_svc = get_knowledge_service()
        updated = await knowledge_svc.update_service(service_id, updates)

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service ID not found."
            )

        return {
            "success": True,
            "message": "Service updated successfully.",
            "service": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating service: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update service."
        )


@router.delete(
    "/services/{service_id}",
    summary="Delete Service (Admin Only)",
    description="Remove a service permanently from the clinic knowledge base."
)
async def delete_service(
    service_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Delete a service from MongoDB. Requires Admin token."""
    verify_admin_role(current_user)

    try:
        await connect_to_database()
        knowledge_svc = get_knowledge_service()
        deleted = await knowledge_svc.delete_service(service_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service ID not found."
            )

        return {
            "success": True,
            "message": "Service deleted successfully."
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting service: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete service."
        )


# ==================== OPENING HOURS ENDPOINTS ====================

@router.get(
    "/hours",
    summary="Get Clinic Hours",
    description="Retrieve current opening hours."
)
async def get_hours() -> Dict[str, str]:
    """Retrieve opening hours."""
    try:
        await connect_to_database()
        knowledge_svc = get_knowledge_service()
        return await knowledge_svc.get_opening_hours()
    except Exception as e:
        print(f"Error fetching hours: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve opening hours."
        )


@router.put(
    "/hours",
    summary="Update Opening Hours (Admin Only)",
    description="Update clinic operating schedule."
)
async def update_hours(
    hours_input: HoursModel,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update opening hours in MongoDB. Requires Admin token."""
    verify_admin_role(current_user)

    try:
        await connect_to_database()
        knowledge_svc = get_knowledge_service()
        updated_hours = await knowledge_svc.update_opening_hours(hours_input)
        return {
            "success": True,
            "message": "Opening hours updated successfully.",
            "hours": updated_hours
        }
    except Exception as e:
        print(f"Error updating hours: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update opening hours."
        )
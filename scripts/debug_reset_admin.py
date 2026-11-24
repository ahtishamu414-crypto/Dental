import asyncio
from backend.services.database import connect_to_database, disconnect_from_database
from backend.services.user_service import get_user_service
from backend.services.auth_service import get_password_hash
from backend.models.user_models import UserRegister, UserRole

async def reset_admin():
    await connect_to_database()
    service = get_user_service()
    
    admin_email = "ahtishamu414@gmail.com".strip().lower()
    new_password = "Gujjar.88"
    admin_name = "Clinic Admin"
    admin_phone = "03079536861"
    
    user = await service.get_user_by_email(admin_email)
    
    if user:
        print(f"Found admin: {user.email}. Resetting credentials...")
        hashed = get_password_hash(new_password)
        await service.collection.update_one(
            {"email": admin_email},
            {"$set": {
                "full_name": admin_name,
                "hashed_password": hashed,
                "role": UserRole.ADMIN.value,
                "phone": admin_phone,
                "is_active": True
            }}
        )
        print(f"Password reset to '{new_password}' for {admin_email}")
    else:
        print("Admin user not found! Registering new one...")
        new_admin = UserRegister(
            full_name=admin_name,
            email=admin_email,
            password=new_password,
            role=UserRole.ADMIN,
            phone=admin_phone
        )
        await service.create_user(new_admin)
        print(f"Admin user created with password '{new_password}'")

    await disconnect_from_database()

if __name__ == "__main__":
    asyncio.run(reset_admin())
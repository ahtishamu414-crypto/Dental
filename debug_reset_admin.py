import asyncio
from backend.services.database import connect_to_database, disconnect_from_database
from backend.services.user_service import get_user_service
from backend.services.auth_service import get_password_hash
from backend.models.user_models import UserRegister, UserRole

async def reset_admin():
    await connect_to_database()
    service = get_user_service()
    
    admin_email = "admin@brightsmiledental.demo"
    new_password = "adminpassword123"
    
    user = await service.get_user_by_email(admin_email)
    
    if user:
        print(f"Found admin: {user.email}. Resetting password...")
        hashed = get_password_hash(new_password)
        await service.collection.update_one(
            {"email": admin_email},
            {"$set": {"hashed_password": hashed, "is_active": True}}
        )
        print("✅ Password reset to 'adminpassword123'")
    else:
        print("❌ Admin user not found! Registering new one...")
        new_admin = UserRegister(
            full_name="Dr. Admin",
            email=admin_email,
            password=new_password,
            role=UserRole.ADMIN,
            phone="1234567890"
        )
        await service.create_user(new_admin)
        print("✅ Admin user created with password 'adminpassword123'")

    await disconnect_from_database()

if __name__ == "__main__":
    asyncio.run(reset_admin())
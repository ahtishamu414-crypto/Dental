import asyncio
from backend.services.database import connect_to_database, disconnect_from_database
from backend.services.user_service import get_user_service
from backend.services.auth_service import get_password_hash
from backend.models.user_models import UserRegister, UserRole

async def create_super_admin():
    print("Connecting to MongoDB...")
    await connect_to_database()
    
    user_service = get_user_service()
    
    # Define Admin details
    admin_email = "ahtishamu414@gmail.com".strip().lower()
    admin_password = "Gujjar.88"
    admin_name = "Clinic Admin"
    admin_phone = "03079536861"
    
    # Check if admin already exists
    existing_user = await user_service.get_user_by_email(admin_email)
    
    if existing_user:
        print(f"User with email {admin_email} already exists. Updating credentials and role...")
        hashed = get_password_hash(admin_password)
        await user_service.collection.update_one(
            {"email": admin_email},
            {"$set": {
                "full_name": admin_name,
                "hashed_password": hashed,
                "role": UserRole.ADMIN.value,
                "phone": admin_phone,
                "is_active": True
            }}
        )
        print("Role, name, phone, and password updated successfully.")
    else:
        print(f"Creating new Admin account: {admin_email}...")
        new_admin = UserRegister(
            full_name=admin_name,
            email=admin_email,
            password=admin_password,
            role=UserRole.ADMIN,
            phone=admin_phone
        )
        await user_service.create_user(new_admin)
        print("Super Admin created successfully!")
        
    print(f"Login Email: {admin_email}")
    print(f"Login Password: {admin_password}")
    print(f"Full Name: {admin_name}")
    print(f"Phone: {admin_phone}")

    await disconnect_from_database()

if __name__ == "__main__":
    asyncio.run(create_super_admin())
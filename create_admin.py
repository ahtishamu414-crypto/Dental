import asyncio
from backend.services.database import connect_to_database, disconnect_from_database
from backend.services.user_service import get_user_service
from backend.models.user_models import UserRegister, UserRole

async def create_super_admin():
    print("🔄 Connecting to MongoDB...")
    await connect_to_database()
    
    user_service = get_user_service()
    
    # Define your Admin details here
    admin_email = "admin@brightsmiledental.demo"
    admin_password = "adminpassword123"
    
    # Check if admin already exists
    existing_user = await user_service.get_user_by_email(admin_email)
    
    if existing_user:
        print(f"⚠️ User with email {admin_email} already exists.")
        if existing_user.role != UserRole.ADMIN:
            print("🔄 Updating existing user role to ADMIN...")
            await user_service.collection.update_one(
                {"email": admin_email},
                {"$set": {"role": UserRole.ADMIN}}
            )
            print("✅ Role updated successfully.")
    else:
        print(f"👤 Creating new Admin account: {admin_email}...")
        new_admin = UserRegister(
            full_name="Main Clinic Administrator",
            email=admin_email,
            password=admin_password,
            role=UserRole.ADMIN,
            phone="(212) 555-0199"
        )
        await user_service.create_user(new_admin)
        print("✅ Super Admin created successfully!")
        print(f"👉 Login Email: {admin_email}")
        print(f"👉 Login Password: {admin_password}")

    await disconnect_from_database()

if __name__ == "__main__":
    asyncio.run(create_super_admin())
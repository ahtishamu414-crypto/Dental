from datetime import datetime
from typing import Optional, List
from bson import ObjectId

from backend.services.database import get_database
from backend.models.user_models import (
    UserRegister,
    UserDocument,
    UserRole
)
from backend.services.auth_service import get_password_hash


class UserService:
    """
    Service for managing user accounts in MongoDB.
    
    Handles all CRUD operations for users.
    """
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.users
    
    async def create_user(self, register: UserRegister) -> UserDocument:
        """
        Create a new user account.
        
        Args:
            register: UserRegister object with user details
            
        Returns:
            UserDocument with hashed password and timestamps
        """
        now = datetime.utcnow()
        
        # Hash the password (never store plain text!)
        hashed_password = get_password_hash(register.password)
        
        # Create document for MongoDB
        document = {
            "full_name": register.full_name,
            "email": register.email.lower(),  # Store email in lowercase
            "hashed_password": hashed_password,
            "role": register.role.value,
            "phone": register.phone,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        
        # Insert into MongoDB
        result = await self.collection.insert_one(document)
        
        # Return the created document with ID
        document["id"] = str(result.inserted_id)
        
        return UserDocument(**document)
    
    async def get_user_by_email(self, email: str) -> Optional[UserDocument]:
        """
        Find a user by their email address.
        
        Args:
            email: User's email address
            
        Returns:
            UserDocument if found, None otherwise
        """
        document = await self.collection.find_one({"email": email.lower()})
        
        if document is None:
            return None
        
        document["id"] = str(document["_id"])
        del document["_id"]
        
        return UserDocument(**document)
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserDocument]:
        """
        Find a user by their MongoDB ID.
        
        Args:
            user_id: MongoDB document ID as string
            
        Returns:
            UserDocument if found, None otherwise
        """
        try:
            object_id = ObjectId(user_id)
            document = await self.collection.find_one({"_id": object_id})
            
            if document is None:
                return None
            
            document["id"] = str(document["_id"])
            del document["_id"]
            
            return UserDocument(**document)
            
        except Exception as e:
            print(f"Error retrieving user: {e}")
            return None
    
    async def get_all_users(self, limit: int = 100) -> List[UserDocument]:
        """
        Get all users (for admin dashboard).
        
        Args:
            limit: Maximum number of results
            
        Returns:
            List of UserDocument objects
        """
        documents = await self.collection.find({}).limit(limit).to_list(length=limit)
        
        users = []
        for doc in documents:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            users.append(UserDocument(**doc))
        
        return users
    
    async def get_users_by_role(self, role: UserRole, limit: int = 50) -> List[UserDocument]:
        """
        Get users filtered by role.
        
        Args:
            role: UserRole to filter by
            limit: Maximum number of results
            
        Returns:
            List of UserDocument objects
        """
        documents = await self.collection.find(
            {"role": role.value}
        ).limit(limit).to_list(length=limit)
        
        users = []
        for doc in documents:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            users.append(UserDocument(**doc))
        
        return users
    
    async def update_user(
        self, 
        user_id: str, 
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[UserDocument]:
        """
        Update user information.
        
        Args:
            user_id: MongoDB document ID
            full_name: New full name (optional)
            phone: New phone number (optional)
            is_active: Active status (optional)
            
        Returns:
            Updated UserDocument if successful, None otherwise
        """
        try:
            object_id = ObjectId(user_id)
            now = datetime.utcnow()
            
            update_data = {"updated_at": now}
            
            if full_name is not None:
                update_data["full_name"] = full_name
            if phone is not None:
                update_data["phone"] = phone
            if is_active is not None:
                update_data["is_active"] = is_active
            
            await self.collection.update_one(
                {"_id": object_id},
                {"$set": update_data}
            )
            
            return await self.get_user_by_id(user_id)
            
        except Exception as e:
            print(f"Error updating user: {e}")
            return None
    
    async def deactivate_user(self, user_id: str) -> Optional[UserDocument]:
        """
        Deactivate a user account.
        
        Args:
            user_id: MongoDB document ID
            
        Returns:
            Updated UserDocument if successful, None otherwise
        """
        return await self.update_user(user_id, is_active=False)
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user from the database.
        
        Args:
            user_id: MongoDB document ID
            
        Returns:
            True if deleted, False otherwise
        """
        try:
            object_id = ObjectId(user_id)
            result = await self.collection.delete_one({"_id": object_id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
    
    async def get_user_count(self) -> int:
        """
        Get total number of users in the database.
        
        Returns:
            Total count as integer
        """
        return await self.collection.count_documents({})

    async def set_reset_token(self, email: str, token: str, expiry: datetime) -> bool:
        """
        Set password reset code/token and expiration for a user.
        """
        try:
            result = await self.collection.update_one(
                {"email": email.lower()},
                {
                    "$set": {
                        "reset_token": token,
                        "reset_token_expiry": expiry,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"Error setting reset token: {e}")
            return False

    async def verify_reset_token(self, email: str, token: str) -> Optional[UserDocument]:
        """
        Verify that a reset token matches and has not expired.
        """
        try:
            user = await self.get_user_by_email(email)
            if not user or not user.reset_token or not user.reset_token_expiry:
                return None
            
            # Check token match and expiry
            if user.reset_token != token:
                return None
            
            if datetime.utcnow() > user.reset_token_expiry:
                return None
            
            return user
        except Exception as e:
            print(f"Error verifying reset token: {e}")
            return None

    async def reset_password(self, email: str, new_hashed_password: str) -> bool:
        """
        Update user password and clear reset token.
        """
        try:
            result = await self.collection.update_one(
                {"email": email.lower()},
                {
                    "$set": {
                        "hashed_password": new_hashed_password,
                        "reset_token": None,
                        "reset_token_expiry": None,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error resetting password: {e}")
            return False


# Global service instance
_user_service: Optional[UserService] = None


def get_user_service() -> UserService:
    """
    Get or create the user service instance.
    
    Returns:
        UserService instance
    """
    global _user_service
    
    if _user_service is None:
        _user_service = UserService()
    
    return _user_service
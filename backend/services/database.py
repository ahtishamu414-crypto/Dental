from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()


try:
    import certifi
    CA_FILE = certifi.where()
except Exception:
    CA_FILE = None


class Database:
    """
    MongoDB database connection manager.
    
    Provides async connection to MongoDB Atlas for the dental clinic application.
    """
    
    client: Optional[AsyncIOMotorClient] = None
    db = None
    
    def __init__(self):
        self.uri = os.getenv("MONGODB_URI")
        self.db_name = os.getenv("MONGODB_DB_NAME", "dental_clinic_db")
        
        if not self.uri:
            raise ValueError("MONGODB_URI is missing from .env")
    
    async def connect(self) -> None:
        """
        Establish connection to MongoDB.
        
        Raises:
            ConnectionFailure: If connection cannot be established
        """
        try:
            client_kwargs = {
                "serverSelectionTimeoutMS": 5000
            }
            if CA_FILE:
                client_kwargs["tlsCAFile"] = CA_FILE

            self.client = AsyncIOMotorClient(
                self.uri,
                **client_kwargs
            )
            
            # Verify connection
            await self.client.admin.command('ping')
            
            self.db = self.client[self.db_name]
            
            print(f"[OK] Connected to MongoDB: {self.db_name}")
            
        except ConnectionFailure as e:
            print(f"[ERROR] Failed to connect to MongoDB: {e}")
            if "tlsv1 alert internal error" in str(e).lower() or "timeout" in str(e).lower():
                print("[NOTE] If using MongoDB Atlas, verify that your current IP is whitelisted in Atlas Network Access (or add 0.0.0.0/0).")
            raise
        except Exception as e:
            print(f"[ERROR] MongoDB connection error: {e}")
            if "tlsv1 alert internal error" in str(e).lower() or "timeout" in str(e).lower():
                print("[NOTE] If using MongoDB Atlas, verify that your current IP is whitelisted in Atlas Network Access (or add 0.0.0.0/0).")
            raise
    
    async def disconnect(self) -> None:
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            print("[OK] MongoDB connection closed")
    
    def get_collection(self, collection_name: str):
        """
        Get a specific collection from the database.
        
        Args:
            collection_name: Name of the collection
            
        Returns:
            MongoDB collection object
        """
        if self.db is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        
        return self.db[collection_name]
    
    @property
    def appointments(self):
        """Get appointments collection."""
        return self.get_collection("appointments")
    
    @property
    def clinic_configs(self):
        """Get clinic configurations collection."""
        return self.get_collection("clinic_configs")
    @property
    def users(self):
        """Get users collection."""
        return self.get_collection("users")

# Global database instance
_db: Optional[Database] = None


def get_database() -> Database:
    """
    Get or create the global database instance.
    
    Returns:
        Database instance
    """
    global _db
    
    if _db is None:
        _db = Database()
    
    return _db


async def connect_to_database() -> None:
    """
    Initialize database connection at application startup.
    
    Call this in FastAPI lifespan event.
    """
    db = get_database()
    await db.connect()


async def disconnect_from_database() -> None:
    """
    Close database connection at application shutdown.
    
    Call this in FastAPI lifespan event.
    """
    db = get_database()
    await db.disconnect()   

@property
def chats(self):
    """Get chat history collection."""
    return self.get_collection("chats")
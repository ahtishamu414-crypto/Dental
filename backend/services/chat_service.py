from datetime import datetime
from typing import List, Optional
from backend.services.database import get_database

class ChatService:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.chats

    async def save_message(self, user_id: str, role: str, content: str):
        """Saves a single message (user or assistant) to the DB."""
        document = {
            "user_id": user_id, # "guest" or the MongoDB User ID
            "role": role,       # "user" or "assistant"
            "content": content,
            "timestamp": datetime.utcnow()
        }
        await self.collection.insert_one(document)

    async def get_history(self, user_id: str, limit: int = 20) -> List[dict]:
        """Retrieves the last X messages for a specific user."""
        cursor = self.collection.find({"user_id": user_id}).sort("timestamp", 1).limit(limit)
        history = []
        async for doc in cursor:
            history.append({
                "role": doc["role"],
                "content": doc["content"]
            })
        return history

# Global instance
_chat_service = None

def get_chat_service():
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.services.ai_service import generate_response
from backend.services.database import connect_to_database, disconnect_from_database
from backend.routers import appointments, auth, clinic


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage database connection lifecycle.
    Connects to MongoDB on startup, disconnects on shutdown.
    """
    print("[INIT] Connecting to MongoDB...")
    try:
        await connect_to_database()
        print("[OK] Database connection established")
    except Exception as e:
        print(f"[WARN] Database connection failed on startup: {e}")
        print("[NOTE] If using MongoDB Atlas, make sure your IP is whitelisted in Atlas Network Access.")
    
    yield  # App runs here
    
    try:
        print("[INIT] Closing database connection...")
        await disconnect_from_database()
        print("[OK] Database connection closed")
    except Exception:
        pass


app = FastAPI(
    title="Dental AI Receptionist",
    description="AI-powered receptionist for dental clinics with dynamic knowledge management",
    version="2.5.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(appointments.router)
app.include_router(clinic.router)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: Optional[str] = Field(default=None, max_length=2000)
    messages: Optional[List[ChatMessage]] = Field(default=None)


@app.get("/")
async def home():
    return {
        "success": True,
        "message": "Dental AI Receptionist API is running!",
        "version": "2.5.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        user_msg = request.message
        history = [m.model_dump() for m in request.messages] if request.messages else None

        # Extract last message if message string is not explicitly set
        if not user_msg and history:
            for item in reversed(history):
                if item.get("role") == "user":
                    user_msg = item.get("content")
                    break

        if not user_msg and not history:
            raise HTTPException(
                status_code=400,
                detail="Either 'message' or 'messages' must be provided."
            )

        reply = await generate_response(message=user_msg, messages=history)

        return {
            "success": True,
            "user_message": user_msg or "",
            "ai_response": reply
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"AI API Error: {e}")

        raise HTTPException(
            status_code=502,
            detail="Unable to generate an AI response. Please try again."
        )
from contextlib import asynccontextmanager
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


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


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
        reply = await generate_response(request.message)

        return {
            "success": True,
            "user_message": request.message,
            "ai_response": reply
        }

    except Exception as e:
        print(f"AI API Error: {e}")

        raise HTTPException(
            status_code=502,
            detail="Unable to generate an AI response. Please try again."
        )
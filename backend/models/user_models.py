from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User role options."""
    PATIENT = "patient"
    ADMIN = "admin"
    STAFF = "staff"


class UserRegister(BaseModel):
    """
    Model for user registration request.
    
    Used when a new user (patient or admin) signs up.
    """
    
    full_name: str = Field(min_length=1, max_length=100, description="User's full name")
    email: EmailStr = Field(description="User's email address")
    password: str = Field(min_length=6, max_length=100, description="User's password")
    role: UserRole = Field(default=UserRole.PATIENT, description="User role")
    phone: Optional[str] = Field(default=None, max_length=20, description="User's phone number")
    
    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "email": "john.doe@example.com",
                "password": "securepassword123",
                "role": "patient",
                "phone": "(555) 123-4567"
            }
        }


class UserLogin(BaseModel):
    """
    Model for user login request.
    
    Used when a user signs in to get an access token.
    """
    
    email: EmailStr = Field(description="User's email address")
    password: str = Field(min_length=1, max_length=100, description="User's password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "john.doe@example.com",
                "password": "securepassword123"
            }
        }


class TokenResponse(BaseModel):
    """
    Model for JWT token response.
    
    Returned after successful login.
    """
    
    success: bool = Field(description="Whether login was successful")
    access_token: str = Field(description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(description="Token expiration time in minutes")
    user_role: str = Field(description="User's role")
    full_name: Optional[str] = Field(default=None, description="User's full name (optional)")
    email: Optional[str] = Field(default=None, description="User's email address (optional)")

    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 30,
                "user_role": "patient"
            }
        }


class UserDocument(BaseModel):
    """
    Model for user document stored in MongoDB.
    
    Includes hashed password and timestamps.
    """
    
    id: Optional[str] = Field(default=None, description="MongoDB document ID")
    full_name: str = Field(description="User's full name")
    email: EmailStr = Field(description="User's email address")
    hashed_password: str = Field(description="Hashed password (never store plain text)")
    role: UserRole = Field(description="User role")
    phone: Optional[str] = Field(default=None, description="User's phone number")
    is_active: bool = Field(default=True, description="Whether user account is active")
    reset_token: Optional[str] = Field(default=None, description="Password reset verification code")
    reset_token_expiry: Optional[datetime] = Field(default=None, description="Password reset code expiry")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Account creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "email": "john.doe@example.com",
                "role": "patient",
                "is_active": True,
                "created_at": "2026-10-17T13:00:00Z"
            }
        }


class UserResponse(BaseModel):
    """
    Model for user information response.
    
    Returned when getting user profile (excludes password).
    """
    
    id: str = Field(description="User ID")
    full_name: str = Field(description="User's full name")
    email: EmailStr = Field(description="User's email address")
    role: str = Field(description="User role")
    phone: Optional[str] = Field(default=None, description="User's phone number")
    is_active: bool = Field(description="Whether user account is active")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "6ad334ed2005f129acb908d2",
                "full_name": "John Doe",
                "email": "john.doe@example.com",
                "role": "patient",
                "phone": "(555) 123-4567",
                "is_active": True
            }
        }


class ForgotPasswordRequest(BaseModel):
    """Model for requesting password reset."""
    email: EmailStr = Field(description="Email address of the account")


class ResetPasswordRequest(BaseModel):
    """Model for submitting a new password with reset code."""
    email: EmailStr = Field(description="Email address of the account")
    token: str = Field(min_length=4, max_length=100, description="Verification code or reset token")
    new_password: str = Field(min_length=6, max_length=100, description="New secure password")


class AuthMessageResponse(BaseModel):
    """Generic message response for auth operations."""
    success: bool
    message: str
    reset_code: Optional[str] = None
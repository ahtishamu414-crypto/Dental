from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional

import random
from datetime import datetime, timedelta

from backend.models.user_models import (
    UserRegister,
    UserLogin,
    TokenResponse,
    UserResponse,
    UserDocument,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    AuthMessageResponse
)
from backend.services.user_service import get_user_service
from backend.services.email_service import get_email_service
from backend.services.auth_service import (
    create_access_token,
    authenticate_user,
    get_current_user_from_token,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from backend.services.database import connect_to_database

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
    responses={401: {"description": "Unauthorized"}, 404: {"description": "User not found"}}
)

# OAuth2 scheme for required token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# OAuth2 scheme for optional token authentication (doesn't fail if token missing)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency to get current authenticated user from JWT token.
    Fails with 401 if token is missing or invalid.
    """
    user = get_current_user_from_token(token)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_optional_user(token: Optional[str] = Depends(oauth2_scheme_optional)) -> Optional[dict]:
    """
    Dependency to get optional authenticated user from JWT token.
    Returns None if token is missing or invalid.
    """
    if token is None:
        return None
    return get_current_user_from_token(token)


@router.post(
    "/register",
    response_model=UserResponse,
    summary="Register New User",
    description="Create a new user account (patient or admin)."
)
async def register_user(register: UserRegister) -> UserResponse:
    try:
        await connect_to_database()
        
        service = get_user_service()
        
        existing_user = await service.get_user_by_email(register.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        user = await service.create_user(register)
        
        return UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role.value,
            phone=user.phone,
            is_active=user.is_active
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error registering user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user. Please try again."
        )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login",
    description="Login with email and password to get a JWT access token."
)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> TokenResponse:
    try:
        await connect_to_database()
        
        service = get_user_service()
        
        # FIX: Ensure we use the exact email string from the form
        input_email = form_data.username.strip().lower()
        
        user = await service.get_user_by_email(input_email)
        
        # Check if user exists and password is correct
        if not user or not authenticate_user(input_email, form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )
        
        access_token = create_access_token(
            data={"sub": user.id, "role": user.role.value, "email": user.email}
        )
        
        return TokenResponse(
            success=True,
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES,
            user_role=user.role.value
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login."
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User",
    description="Get the currently authenticated user's profile."
)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)) -> UserResponse:
    try:
        await connect_to_database()
        
        service = get_user_service()
        user = await service.get_user_by_id(current_user["id"])
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=user.role.value,
            phone=user.phone,
            is_active=user.is_active
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile"
        )


@router.post(
    "/logout",
    summary="User Logout",
    description="Logout by invalidating current session."
)
async def logout(current_user: dict = Depends(get_current_user)) -> dict:
    return {
        "success": True,
        "message": "Logout successful. Please remove the token from your client storage."
    }


@router.post(
    "/forgot-password",
    response_model=AuthMessageResponse,
    summary="Request Password Reset",
    description="Request a verification code sent to the user's email to reset their password."
)
async def forgot_password(request: ForgotPasswordRequest) -> AuthMessageResponse:
    try:
        await connect_to_database()
        
        service = get_user_service()
        email_service = get_email_service()
        
        email = request.email.strip().lower()
        user = await service.get_user_by_email(email)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email address."
            )
        
        # Generate 6-digit code
        reset_code = f"{random.randint(100000, 999999)}"
        expiry = datetime.utcnow() + timedelta(minutes=15)
        
        # Store in user document
        await service.set_reset_token(email, reset_code, expiry)
        
        # Send email
        try:
            email_service.send_password_reset_email(
                patient_name=user.full_name,
                patient_email=user.email,
                reset_code=reset_code
            )
        except Exception as email_err:
            print(f"⚠️ Warning: Could not send reset email: {email_err}")
            
        return AuthMessageResponse(
            success=True,
            message="A 6-digit verification code has been generated. Please check your email.",
            reset_code=reset_code
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in forgot-password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request."
        )


@router.post(
    "/reset-password",
    response_model=AuthMessageResponse,
    summary="Reset Password with Code",
    description="Submit a new password using the verification code."
)
async def reset_password(request: ResetPasswordRequest) -> AuthMessageResponse:
    try:
        await connect_to_database()
        
        service = get_user_service()
        email = request.email.strip().lower()
        token = request.token.strip()
        
        user = await service.verify_reset_token(email, token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code. Please request a new code."
            )
        
        # Hash new password
        new_hashed = get_password_hash(request.new_password)
        
        # Update user
        success = await service.reset_password(email, new_hashed)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update password. Please try again."
            )
            
        return AuthMessageResponse(
            success=True,
            message="Password has been reset successfully! You can now sign in with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in reset-password: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password. Please try again."
        )
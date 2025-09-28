from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from schemas.user import UserCreate, Token, LoginRequest, User
from repositories.user import UserRepository
from auth.jwt_handler import create_access_token
from config import settings
from models.user import UserRole
from auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()


@router.post("/register", response_model=dict)
async def register_user(
    user_create: UserCreate,
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    
    # Validate password confirmation
    if user_create.password != user_create.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Check if username already exists
    if user_repo.get_by_username(user_create.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    if user_repo.get_by_email(user_create.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if AFM already exists
    if user_repo.get_by_afm(user_create.afm):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AFM already registered"
        )
    
    # Create the user
    user = user_repo.create_user(user_create)
    
    return {
        "message": "User registered successfully. Awaiting admin approval.",
        "user_id": user.id
    }


@router.post("/login", response_model=Token)
async def login(
    login_request: LoginRequest,
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    
    # Authenticate user
    user = user_repo.authenticate(login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "role": user.role
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/verify-token")
async def verify_token(current_user: User = Depends(get_current_user)):
    return {
        "valid": True,
        "user_id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "is_approved": current_user.is_approved
    }
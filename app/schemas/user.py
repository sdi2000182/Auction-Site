from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models.user import UserRole


class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    afm: str


class UserCreate(UserBase):
    password: str
    confirm_password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserInDBBase(UserBase):
    id: int
    role: UserRole
    is_approved: bool
    is_active: bool
    seller_rating: float
    bidder_rating: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    hashed_password: str


class UserProfile(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    location: Optional[str] = None
    country: Optional[str] = None
    seller_rating: float
    bidder_rating: float
    role: UserRole

    class Config:
        from_attributes = True


class UserApproval(BaseModel):
    user_id: int
    is_approved: bool


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
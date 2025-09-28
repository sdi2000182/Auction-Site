from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from models.item import AuctionStatus
from schemas.user import UserProfile
from schemas.category import Category


class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    buy_price: Optional[float] = None
    first_bid: float
    location: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    started: Optional[datetime] = None
    ends: datetime


class ItemCreate(ItemBase):
    category_ids: List[int]
    images: Optional[List[str]] = []

    @validator('first_bid')
    def validate_first_bid(cls, v):
        if v <= 0:
            raise ValueError('First bid must be positive')
        return v

    @validator('buy_price')
    def validate_buy_price(cls, v, values):
        if v is not None and 'first_bid' in values and v <= values['first_bid']:
            raise ValueError('Buy price must be higher than first bid')
        return v


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    buy_price: Optional[float] = None
    first_bid: Optional[float] = None
    location: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    started: Optional[datetime] = None
    ends: Optional[datetime] = None
    category_ids: Optional[List[int]] = None
    images: Optional[List[str]] = None


class ItemInDBBase(ItemBase):
    id: int
    currently: float
    number_of_bids: int
    started: Optional[datetime] = None
    status: AuctionStatus
    images: List[str]
    seller_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Item(ItemInDBBase):
    seller: UserProfile
    categories: List[Category]


class ItemSummary(BaseModel):
    id: int
    name: str
    currently: float
    number_of_bids: int
    ends: datetime
    status: AuctionStatus
    images: List[str]
    location: Optional[str] = None

    class Config:
        from_attributes = True


class ItemSearch(BaseModel):
    query: Optional[str] = None
    category_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    location: Optional[str] = None
    status: Optional[AuctionStatus] = AuctionStatus.ACTIVE
    page: int = 1
    size: int = 20


class ImageUpload(BaseModel):
    filename: str
    content: str  # base64 encoded image data
    content_type: str


class ImageUploadRequest(BaseModel):
    images: List[ImageUpload]
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from schemas.user import UserProfile


class BidBase(BaseModel):
    amount: float

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Bid amount must be positive')
        return v


class BidCreate(BidBase):
    item_id: int

class BidUpdate(BaseModel):
    """Update schema for bids - though bids typically aren't updated after creation"""
    pass  # Bids are usually immutable once placed


class BidInDBBase(BidBase):
    id: int
    time: datetime
    item_id: int
    bidder_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Bid(BidInDBBase):
    bidder: UserProfile


class BidSummary(BaseModel):
    id: int
    amount: float
    time: datetime
    bidder_username: str
    bidder_location: Optional[str] = None
    bidder_country: Optional[str] = None
    bidder_rating: float

    class Config:
        from_attributes = True


class BidConfirmation(BaseModel):
    message: str
    bid: Bid
    is_winning: bool
    is_buy_now: bool = False
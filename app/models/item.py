from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.category import item_categories
from enum import Enum


class AuctionStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ENDED = "ended"
    CANCELLED = "cancelled"


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    currently = Column(Float, nullable=False)  # Current highest bid
    buy_price = Column(Float, nullable=True)  # Optional "Buy Now" price
    first_bid = Column(Float, nullable=False)  # Minimum first bid
    number_of_bids = Column(Integer, default=0)
    location = Column(String(255))
    country = Column(String(100))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    started = Column(DateTime(timezone=True))
    ends = Column(DateTime(timezone=True))
    status = Column(String(20), default=AuctionStatus.DRAFT)
    images = Column(JSON, default=list)  # Store list of image URLs
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign keys
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    seller = relationship("User", back_populates="items")
    bids = relationship("Bid", back_populates="item", cascade="all, delete-orphan")
    categories = relationship("Category", secondary=item_categories, back_populates="items")

    @property
    def is_active(self) -> bool:
        """Check if auction is currently active"""
        if self.status != AuctionStatus.ACTIVE:
            return False
        now = func.now()
        return self.started <= now <= self.ends

    @property
    def winner_bid(self):
        """Get the winning bid (highest bid if auction ended)"""
        if self.status == AuctionStatus.ENDED and self.bids:
            return max(self.bids, key=lambda bid: bid.amount)
        return None
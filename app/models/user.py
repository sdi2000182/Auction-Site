from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"  # Regular user - can both bid and sell
    VISITOR = "visitor"  # Unregistered visitor


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    location = Column(String(255))
    country = Column(String(100))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    afm = Column(String(20), unique=True, nullable=False)  # Greek VAT number
    role = Column(String(20), default=UserRole.USER)
    is_approved = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    seller_rating = Column(Float, default=0.0)
    bidder_rating = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    items = relationship("Item", back_populates="seller")  # Items they're selling
    bids = relationship("Bid", back_populates="bidder")    # Bids they've placed
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

    @property
    def can_sell(self) -> bool:
        """Check if user can create auctions"""
        return self.role in [UserRole.USER, UserRole.ADMIN] and self.is_approved

    @property
    def can_bid(self) -> bool:
        """Check if user can place bids"""
        return self.role in [UserRole.USER, UserRole.ADMIN] and self.is_approved

    @property
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role == UserRole.ADMIN
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    time = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Foreign keys
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    item = relationship("Item", back_populates="bids")
    bidder = relationship("User", back_populates="bids")

    def __repr__(self):
        return f"<Bid(amount={self.amount}, item_id={self.item_id}, bidder_id={self.bidder_id})>"
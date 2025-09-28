from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class UserRecommendation(Base):
    """Pre-computed user recommendations to avoid real-time computation"""
    __tablename__ = "user_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    score = Column(Float, nullable=False)  # Recommendation score
    rank = Column(Integer, nullable=False)  # Recommendation rank for this user
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    item = relationship("Item")

    class Config:
        indexes = [
            ("user_id", "rank"),  # Fast lookup for user's top recommendations
            ("computed_at",),     # For cleanup of old recommendations
        ]


class ModelTrainingLog(Base):
    """Track when recommendation models were trained"""
    __tablename__ = "model_training_log"

    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String(50), nullable=False)  # 'matrix_factorization', 'collaborative_filtering'
    training_started = Column(DateTime(timezone=True), server_default=func.now())
    training_completed = Column(DateTime(timezone=True))
    status = Column(String(20), default='running')  # 'running', 'completed', 'failed'
    users_count = Column(Integer)
    items_count = Column(Integer)
    interactions_count = Column(Integer)
    error_message = Column(Text)
    model_params = Column(JSON)  # Store model parameters

    @property
    def is_current(self) -> bool:
        """Check if this training is recent (within last 24 hours)"""
        if not self.training_completed:
            return False
        return (func.now() - self.training_completed).total_seconds() < 86400  # 24 hours
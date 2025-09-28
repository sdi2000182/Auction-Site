#!/usr/bin/env python3
"""
Offline recommendation model training script
Usage: python scripts/train_recommendations.py [--store-recommendations]
"""

import sys
import os
import argparse
from datetime import datetime, timedelta

# Add the parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from utils.recommendations import RecommendationEngine
from models.recommendation import UserRecommendation, ModelTrainingLog
from models.user import User
from models.item import Item
from models.bid import Bid
from sqlalchemy import func


def train_and_store_recommendations(db, store_recommendations=False):
    """Train recommendation model and optionally store pre-computed recommendations"""
    
    print("🚀 Starting recommendation model training...")
    
    # Create training log entry
    training_log = ModelTrainingLog(
        model_type='matrix_factorization',
        training_started=datetime.utcnow(),
        status='running'
    )
    db.add(training_log)
    db.commit()
    db.refresh(training_log)
    
    try:
        # Initialize recommendation engine
        rec_engine = RecommendationEngine(db)
        
        # Get training data statistics
        users_count = db.query(User).count()
        items_count = db.query(Item).count()
        bids_count = db.query(Bid).count()
        
        print(f"📊 Training data: {users_count} users, {items_count} items, {bids_count} bids")
        
        # Update training log with data counts
        training_log.users_count = users_count
        training_log.items_count = items_count
        training_log.interactions_count = bids_count
        training_log.model_params = {
            'n_factors': 10,
            'learning_rate': 0.01,
            'n_epochs': 50
        }
        db.commit()
        
        if bids_count < 10:
            raise Exception("Not enough bid data for training (minimum 10 bids required)")
        
        # Train the model
        print("🧠 Training matrix factorization model...")
        success = rec_engine.train_model()
        
        if not success:
            raise Exception("Model training failed - insufficient data")
        
        print("✅ Model training completed!")
        
        # Store pre-computed recommendations if requested
        if store_recommendations:
            print("💾 Computing and storing user recommendations...")
            
            # Clear old recommendations
            db.query(UserRecommendation).delete()
            db.commit()
            
            # Get users who have placed bids (active users)
            active_users = db.query(User.id).join(Bid).distinct().all()
            
            stored_count = 0
            for user_result in active_users:
                user_id = user_result.id
                
                try:
                    # Get recommendations for this user
                    recommendations = rec_engine.get_recommendations_for_user(user_id, 20)
                    
                    # Store recommendations
                    for rank, rec in enumerate(recommendations, 1):
                        user_rec = UserRecommendation(
                            user_id=user_id,
                            item_id=rec['id'],
                            score=rec.get('recommendation_score', 0.0),
                            rank=rank
                        )
                        db.add(user_rec)
                        stored_count += 1
                    
                    if stored_count % 100 == 0:
                        db.commit()  # Commit in batches
                        print(f"   Stored {stored_count} recommendations...")
                        
                except Exception as e:
                    print(f"   Error computing recommendations for user {user_id}: {e}")
                    continue
            
            db.commit()
            print(f"✅ Stored {stored_count} pre-computed recommendations")
        
        # Update training log as completed
        training_log.status = 'completed'
        training_log.training_completed = datetime.utcnow()
        db.commit()
        
        print("🎉 Training process completed successfully!")
        return True
        
    except Exception as e:
        # Update training log with error
        training_log.status = 'failed'
        training_log.error_message = str(e)
        training_log.training_completed = datetime.utcnow()
        db.commit()
        
        print(f"❌ Training failed: {e}")
        return False


def cleanup_old_recommendations(db, days_old=7):
    """Clean up old pre-computed recommendations"""
    print(f"🧹 Cleaning up recommendations older than {days_old} days...")
    
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    deleted_count = db.query(UserRecommendation).filter(
        UserRecommendation.computed_at < cutoff_date
    ).delete()
    
    db.commit()
    print(f"🗑️ Cleaned up {deleted_count} old recommendations")


def get_training_status(db):
    """Get status of last training"""
    last_training = db.query(ModelTrainingLog).order_by(
        ModelTrainingLog.training_started.desc()
    ).first()
    
    if not last_training:
        print("📝 No previous training found")
        return None
    
    print(f"📊 Last training: {last_training.training_started}")
    print(f"   Status: {last_training.status}")
    print(f"   Data: {last_training.users_count} users, {last_training.items_count} items, {last_training.interactions_count} bids")
    
    if last_training.status == 'failed':
        print(f"   Error: {last_training.error_message}")
    
    return last_training


def main():
    parser = argparse.ArgumentParser(description='Train recommendation models offline')
    parser.add_argument('--store-recommendations', action='store_true',
                       help='Pre-compute and store recommendations for fast lookup')
    parser.add_argument('--cleanup', type=int, metavar='DAYS',
                       help='Clean up recommendations older than DAYS days')
    parser.add_argument('--status', action='store_true',
                       help='Show status of last training')
    
    args = parser.parse_args()
    
    # Create database session
    db = SessionLocal()
    
    try:
        if args.status:
            get_training_status(db)
        elif args.cleanup:
            cleanup_old_recommendations(db, args.cleanup)
        else:
            # Run training
            success = train_and_store_recommendations(db, args.store_recommendations)
            
            if not success:
                sys.exit(1)
    
    finally:
        db.close()


if __name__ == "__main__":
    main()
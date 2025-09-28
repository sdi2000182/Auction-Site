from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from database import get_db
from views.item_views import ItemViews
from views.user_views import UserViews
from utils.recommendations import RecommendationEngine
from models.user import User as UserModel
from auth.dependencies import get_current_user, get_approved_user
from models.item import Item, AuctionStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_model=Dict)
async def get_dashboard_data(
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    """Get personalized dashboard data for the current user"""
    item_views = ItemViews(db)
    
    dashboard_data = {
        "user_stats": item_views.get_user_dashboard_data(current_user.id),
        "popular_items": item_views.get_popular_items(8),
        "ending_soon": item_views.get_ending_soon(24, 6),
        "recent_items": item_views.get_recent_items(7, 6)
    }
    
    return dashboard_data


@router.get("/recommendations", response_model=List[Dict])
async def get_recommendations(
    limit: int = 10,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    """Get personalized item recommendations for the current user"""
    from app.models.recommendation import UserRecommendation
    from app.models.item import Item
    
    # Try to get pre-computed recommendations first
    stored_recommendations = db.query(UserRecommendation).filter(
        UserRecommendation.user_id == current_user.id
    ).order_by(UserRecommendation.rank).limit(limit).all()
    
    if stored_recommendations:
        # Convert stored recommendations to response format
        recommendations = []
        for rec in stored_recommendations:
            item = db.query(Item).filter(Item.id == rec.item_id).first()
            if item and item.status == AuctionStatus.ACTIVE:
                recommendations.append({
                    "id": item.id,
                    "name": item.name,
                    "currently": item.currently,
                    "number_of_bids": item.number_of_bids,
                    "ends": item.ends.isoformat() if item.ends else None,
                    "images": item.images,
                    "recommendation_score": rec.score,
                    "rank": rec.rank
                })
        
        if recommendations:
            return recommendations
    
    # Fallback to real-time computation if no stored recommendations
    recommendation_engine = RecommendationEngine(db)
    try:
        recommendations = recommendation_engine.get_recommendations_for_user(
            current_user.id, limit
        )
        if recommendations:
            return recommendations
    except Exception:
        pass
    
    # Final fallback to popular items
    item_views = ItemViews(db)
    return item_views.get_popular_items(limit)


@router.get("/recommendations/category", response_model=List[Dict])
async def get_category_recommendations(
    limit: int = 8,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    """Get recommendations based on user's category preferences"""
    recommendation_engine = RecommendationEngine(db)
    recommendations = recommendation_engine.get_recommendations_by_category(
        current_user.id, limit
    )
    
    return recommendations


@router.get("/similar/{item_id}", response_model=List[Dict])
async def get_similar_items(
    item_id: int,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Get items similar to a specific item"""
    recommendation_engine = RecommendationEngine(db)
    similar_items = recommendation_engine.get_similar_items(item_id, limit)
    
    return similar_items


@router.get("/popular", response_model=List[Dict])
async def get_popular_items(
    limit: int = 12,
    db: Session = Depends(get_db)
):
    """Get popular items (public endpoint)"""
    item_views = ItemViews(db)
    return item_views.get_popular_items(limit)


@router.get("/ending-soon", response_model=List[Dict])
async def get_ending_soon(
    hours: int = 24,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get auctions ending soon (public endpoint)"""
    item_views = ItemViews(db)
    return item_views.get_ending_soon(hours, limit)


@router.get("/recent", response_model=List[Dict])
async def get_recent_items(
    days: int = 7,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recently added items (public endpoint)"""
    item_views = ItemViews(db)
    return item_views.get_recent_items(days, limit)


@router.get("/categories/stats", response_model=List[Dict])
async def get_category_statistics(db: Session = Depends(get_db)):
    """Get statistics for all categories (public endpoint)"""
    item_views = ItemViews(db)
    return item_views.get_category_stats()


@router.get("/leaderboard/sellers", response_model=List[Dict])
async def get_top_sellers(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top sellers leaderboard (public endpoint)"""
    user_views = UserViews(db)
    return user_views.get_top_sellers(limit)


@router.get("/leaderboard/bidders", response_model=List[Dict])
async def get_top_bidders(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top bidders leaderboard (public endpoint)"""
    user_views = UserViews(db)
    return user_views.get_top_bidders(limit)


@router.get("/similar/{item_id}", response_model=List[Dict])
async def get_similar_items(
    item_id: int,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Get items similar to a specific item"""
    recommendation_engine = RecommendationEngine(db)
    similar_items = recommendation_engine.get_similar_items(item_id, limit)
    
    return similar_items


@router.get("/popular", response_model=List[Dict])
async def get_popular_items(
    limit: int = 12,
    db: Session = Depends(get_db)
):
    """Get popular items (public endpoint)"""
    item_views = ItemViews(db)
    return item_views.get_popular_items(limit)


@router.get("/ending-soon", response_model=List[Dict])
async def get_ending_soon(
    hours: int = 24,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get auctions ending soon (public endpoint)"""
    item_views = ItemViews(db)
    return item_views.get_ending_soon(hours, limit)


@router.get("/recent", response_model=List[Dict])
async def get_recent_items(
    days: int = 7,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recently added items (public endpoint)"""
    item_views = ItemViews(db)
    return item_views.get_recent_items(days, limit)


@router.get("/categories/stats", response_model=List[Dict])
async def get_category_statistics(db: Session = Depends(get_db)):
    """Get statistics for all categories (public endpoint)"""
    item_views = ItemViews(db)
    return item_views.get_category_stats()


@router.get("/leaderboard/sellers", response_model=List[Dict])
async def get_top_sellers(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top sellers leaderboard (public endpoint)"""
    user_views = UserViews(db)
    return user_views.get_top_sellers(limit)


@router.get("/leaderboard/bidders", response_model=List[Dict])
async def get_top_bidders(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top bidders leaderboard (public endpoint)"""
    user_views = UserViews(db)
    return user_views.get_top_bidders(limit)
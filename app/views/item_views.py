from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from models.item import Item, AuctionStatus
from models.bid import Bid
from models.user import User
from models.category import Category


class ItemViews:
    def __init__(self, db: Session):
        self.db = db

    def get_popular_items(self, limit: int = 10) -> List[Dict]:
        """Get most popular items by number of bids"""
        items = self.db.query(Item).filter(
            Item.status == AuctionStatus.ACTIVE
        ).order_by(desc(Item.number_of_bids)).limit(limit).all()
        
        return [
            {
                "id": item.id,
                "name": item.name,
                "currently": item.currently,
                "number_of_bids": item.number_of_bids,
                "ends": item.ends,
                "images": item.images
            }
            for item in items
        ]

    def get_ending_soon(self, hours: int = 24, limit: int = 10) -> List[Dict]:
        """Get items ending soon"""
        end_time = datetime.utcnow() + timedelta(hours=hours)
        
        items = self.db.query(Item).filter(
            and_(
                Item.status == AuctionStatus.ACTIVE,
                Item.ends <= end_time,
                Item.ends > datetime.utcnow()
            )
        ).order_by(Item.ends).limit(limit).all()
        
        return [
            {
                "id": item.id,
                "name": item.name,
                "currently": item.currently,
                "number_of_bids": item.number_of_bids,
                "ends": item.ends,
                "time_left": item.ends - datetime.utcnow(),
                "images": item.images
            }
            for item in items
        ]

    def get_recent_items(self, days: int = 7, limit: int = 10) -> List[Dict]:
        """Get recently added items"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        items = self.db.query(Item).filter(
            and_(
                Item.status == AuctionStatus.ACTIVE,
                Item.created_at >= since_date
            )
        ).order_by(desc(Item.created_at)).limit(limit).all()
        
        return [
            {
                "id": item.id,
                "name": item.name,
                "currently": item.currently,
                "number_of_bids": item.number_of_bids,
                "ends": item.ends,
                "created_at": item.created_at,
                "images": item.images
            }
            for item in items
        ]

    def get_category_stats(self) -> List[Dict]:
        """Get statistics for each category"""
        stats = self.db.query(
            Category.id,
            Category.name,
            func.count(Item.id).label('active_items'),
            func.avg(Item.currently).label('avg_price'),
            func.sum(Item.number_of_bids).label('total_bids')
        ).join(
            Item.categories
        ).filter(
            Item.status == AuctionStatus.ACTIVE
        ).group_by(Category.id, Category.name).all()
        
        return [
            {
                "category_id": stat.id,
                "category_name": stat.name,
                "active_items": stat.active_items,
                "average_price": float(stat.avg_price) if stat.avg_price else 0.0,
                "total_bids": stat.total_bids or 0
            }
            for stat in stats
        ]

    def get_user_dashboard_data(self, user_id: int) -> Dict:
        """Get dashboard data for a specific user"""
        # User's active items (as seller)
        active_items = self.db.query(Item).filter(
            and_(
                Item.seller_id == user_id,
                Item.status == AuctionStatus.ACTIVE
            )
        ).count()

        # User's winning bids
        winning_bids_subquery = self.db.query(
            Bid.item_id,
            func.max(Bid.amount).label('max_amount')
        ).group_by(Bid.item_id).subquery()

        winning_bids = self.db.query(Bid).join(
            winning_bids_subquery,
            and_(
                Bid.item_id == winning_bids_subquery.c.item_id,
                Bid.amount == winning_bids_subquery.c.max_amount
            )
        ).filter(Bid.bidder_id == user_id).count()

        # User's total bids
        total_bids = self.db.query(Bid).filter(Bid.bidder_id == user_id).count()

        # User's completed auctions (as seller)
        completed_auctions = self.db.query(Item).filter(
            and_(
                Item.seller_id == user_id,
                Item.status == AuctionStatus.ENDED
            )
        ).count()

        return {
            "active_selling_items": active_items,
            "winning_bids": winning_bids,
            "total_bids_placed": total_bids,
            "completed_auctions": completed_auctions
        }

    def get_recommended_items(self, user_id: int, limit: int = 10) -> List[Dict]:
        """Get recommended items based on user's bidding history"""
        # Get categories user has bid on
        user_categories = self.db.query(Category.id).join(
            Item.categories
        ).join(
            Bid, Item.id == Bid.item_id
        ).filter(
            Bid.bidder_id == user_id
        ).distinct().subquery()

        # Get active items in those categories
        recommended_items = self.db.query(Item).join(
            Item.categories
        ).filter(
            and_(
                Category.id.in_(user_categories),
                Item.status == AuctionStatus.ACTIVE,
                Item.seller_id != user_id  # Don't recommend user's own items
            )
        ).order_by(desc(Item.number_of_bids)).limit(limit).all()

        return [
            {
                "id": item.id,
                "name": item.name,
                "currently": item.currently,
                "number_of_bids": item.number_of_bids,
                "ends": item.ends,
                "images": item.images
            }
            for item in recommended_items
        ]
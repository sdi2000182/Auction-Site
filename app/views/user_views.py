from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from models.user import User, UserRole
from models.item import Item, AuctionStatus
from models.bid import Bid


class UserViews:
    def __init__(self, db: Session):
        self.db = db

    def get_top_sellers(self, limit: int = 10) -> List[Dict]:
        """Get top sellers by number of completed auctions"""
        top_sellers = self.db.query(
            User.id,
            User.username,
            User.first_name,
            User.last_name,
            User.seller_rating,
            func.count(Item.id).label('completed_auctions'),
            func.sum(Item.currently).label('total_sales')
        ).join(
            Item, User.id == Item.seller_id
        ).filter(
            Item.status == AuctionStatus.ENDED
        ).group_by(
            User.id, User.username, User.first_name, User.last_name, User.seller_rating
        ).order_by(desc(func.count(Item.id))).limit(limit).all()

        return [
            {
                "user_id": seller.id,
                "username": seller.username,
                "full_name": f"{seller.first_name} {seller.last_name}",
                "seller_rating": seller.seller_rating,
                "completed_auctions": seller.completed_auctions,
                "total_sales": float(seller.total_sales) if seller.total_sales else 0.0
            }
            for seller in top_sellers
        ]

    def get_top_bidders(self, limit: int = 10) -> List[Dict]:
        """Get top bidders by total amount bid"""
        top_bidders = self.db.query(
            User.id,
            User.username,
            User.first_name,
            User.last_name,
            User.bidder_rating,
            func.count(Bid.id).label('total_bids'),
            func.sum(Bid.amount).label('total_amount_bid')
        ).join(
            Bid, User.id == Bid.bidder_id
        ).group_by(
            User.id, User.username, User.first_name, User.last_name, User.bidder_rating
        ).order_by(desc(func.sum(Bid.amount))).limit(limit).all()

        return [
            {
                "user_id": bidder.id,
                "username": bidder.username,
                "full_name": f"{bidder.first_name} {bidder.last_name}",
                "bidder_rating": bidder.bidder_rating,
                "total_bids": bidder.total_bids,
                "total_amount_bid": float(bidder.total_amount_bid) if bidder.total_amount_bid else 0.0
            }
            for bidder in top_bidders
        ]

    # def get_user_statistics(self) -> Dict:
    #     """Get overall user statistics"""
    #     total_users = self.db.query(User).count()
    #     approved_users = self.db.query(User).filter(User.is_approved == True).count()
    #     pending_users = self.db.query(User).filter(User.is_approved == False).count()
        
    #     # Count by role
    #     role_stats = self.db.query(
    #         User.role,
    #         func.count(User.id).label('count')
    #     ).group_by(User.role).all()

    #     role_counts = {role.role: role.count for role in role_stats}

    #     return {
    #         "total_users": total_users,
    #         "approved_users": approved_users,
    #         "pending_users": pending_users,
    #         "sellers": role_counts.get(UserRole.SELLER, 0),
    #         "bidders": role_counts.get(UserRole.BIDDER, 0),
    #         "admins": role_counts.get(UserRole.ADMIN, 0)
    #     }

    def get_recent_registrations(self, limit: int = 10) -> List[Dict]:
        """Get recently registered users"""
        recent_users = self.db.query(User).filter(
            User.role != UserRole.ADMIN
        ).order_by(desc(User.created_at)).limit(limit).all()

        return [
            {
                "user_id": user.id,
                "username": user.username,
                "full_name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "role": user.role,
                "is_approved": user.is_approved,
                "created_at": user.created_at
            }
            for user in recent_users
        ]
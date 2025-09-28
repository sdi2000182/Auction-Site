from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, and_
from repositories.base import BaseRepository
from models.bid import Bid
from models.item import Item
from schemas.bid import BidCreate, BidUpdate


class BidRepository(BaseRepository[Bid, BidCreate, BidUpdate]):
    def __init__(self, db: Session):
        super().__init__(Bid, db)

    def create_bid(self, bid_create: BidCreate, bidder_id: int) -> Bid:
        bid_data = bid_create.dict()
        bid_data["bidder_id"] = bidder_id
        
        db_bid = Bid(**bid_data)
        self.db.add(db_bid)
        self.db.commit()
        self.db.refresh(db_bid)
        return db_bid

    def get_item_bids(self, item_id: int) -> List[Bid]:
        return self.db.query(Bid).options(
            joinedload(Bid.bidder)
        ).filter(
            Bid.item_id == item_id
        ).order_by(desc(Bid.amount), desc(Bid.time)).all()

    def get_user_bids(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Bid]:
        return self.db.query(Bid).options(
            joinedload(Bid.item)
        ).filter(
            Bid.bidder_id == user_id
        ).order_by(desc(Bid.time)).offset(skip).limit(limit).all()

    def get_highest_bid(self, item_id: int) -> Optional[Bid]:
        return self.db.query(Bid).filter(
            Bid.item_id == item_id
        ).order_by(desc(Bid.amount), desc(Bid.time)).first()

    def get_user_bid_on_item(self, user_id: int, item_id: int) -> Optional[Bid]:
        return self.db.query(Bid).filter(
            Bid.bidder_id == user_id,
            Bid.item_id == item_id
        ).order_by(desc(Bid.amount), desc(Bid.time)).first()

    def has_user_bid_on_item(self, user_id: int, item_id: int) -> bool:
        return self.db.query(Bid).filter(
            Bid.bidder_id == user_id,
            Bid.item_id == item_id
        ).first() is not None

    def is_valid_bid(self, item_id: int, bid_amount: float, bidder_id: int) -> tuple[bool, str]:
        """Validate if a bid is valid for an item"""
        # Get item details
        item = self.db.query(Item).filter(Item.id == item_id).first()
        if not item:
            return False, "Item not found"

        # Check if auction is active
        if item.status != "active":
            return False, "Auction is not active"

        # Check if bidder is not the seller
        if item.seller_id == bidder_id:
            return False, "Cannot bid on your own item"

        # Check if bid is higher than current bid
        if bid_amount <= item.currently:
            return False, f"Bid must be higher than current bid of ${item.currently}"

        # Check if it's at least the first bid amount
        if item.number_of_bids == 0 and bid_amount < item.first_bid:
            return False, f"First bid must be at least ${item.first_bid}"

        return True, "Valid bid"

    def get_winning_bids_for_user(self, user_id: int) -> List[Bid]:
        """Get bids where user is currently winning"""
        subquery = self.db.query(
            Bid.item_id,
            func.max(Bid.amount).label('max_amount')
        ).group_by(Bid.item_id).subquery()

        return self.db.query(Bid).options(
            joinedload(Bid.item)
        ).join(
            subquery,
            and_(
                Bid.item_id == subquery.c.item_id,
                Bid.amount == subquery.c.max_amount
            )
        ).filter(
            Bid.bidder_id == user_id
        ).all()
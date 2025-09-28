from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from datetime import datetime
from repositories.base import BaseRepository
from models.item import Item, AuctionStatus
from models.category import Category
from schemas.item import ItemCreate, ItemUpdate, ItemSearch
from models.bid import Bid


class ItemRepository(BaseRepository[Item, ItemCreate, ItemUpdate]):
    def __init__(self, db: Session):
        super().__init__(Item, db)

    def create_item(self, item_create: ItemCreate, seller_id: int) -> Item:
        # Extract category IDs and create item data
        item_data = item_create.dict(exclude={"category_ids"})
        item_data["seller_id"] = seller_id
        item_data["currently"] = item_create.first_bid  # Initial current bid is first bid

        # Set status based on start date
        if item_create.started:
            from datetime import datetime
            start_time = item_create.started
            now = datetime.utcnow()

            if start_time <= now:
                item_data["status"] = AuctionStatus.ACTIVE
            else:
                item_data["status"] = AuctionStatus.DRAFT
        else:
            # If no start date provided, default to draft
            item_data["status"] = AuctionStatus.DRAFT

        db_item = Item(**item_data)
        
        # Add categories
        if item_create.category_ids:
            categories = self.db.query(Category).filter(
                Category.id.in_(item_create.category_ids)
            ).all()
            db_item.categories = categories

        self.db.add(db_item)
        self.db.commit()
        self.db.refresh(db_item)
        return db_item

    def get_with_details(self, item_id: int) -> Optional[Item]:
        return self.db.query(Item).options(
            joinedload(Item.seller),
            joinedload(Item.categories),
            joinedload(Item.bids).joinedload(Bid.bidder)
        ).filter(Item.id == item_id).first()

    def get_by_seller(self, seller_id: int, skip: int = 0, limit: int = 100) -> List[Item]:
        return self.db.query(Item).filter(
            Item.seller_id == seller_id
        ).offset(skip).limit(limit).all()

    def search_items(self, search: ItemSearch) -> Tuple[List[Item], int]:
        query = self.db.query(Item).options(
            joinedload(Item.seller),
            joinedload(Item.categories)
        )

        # Apply filters
        if search.query:
            query = query.filter(
                or_(
                    Item.name.ilike(f"%{search.query}%"),
                    Item.description.ilike(f"%{search.query}%")
                )
            )

        if search.category_id:
            query = query.join(Item.categories).filter(
                Category.id == search.category_id
            )

        if search.min_price:
            query = query.filter(Item.currently >= search.min_price)

        if search.max_price:
            query = query.filter(Item.currently <= search.max_price)

        if search.location:
            query = query.filter(
                or_(
                    Item.location.ilike(f"%{search.location}%"),
                    Item.country.ilike(f"%{search.location}%")
                )
            )

        if search.status:
            query = query.filter(Item.status == search.status)

        # Count total items
        total = query.count()

        # Apply pagination
        items = query.offset((search.page - 1) * search.size).limit(search.size).all()

        return items, total

    def get_active_items(self, skip: int = 0, limit: int = 100) -> List[Item]:
        now = datetime.utcnow()
        return self.db.query(Item).filter(
            and_(
                Item.status == AuctionStatus.ACTIVE,
                Item.started <= now,
                Item.ends >= now
            )
        ).offset(skip).limit(limit).all()

    def start_auction(self, item_id: int) -> Optional[Item]:
        item = self.get(item_id)
        if item and item.status == AuctionStatus.DRAFT:
            item.status = AuctionStatus.ACTIVE
            item.started = datetime.utcnow()
            self.db.commit()
            self.db.refresh(item)
        return item

    def end_auction(self, item_id: int) -> Optional[Item]:
        item = self.get(item_id)
        if item and item.status == AuctionStatus.ACTIVE:
            item.status = AuctionStatus.ENDED
            self.db.commit()
            self.db.refresh(item)
        return item

    def update_current_bid(self, item_id: int, new_amount: float) -> Optional[Item]:
        item = self.get(item_id)
        if item:
            item.currently = new_amount
            item.number_of_bids += 1
            self.db.commit()
            self.db.refresh(item)
        return item

    def get_expired_auctions(self) -> List[Item]:
        """Get auctions that should be ended"""
        now = datetime.utcnow()
        return self.db.query(Item).filter(
            and_(
                Item.status == AuctionStatus.ACTIVE,
                Item.ends <= now
            )
        ).all()

    def can_modify_item(self, item: Item) -> bool:
        """Check if item can be modified (no bids and not started)"""
        return item.status == AuctionStatus.DRAFT or item.number_of_bids == 0

    def get_by_category(self, category_id: int, skip: int = 0, limit: int = 100) -> List[Item]:
        return self.db.query(Item).join(Item.categories).filter(
            Category.id == category_id,
            Item.status == AuctionStatus.ACTIVE
        ).offset(skip).limit(limit).all()
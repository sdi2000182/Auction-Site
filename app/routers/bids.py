from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.bid import BidCreate, Bid, BidConfirmation, BidSummary
from repositories.bid import BidRepository
from repositories.item import ItemRepository
from models.user import User as UserModel
from models.item import AuctionStatus
from auth.dependencies import get_bidder_user

router = APIRouter(prefix="/bids", tags=["bids"])


@router.post("/", response_model=BidConfirmation)
async def place_bid(
    bid_create: BidCreate,
    current_user: UserModel = Depends(get_bidder_user),
    db: Session = Depends(get_db)
):
    bid_repo = BidRepository(db)
    item_repo = ItemRepository(db)
    
    # Validate the bid
    is_valid, error_message = bid_repo.is_valid_bid(
        bid_create.item_id, 
        bid_create.amount, 
        current_user.id
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Get item details
    item = item_repo.get(bid_create.item_id)
    
    # Check if this is a "Buy Now" bid
    is_buy_now = False
    if item.buy_price and bid_create.amount >= item.buy_price:
        is_buy_now = True
        bid_create.amount = item.buy_price
    
    # Create the bid
    bid = bid_repo.create_bid(bid_create, current_user.id)
    
    # Update item's current bid
    item_repo.update_current_bid(bid_create.item_id, bid_create.amount)
    
    # If buy now, end the auction immediately
    if is_buy_now:
        item_repo.end_auction(bid_create.item_id)
    
    # Get the updated bid with relationships
    bid_with_details = bid_repo.get(bid.id)
    bid_with_details.bidder = current_user
    
    return BidConfirmation(
        message="Bid placed successfully" + (" - You won with Buy Now!" if is_buy_now else ""),
        bid=bid_with_details,
        is_winning=True,  # New bid is always winning
        is_buy_now=is_buy_now
    )


@router.get("/item/{item_id}", response_model=List[BidSummary])
async def get_item_bids(
    item_id: int,
    db: Session = Depends(get_db)
):
    bid_repo = BidRepository(db)
    item_repo = ItemRepository(db)
    
    # Check if item exists
    item = item_repo.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    bids = bid_repo.get_item_bids(item_id)
    
    # Convert to BidSummary format
    bid_summaries = []
    for bid in bids:
        bid_summaries.append(BidSummary(
            id=bid.id,
            amount=bid.amount,
            time=bid.time,
            bidder_username=bid.bidder.username,
            bidder_location=bid.bidder.location,
            bidder_country=bid.bidder.country,
            bidder_rating=bid.bidder.bidder_rating
        ))
    
    return bid_summaries


@router.get("/my-bids", response_model=List[Bid])
async def get_my_bids(
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_bidder_user),
    db: Session = Depends(get_db)
):
    bid_repo = BidRepository(db)
    bids = bid_repo.get_user_bids(current_user.id, skip=skip, limit=limit)
    return bids


@router.get("/my-winning-bids", response_model=List[Bid])
async def get_my_winning_bids(
    current_user: UserModel = Depends(get_bidder_user),
    db: Session = Depends(get_db)
):
    bid_repo = BidRepository(db)
    winning_bids = bid_repo.get_winning_bids_for_user(current_user.id)
    return winning_bids


@router.get("/{bid_id}", response_model=Bid)
async def get_bid(
    bid_id: int,
    current_user: UserModel = Depends(get_bidder_user),
    db: Session = Depends(get_db)
):
    bid_repo = BidRepository(db)
    bid = bid_repo.get(bid_id)
    
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    # Only allow access to own bids or if user is the item seller
    item_repo = ItemRepository(db)
    item = item_repo.get(bid.item_id)
    
    if bid.bidder_id != current_user.id and item.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this bid"
        )
    
    return bid
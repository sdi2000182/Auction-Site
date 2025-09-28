from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict
import xml.etree.ElementTree as ET
import json
from datetime import datetime
from database import get_db
from views.item_views import ItemViews
from views.user_views import UserViews
from repositories.item import ItemRepository
from repositories.bid import BidRepository
from models.user import User as UserModel
from models.item import Item
from models.bid import Bid
from auth.dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=Dict)
async def get_admin_dashboard(
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard data"""
    item_views = ItemViews(db)
    user_views = UserViews(db)
    
    return {
        "popular_items": item_views.get_popular_items(5),
        "ending_soon": item_views.get_ending_soon(24, 5),
        "category_stats": item_views.get_category_stats(),
        "user_stats": user_views.get_user_statistics(),
        "top_sellers": user_views.get_top_sellers(5),
        "recent_registrations": user_views.get_recent_registrations(5)
    }


@router.get("/export/xml")
async def export_auctions_xml(
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Export all auctions to XML format (eBay-like DTD)"""
    item_repo = ItemRepository(db)
    bid_repo = BidRepository(db)
    
    # Get all items with relationships
    items = db.query(Item).options(
        joinedload(Item.seller),
        joinedload(Item.categories),
        joinedload(Item.bids).joinedload(Bid.bidder)
    ).all()
    
    # Create XML root
    root = ET.Element("Items")
    
    for item in items:
        item_elem = ET.SubElement(root, "Item")
        item_elem.set("ItemID", str(item.id))
        
        # Basic item info
        ET.SubElement(item_elem, "Name").text = item.name
        
        # Categories
        for category in item.categories:
            ET.SubElement(item_elem, "Category").text = category.name
        
        ET.SubElement(item_elem, "Currently").text = f"${item.currently}"
        
        if item.buy_price:
            ET.SubElement(item_elem, "Buy_Price").text = f"${item.buy_price}"
        
        ET.SubElement(item_elem, "First_Bid").text = f"${item.first_bid}"
        ET.SubElement(item_elem, "Number_of_Bids").text = str(item.number_of_bids)
        
        # Bids
        bids_elem = ET.SubElement(item_elem, "Bids")
        for bid in item.bids:
            bid_elem = ET.SubElement(bids_elem, "Bid")
            
            bidder_elem = ET.SubElement(bid_elem, "Bidder")
            bidder_elem.set("UserID", bid.bidder.username)
            bidder_elem.set("Rating", str(bid.bidder.bidder_rating))
            
            if bid.bidder.location:
                ET.SubElement(bidder_elem, "Location").text = bid.bidder.location
            if bid.bidder.country:
                ET.SubElement(bidder_elem, "Country").text = bid.bidder.country
            
            ET.SubElement(bid_elem, "Time").text = bid.time.strftime("%b-%d-%y %H:%M:%S")
            ET.SubElement(bid_elem, "Amount").text = f"${bid.amount}"
        
        # Location info
        if item.location:
            location_elem = ET.SubElement(item_elem, "Location")
            location_elem.text = item.location
            if item.latitude and item.longitude:
                location_elem.set("Latitude", str(item.latitude))
                location_elem.set("Longitude", str(item.longitude))
        
        if item.country:
            ET.SubElement(item_elem, "Country").text = item.country
        
        # Timing
        if item.started:
            ET.SubElement(item_elem, "Started").text = item.started.strftime("%b-%d-%y %H:%M:%S")
        ET.SubElement(item_elem, "Ends").text = item.ends.strftime("%b-%d-%y %H:%M:%S")
        
        # Seller
        seller_elem = ET.SubElement(item_elem, "Seller")
        seller_elem.set("UserID", item.seller.username)
        seller_elem.set("Rating", str(item.seller.seller_rating))
        
        # Description
        if item.description:
            ET.SubElement(item_elem, "Description").text = item.description
    
    # Convert to string
    xml_str = ET.tostring(root, encoding='unicode')
    
    return Response(
        content=xml_str,
        media_type="application/xml",
        headers={"Content-Disposition": "attachment; filename=auctions.xml"}
    )


@router.get("/export/json")
async def export_auctions_json(
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Export all auctions to JSON format"""
    item_repo = ItemRepository(db)
    
    # Get all items with relationships
    items = db.query(Item).options(
        joinedload(Item.seller),
        joinedload(Item.categories),
        joinedload(Item.bids).joinedload(Bid.bidder)
    ).all()
    
    items_data = []
    for item in items:
        item_data = {
            "ItemID": item.id,
            "Name": item.name,
            "Categories": [cat.name for cat in item.categories],
            "Currently": item.currently,
            "Buy_Price": item.buy_price,
            "First_Bid": item.first_bid,
            "Number_of_Bids": item.number_of_bids,
            "Bids": [
                {
                    "Bidder": {
                        "UserID": bid.bidder.username,
                        "Rating": bid.bidder.bidder_rating,
                        "Location": bid.bidder.location,
                        "Country": bid.bidder.country
                    },
                    "Time": bid.time.isoformat(),
                    "Amount": bid.amount
                }
                for bid in item.bids
            ],
            "Location": {
                "Name": item.location,
                "Country": item.country,
                "Latitude": item.latitude,
                "Longitude": item.longitude
            },
            "Started": item.started.isoformat() if item.started else None,
            "Ends": item.ends.isoformat(),
            "Seller": {
                "UserID": item.seller.username,
                "Rating": item.seller.seller_rating
            },
            "Description": item.description
        }
        items_data.append(item_data)
    
    json_str = json.dumps({"Items": items_data}, indent=2)
    
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=auctions.json"}
    )


@router.get("/statistics", response_model=Dict)
async def get_detailed_statistics(
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get detailed system statistics"""
    from sqlalchemy import func, and_
    from models.item import Item, AuctionStatus
    from models.bid import Bid
    from models.user import User
    from models.message import Message
    
    # Auction statistics
    total_auctions = db.query(Item).count()
    active_auctions = db.query(Item).filter(Item.status == AuctionStatus.ACTIVE).count()
    completed_auctions = db.query(Item).filter(Item.status == AuctionStatus.ENDED).count()
    
    # Bidding statistics
    total_bids = db.query(Bid).count()
    total_bid_value = db.query(func.sum(Bid.amount)).scalar() or 0
    avg_bid_value = db.query(func.avg(Bid.amount)).scalar() or 0
    
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Message statistics
    total_messages = db.query(Message).count()
    unread_messages = db.query(Message).filter(Message.is_read == False).count()
    
    return {
        "auctions": {
            "total": total_auctions,
            "active": active_auctions,
            "completed": completed_auctions,
            "draft": total_auctions - active_auctions - completed_auctions
        },
        "bids": {
            "total": total_bids,
            "total_value": float(total_bid_value),
            "average_value": float(avg_bid_value)
        },
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": total_users - active_users
        },
        "messages": {
            "total": total_messages,
            "unread": unread_messages,
            "read": total_messages - unread_messages
        }
    }
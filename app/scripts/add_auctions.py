#!/usr/bin/env python3
"""
Script to create mock active auctions for testing
Usage: python scripts/create_mock_active_auctions.py [--count 20]
"""

import sys
import os
import argparse
import random
from datetime import datetime, timedelta

# Add the parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.item import Item, AuctionStatus
from models.user import User
from models.category import Category
from models.bid import Bid


def create_mock_active_auctions(db, count=20):
    """Create mock active auctions"""
    
    print(f"Creating {count} mock active auctions...")
    
    # Get existing users and categories
    users = db.query(User).filter(User.role == 'user').all()
    categories = db.query(Category).all()
    
    if not users:
        print("No users found. Please load XML data first.")
        return 0
    
    if not categories:
        print("No categories found. Creating default categories...")
        return 0
    
    mock_items = [
        "Vintage Leather Jacket - Excellent Condition",
        "Apple MacBook Pro 2021 - Like New",
        "Antique Victorian Mirror",
        "Professional Camera Canon EOS R5",
        "Designer Handbag - Authentic",
        "Gaming Console PlayStation 5",
        "Collectible Baseball Cards Set",
        "Handmade Ceramic Vase",
        "Vintage Vinyl Record Collection",
        "Smart Watch - Latest Model",
        "Electric Guitar Fender Stratocaster",
        "Artisan Coffee Table - Handcrafted",
        "Mountain Bike - High Performance",
        "Luxury Perfume Set - Unopened",
        "Rare Book First Edition",
        "Designer Sunglasses - Brand New",
        "Vintage Wine Collection",
        "Professional Art Supplies Kit",
        "Fitness Equipment Set",
        "Smartphone - Latest Generation",
        "Retro Gaming Console",
        "Handmade Jewelry Set",
        "Professional Kitchen Knives",
        "Collector's Edition Watch",
        "Vintage Poster Collection",
        "High-End Headphones",
        "Artisan Chocolate Gift Box",
        "Camping Gear Complete Set",
        "Designer Shoes - Limited Edition",
        "Home Theater System"
    ]
    
    descriptions = [
        "Beautiful item in excellent condition. Rarely used and well maintained.",
        "High quality product with original packaging. Perfect for collectors.",
        "Unique piece with great attention to detail. Don't miss this opportunity!",
        "Professional grade item suitable for both beginners and experts.",
        "Limited availability item in pristine condition. Great investment piece.",
        "Authentic and verified product. Comes with certificate of authenticity.",
        "Excellent craftsmanship and superior materials. A must-have item.",
        "Vintage piece with historical significance. Perfect for collectors.",
        "Modern design meets classic functionality. Great for everyday use.",
        "Premium quality item with warranty included. Satisfaction guaranteed."
    ]
    
    created_count = 0
    
    for i in range(count):
        try:
            # Select random seller
            seller = random.choice(users)
            
            # Select 1-3 random categories
            item_categories = random.sample(categories, random.randint(1, min(3, len(categories))))
            
            # Generate random item details
            name = random.choice(mock_items)
            description = random.choice(descriptions)
            first_bid = round(random.uniform(10, 500), 2)
            buy_price = round(first_bid * random.uniform(2, 5), 2) if random.choice([True, False]) else None
            
            # Set auction timing
            start_time = datetime.utcnow() - timedelta(hours=random.randint(1, 48))
            end_time = datetime.utcnow() + timedelta(days=random.randint(1, 14))
            
            # Create item
            item = Item(
                name=f"{name} #{i+1}",
                description=description,
                currently=first_bid,
                buy_price=buy_price,
                first_bid=first_bid,
                number_of_bids=0,
                location=seller.location or "Unknown Location",
                country=seller.country or "USA",
                latitude=seller.latitude,
                longitude=seller.longitude,
                started=start_time,
                ends=end_time,
                status=AuctionStatus.ACTIVE,
                seller_id=seller.id,
                categories=item_categories,
                images=[]  # Empty for mock data
            )
            
            db.add(item)
            db.flush()  # Get the ID without committing
            
            # Optionally add some bids to make it more realistic
            if random.choice([True, False]):
                num_bids = random.randint(1, 8)
                current_price = first_bid
                
                # Get potential bidders (excluding the seller)
                potential_bidders = [u for u in users if u.id != seller.id]
                
                for bid_num in range(num_bids):
                    if not potential_bidders:
                        break
                        
                    bidder = random.choice(potential_bidders)
                    current_price += round(random.uniform(5, 50), 2)
                    
                    bid_time = start_time + timedelta(
                        hours=random.randint(1, int((datetime.utcnow() - start_time).total_seconds() // 3600))
                    )
                    
                    bid = Bid(
                        amount=current_price,
                        time=bid_time,
                        item_id=item.id,
                        bidder_id=bidder.id
                    )
                    
                    db.add(bid)
                    
                    # Remove bidder to avoid duplicate bids from same user
                    potential_bidders.remove(bidder)
                
                # Update item with current highest bid
                item.currently = current_price
                item.number_of_bids = num_bids
            
            created_count += 1
            
            if created_count % 5 == 0:
                print(f"Created {created_count} items...")
                
        except Exception as e:
            print(f"Error creating item {i+1}: {e}")
            db.rollback()
            continue
    
    db.commit()
    print(f"Successfully created {created_count} mock active auctions")
    return created_count


def make_existing_items_active(db, count=10):
    """Make existing ended items active"""
    print(f"Making {count} existing items active...")
    
    ended_items = db.query(Item).filter(
        Item.status == AuctionStatus.ENDED
    ).limit(count).all()
    
    updated_count = 0
    for item in ended_items:
        # Update to active with future end time
        item.status = AuctionStatus.ACTIVE
        item.started = datetime.utcnow() - timedelta(hours=random.randint(1, 24))
        item.ends = datetime.utcnow() + timedelta(days=random.randint(3, 14))
        updated_count += 1
    
    db.commit()
    print(f"Made {updated_count} existing items active")
    return updated_count


def main():
    parser = argparse.ArgumentParser(description='Create mock active auctions')
    parser.add_argument('--count', type=int, default=20, help='Number of mock auctions to create')
    parser.add_argument('--activate-existing', type=int, metavar='COUNT',
                       help='Make COUNT existing ended auctions active instead')
    
    args = parser.parse_args()
    
    # Create database session
    db = SessionLocal()
    
    try:
        if args.activate_existing:
            updated = make_existing_items_active(db, args.activate_existing)
            print(f"✅ Activated {updated} existing auctions")
        else:
            created = create_mock_active_auctions(db, args.count)
            print(f"✅ Created {created} new mock active auctions")
        
        # Show summary
        from models.item import Item
        active_count = db.query(Item).filter(Item.status == AuctionStatus.ACTIVE).count()
        total_count = db.query(Item).count()
        
        print(f"📊 Total active auctions: {active_count}")
        print(f"📊 Total auctions in database: {total_count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()
    
    print("🎉 Mock data creation completed!")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Script to load XML auction data into the database
Usage: python scripts/load_xml_data.py path/to/your/file.xml [--active]
"""

import sys
import os
import argparse

# Add the parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from utils.data_loader import XMLDataLoader


def main():
    parser = argparse.ArgumentParser(description='Load XML auction data into database')
    parser.add_argument('xml_file', help='Path to XML file to load')
    parser.add_argument('--active', action='store_true', 
                       help='Make loaded auctions active (default: ended)')
    parser.add_argument('--sample', action='store_true',
                       help='Load only first 100 items for testing')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.xml_file):
        print(f"Error: File {args.xml_file} not found")
        sys.exit(1)
    
    print(f"Loading XML data from: {args.xml_file}")
    print(f"Make auctions active: {args.active}")
    
    # Create database session
    db = SessionLocal()
    
    try:
        loader = XMLDataLoader(db)
        
        if args.sample:
            # Load sample data for testing
            xml_data = loader.parse_xml_file(args.xml_file)
            sample_data = xml_data[:100]  # First 100 items
            loaded_count = loader.load_items_from_xml_data(sample_data, args.active)
        else:
            # Load full file
            loaded_count = loader.load_xml_file(args.xml_file, args.active)
        
        print(f"\n✅ Successfully loaded {loaded_count} items")
        print(f"📊 Created {len(loader.created_users)} new users")
        print(f"🏷️ Used {len(loader.category_mapping)} categories")
        
        # Show some statistics
        from models.user import User
        from models.item import Item
        from models.bid import Bid
        
        total_users = db.query(User).count()
        total_items = db.query(Item).count()
        total_bids = db.query(Bid).count()
        
        print(f"\n📈 Database Statistics:")
        print(f"   Total Users: {total_users}")
        print(f"   Total Items: {total_items}")
        print(f"   Total Bids: {total_bids}")
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        sys.exit(1)
    finally:
        db.close()
    
    print("\n🎉 Data loading completed!")


if __name__ == "__main__":
    main()
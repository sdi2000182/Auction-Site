import xml.etree.ElementTree as ET
from typing import List, Dict
from sqlalchemy.orm import Session
from datetime import datetime
from models.user import User, UserRole
from models.item import Item, AuctionStatus
from models.bid import Bid
from models.category import Category
from repositories.user import UserRepository
from repositories.item import ItemRepository
from repositories.bid import BidRepository
from repositories.category import CategoryRepository
from utils.password import get_password_hash
import random


class XMLDataLoader:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.item_repo = ItemRepository(db)
        self.bid_repo = BidRepository(db)
        self.category_repo = CategoryRepository(db)
        
        # Track created users to avoid duplicates
        self.created_users = set()
        self.user_id_mapping = {}  # Map XML usernames to DB user IDs
        self.category_mapping = {}  # Map category names to DB category IDs

    def parse_xml_file(self, file_path: str) -> List[Dict]:
        """Parse XML file and extract item data"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            items_data = []
            for item_elem in root.findall('Item'):
                item_data = self._parse_item_element(item_elem)
                items_data.append(item_data)
            
            return items_data
        except Exception as e:
            print(f"Error parsing XML file {file_path}: {e}")
            return []

    def _parse_item_element(self, item_elem) -> Dict:
        """Parse individual item element from XML"""
        item_data = {
            'xml_id': item_elem.get('ItemID'),
            'name': item_elem.find('Name').text if item_elem.find('Name') is not None else '',
            'description': item_elem.find('Description').text if item_elem.find('Description') is not None else '',
            'currently': self._parse_price(item_elem.find('Currently')),
            'buy_price': self._parse_price(item_elem.find('Buy_Price')),
            'first_bid': self._parse_price(item_elem.find('First_Bid')),
            'number_of_bids': int(item_elem.find('Number_of_Bids').text) if item_elem.find('Number_of_Bids') is not None else 0,
            'location': item_elem.find('Location').text if item_elem.find('Location') is not None else '',
            'country': item_elem.find('Country').text if item_elem.find('Country') is not None else '',
            'started': self._parse_datetime(item_elem.find('Started')),
            'ends': self._parse_datetime(item_elem.find('Ends')),
            'categories': self._parse_categories(item_elem),
            'seller': self._parse_seller(item_elem.find('Seller')),
            'bids': self._parse_bids(item_elem.find('Bids'))
        }
        
        # Parse location coordinates if available
        location_elem = item_elem.find('Location')
        if location_elem is not None:
            item_data['latitude'] = float(location_elem.get('Latitude')) if location_elem.get('Latitude') else None
            item_data['longitude'] = float(location_elem.get('Longitude')) if location_elem.get('Longitude') else None
        
        return item_data

    def _parse_price(self, price_elem) -> float:
        """Parse price from XML element (removes $ sign)"""
        if price_elem is None or not price_elem.text:
            return 0.0
        price_text = price_elem.text.replace('$', '').replace(',', '')
        try:
            return float(price_text)
        except ValueError:
            return 0.0

    def _parse_datetime(self, datetime_elem) -> datetime:
        """Parse datetime from XML element"""
        if datetime_elem is None or not datetime_elem.text:
            return datetime.utcnow()
        
        try:
            # Handle format like "Dec-10-01 13:27:55"
            datetime_str = datetime_elem.text
            return datetime.strptime(datetime_str, "%b-%d-%y %H:%M:%S")
        except ValueError:
            return datetime.utcnow()

    def _parse_categories(self, item_elem) -> List[str]:
        """Parse categories from item element"""
        categories = []
        for cat_elem in item_elem.findall('Category'):
            if cat_elem.text:
                categories.append(cat_elem.text.strip())
        return categories

    def _parse_seller(self, seller_elem) -> Dict:
        """Parse seller information"""
        if seller_elem is None:
            return {'username': 'unknown_seller', 'rating': 0}
        
        return {
            'username': seller_elem.get('UserID', 'unknown_seller'),
            'rating': float(seller_elem.get('Rating', 0))
        }

    def _parse_bids(self, bids_elem) -> List[Dict]:
        """Parse bids from XML element"""
        if bids_elem is None:
            return []
        
        bids = []
        for bid_elem in bids_elem.findall('Bid'):
            bidder_elem = bid_elem.find('Bidder')
            time_elem = bid_elem.find('Time')
            amount_elem = bid_elem.find('Amount')
            
            if bidder_elem is not None:
                bid_data = {
                    'bidder': {
                        'username': bidder_elem.get('UserID', 'unknown_bidder'),
                        'rating': float(bidder_elem.get('Rating', 0)),
                        'location': bidder_elem.find('Location').text if bidder_elem.find('Location') is not None else '',
                        'country': bidder_elem.find('Country').text if bidder_elem.find('Country') is not None else ''
                    },
                    'time': self._parse_datetime(time_elem),
                    'amount': self._parse_price(amount_elem)
                }
                bids.append(bid_data)
        
        return bids

    def create_or_get_user(self, username: str, user_data: Dict = None) -> User:
        """Create or get existing user"""
        if username in self.user_id_mapping:
            return self.user_repo.get(self.user_id_mapping[username])
        
        # Check if user already exists
        existing_user = self.user_repo.get_by_username(username)
        if existing_user:
            self.user_id_mapping[username] = existing_user.id
            return existing_user
        
        # Create new user with synthetic data
        user_data = user_data or {}
        
        # Generate synthetic user data
        first_names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma', 'Tom', 'Anna']
        last_names = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas']
        
        user = User(
            username=username,
            email=f"{username}@example.com",
            hashed_password=get_password_hash("password123"),  # Default password
            first_name=user_data.get('first_name', random.choice(first_names)),
            last_name=user_data.get('last_name', random.choice(last_names)),
            phone=f"+1{random.randint(1000000000, 9999999999)}",
            address=user_data.get('location', 'Unknown Address'),
            location=user_data.get('location', 'USA'),
            country=user_data.get('country', 'USA'),
            latitude=user_data.get('latitude'),
            longitude=user_data.get('longitude'),
            afm=f"{random.randint(100000000, 999999999)}",  # Generate random AFM
            role=UserRole.USER,  # All users can both bid and sell
            is_approved=True,  # Auto-approve for demo data
            is_active=True,
            seller_rating=user_data.get('seller_rating', 0.0),
            bidder_rating=user_data.get('bidder_rating', 0.0)
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        self.user_id_mapping[username] = user.id
        self.created_users.add(username)
        
        return user

    def create_or_get_category(self, category_name: str) -> Category:
        """Create or get existing category"""
        if category_name in self.category_mapping:
            return self.category_repo.get(self.category_mapping[category_name])
        
        # Check if category exists
        existing_category = self.category_repo.get_by_name(category_name)
        if existing_category:
            self.category_mapping[category_name] = existing_category.id
            return existing_category
        
        # Create new category
        category = Category(
            name=category_name,
            description=f"Category for {category_name} items"
        )
        
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        
        self.category_mapping[category_name] = category.id
        return category

    def load_items_from_xml_data(self, xml_data: List[Dict], make_active: bool = False) -> int:
        """Load items from parsed XML data into database"""
        loaded_count = 0
        
        for item_data in xml_data:
            try:
                # Create seller user
                seller_info = item_data['seller']
                seller = self.create_or_get_user(
                    seller_info['username'], 
                    {
                        'seller_rating': seller_info['rating'],
                        'location': item_data.get('location'),
                        'country': item_data.get('country')
                    }
                )
                
                # Update seller role if they're selling
                if seller.role == UserRole.USER:
                    # User is already set to USER role, which allows both buying and selling
                    pass
                
                # Create categories
                categories = []
                for cat_name in item_data['categories']:
                    category = self.create_or_get_category(cat_name)
                    categories.append(category)
                
                # Create item
                item = Item(
                    name=item_data['name'][:200],  # Truncate to fit column limit
                    description=item_data['description'],
                    currently=item_data['currently'],
                    buy_price=item_data['buy_price'] if item_data['buy_price'] > 0 else None,
                    first_bid=item_data['first_bid'],
                    number_of_bids=item_data['number_of_bids'],
                    location=item_data['location'],
                    country=item_data['country'],
                    latitude=item_data.get('latitude'),
                    longitude=item_data.get('longitude'),
                    started=item_data['started'],
                    ends=item_data['ends'],
                    status=AuctionStatus.ACTIVE if make_active else AuctionStatus.ENDED,
                    seller_id=seller.id,
                    categories=categories
                )
                
                self.db.add(item)
                self.db.commit()
                self.db.refresh(item)
                
                # Create bids
                for bid_data in item_data['bids']:
                    bidder_info = bid_data['bidder']
                    bidder = self.create_or_get_user(
                        bidder_info['username'],
                        {
                            'bidder_rating': bidder_info['rating'],
                            'location': bidder_info['location'],
                            'country': bidder_info['country']
                        }
                    )
                    
                    bid = Bid(
                        amount=bid_data['amount'],
                        time=bid_data['time'],
                        item_id=item.id,
                        bidder_id=bidder.id
                    )
                    
                    self.db.add(bid)
                
                self.db.commit()
                loaded_count += 1
                
                if loaded_count % 100 == 0:
                    print(f"Loaded {loaded_count} items...")
                    
            except Exception as e:
                print(f"Error loading item {item_data.get('xml_id', 'unknown')}: {e}")
                self.db.rollback()
                continue
        
        return loaded_count

    def load_xml_file(self, file_path: str, make_active: bool = False) -> int:
        """Load XML file into database"""
        print(f"Parsing XML file: {file_path}")
        xml_data = self.parse_xml_file(file_path)
        
        if not xml_data:
            print("No data found in XML file")
            return 0
        
        print(f"Found {len(xml_data)} items in XML file")
        
        loaded_count = self.load_items_from_xml_data(xml_data, make_active)
        
        print(f"Successfully loaded {loaded_count} items from {file_path}")
        print(f"Created {len(self.created_users)} new users")
        print(f"Created {len(self.category_mapping)} categories")
        
        return loaded_count
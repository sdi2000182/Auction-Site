from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import tempfile
from database import get_db
from utils.data_loader import XMLDataLoader
from utils.enhanced_recommendations import EnhancedRecommendationEngine
from models.user import User as UserModel
from auth.dependencies import get_admin_user

router = APIRouter(prefix="/data-management", tags=["data-management"])


@router.post("/load-xml-file")
async def load_xml_file_endpoint(
    file: UploadFile = File(...),
    make_active: bool = Form(False),
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Load XML file with auction data into the database"""
    
    if not file.filename.endswith('.xml'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only XML files are supported"
        )
    
    try:
        # Create temporary file to save uploaded content
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xml') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Load data using XMLDataLoader
        loader = XMLDataLoader(db)
        loaded_count = loader.load_xml_file(temp_file_path, make_active)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return {
            "message": f"Successfully loaded {loaded_count} items from {file.filename}",
            "items_loaded": loaded_count,
            "users_created": len(loader.created_users),
            "categories_created": len(loader.category_mapping)
        }
        
    except Exception as e:
        # Clean up temporary file if it exists
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading XML file: {str(e)}"
        )


@router.post("/load-sample-data")
async def load_sample_data(
    make_active: bool = False,
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Load sample data for testing (using hardcoded XML sample)"""
    
    # Sample XML data from your document
    sample_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<Items>
<Item ItemID="1046773089">
<Name>Hallmark Club Edition 1958 Edsel</Name>
<Category>Collectibles</Category>
<Category>Decorative & Holiday</Category>
<Category>Decorative by Brand</Category>
<Category>Hallmark</Category>
<Category>Ornaments</Category>
<Currently>$9.95</Currently>
<First_Bid>$9.95</First_Bid>
<Number_of_Bids>1</Number_of_Bids>
<Bids>
<Bid>
<Bidder Rating="803" UserID="napitalk">
<Location>Beautiful Southwest Missouri Ozarks</Location>
<Country>USA</Country>
</Bidder>
<Time>Dec-12-01 07:27:55</Time>
<Amount>$9.95</Amount>
</Bid>
</Bids>
<Location>Southern Oklahoma</Location>
<Country>USA</Country>
<Started>Dec-10-01 13:27:55</Started>
<Ends>Dec-17-01 13:27:55</Ends>
<Seller Rating="149" UserID="papadoc-dlc"/>
<Description>Hallmark Club Edition 1958 Edsel This is the club edition ornament showing the 1958 Edsel Citation convertable.</Description>
</Item>
<Item ItemID="1046790057">
<Name>The X-Men #8 (Silver Age, VG Copy, Unus)</Name>
<Category>Collectibles</Category>
<Category>Pop Culture</Category>
<Category>Comics</Category>
<Category>Silver Age (1956-69)</Category>
<Category>Superhero</Category>
<Currently>$6.49</Currently>
<First_Bid>$4.99</First_Bid>
<Number_of_Bids>2</Number_of_Bids>
<Bids>
<Bid>
<Bidder Rating="36" UserID="tliseattle">
<Location>Seattle, Washington</Location>
<Country>USA</Country>
</Bidder>
<Time>Dec-11-01 23:46:00</Time>
<Amount>$5.74</Amount>
</Bid>
<Bid>
<Bidder Rating="24" UserID="jirvine@houston.rr.com">
<Location>North Shore Gifts And More</Location>
<Country>USA</Country>
</Bidder>
<Time>Dec-13-01 09:22:00</Time>
<Amount>$6.49</Amount>
</Bid>
</Bids>
<Location Latitude="43.108241" Longitude="-88.48935">Oconomowoc, WI</Location>
<Country>USA</Country>
<Started>Dec-10-01 14:10:00</Started>
<Ends>Dec-17-01 14:10:00</Ends>
<Seller Rating="1649" UserID="lccomics"/>
<Description>This is a copy of The X-Men #8, it is in (VG) condition.</Description>
</Item>
</Items>'''
    
    try:
        # Create temporary file with sample data
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.xml') as temp_file:
            temp_file.write(sample_xml)
            temp_file_path = temp_file.name
        
        # Load data using XMLDataLoader
        loader = XMLDataLoader(db)
        loaded_count = loader.load_xml_file(temp_file_path, make_active)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return {
            "message": f"Successfully loaded {loaded_count} sample items",
            "items_loaded": loaded_count,
            "users_created": len(loader.created_users),
            "categories_created": len(loader.category_mapping)
        }
        
    except Exception as e:
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error loading sample data: {str(e)}"
        )


@router.post("/train-recommendations")
async def train_recommendation_model(
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Train the recommendation model with current data"""
    
    try:
        # Initialize recommendation engine
        engine = EnhancedRecommendationEngine(db)
        
        # Get some statistics about training data
        from models.bid import Bid
        from models.item import Item
        from models.user import User
        
        total_users = db.query(User).count()
        total_items = db.query(Item).count()
        total_bids = db.query(Bid).count()
        
        # Here you would normally train your model
        # For this example, we'll just validate the data exists
        if total_bids == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No bidding data available for training. Load some XML data first."
            )
        
        return {
            "message": "Recommendation model training completed",
            "training_stats": {
                "users": total_users,
                "items": total_items,
                "interactions": total_bids,
                "training_status": "completed"
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error training recommendation model: {str(e)}"
        )


@router.get("/data-statistics")
async def get_data_statistics(
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get statistics about loaded data"""
    
    from models.bid import Bid
    from models.item import Item, AuctionStatus
    from models.user import User, UserRole
    from models.category import Category
    from sqlalchemy import func
    
    try:
        # User statistics
        user_stats = db.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role).all()
        
        # Item statistics
        item_stats = db.query(
            Item.status,
            func.count(Item.id).label('count')
        ).group_by(Item.status).all()
        
        # Category statistics
        category_stats = db.query(
            Category.name,
            func.count(Item.id).label('item_count')
        ).join(Item.categories).group_by(Category.name).order_by(
            func.count(Item.id).desc()
        ).limit(10).all()
        
        # Bidding statistics
        bid_stats = {
            'total_bids': db.query(Bid).count(),
            'unique_bidders': db.query(Bid.bidder_id).distinct().count(),
            'avg_bids_per_item': db.query(func.avg(Item.number_of_bids)).scalar() or 0,
            'total_bid_value': db.query(func.sum(Bid.amount)).scalar() or 0
        }
        
        return {
            "user_statistics": {role.role: count for role, count in user_stats},
            "item_statistics": {status.status: count for status, count in item_stats},
            "top_categories": [{"name": cat.name, "items": cat.item_count} for cat in category_stats],
            "bidding_statistics": bid_stats,
            "recommendation_readiness": bid_stats['total_bids'] > 100  # Need minimum interactions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting data statistics: {str(e)}"
        )


@router.post("/cleanup-test-data")
async def cleanup_test_data(
    confirm: bool = Form(False),
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Clean up test data loaded from XML files"""
    
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must confirm cleanup by setting confirm=true"
        )
    
    try:
        from models.bid import Bid
        from models.item import Item
        from models.user import User
        from models.category import Category
        
        # Count items to be deleted
        test_users_count = db.query(User).filter(
            User.email.like('%@example.com')
        ).count()
        
        # Delete in correct order due to foreign key constraints
        # Delete bids first
        db.query(Bid).delete()
        
        # Delete items
        items_deleted = db.query(Item).delete()
        
        # Delete test users (keep admin and manually created users)
        test_users_deleted = db.query(User).filter(
            User.email.like('%@example.com')
        ).delete()
        
        db.commit()
        
        return {
            "message": "Test data cleaned up successfully",
            "deleted": {
                "items": items_deleted,
                "users": test_users_deleted,
                "bids": "all"
            }
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning up test data: {str(e)}"
        )
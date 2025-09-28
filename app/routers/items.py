from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from pathlib import Path
from database import get_db
from schemas.item import Item, ItemCreate, ItemUpdate, ItemSearch, ItemSummary, ImageUploadRequest
from repositories.item import ItemRepository
from repositories.category import CategoryRepository
from models.user import User as UserModel
from models.item import AuctionStatus
from auth.dependencies import get_current_user, require_can_sell, get_approved_user, get_seller_user

router = APIRouter(prefix="/items", tags=["items"])

# Ensure upload directory exists
UPLOAD_DIR = Path("uploads/items")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/test-upload")
async def test_upload(files: List[UploadFile] = File(...)):
    """Simple test endpoint for file upload"""
    return {"message": f"Received {len(files)} files", "filenames": [f.filename for f in files]}


@router.post("/upload-images")
async def upload_images(
    request: ImageUploadRequest,
    current_user: UserModel = Depends(get_approved_user)
):
    """Upload images for auction items"""
    import base64
    import uuid

    if len(request.images) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images allowed"
        )

    uploaded_files = []

    try:
        for image_data in request.images:
            # Validate file type from filename
            file_ext = Path(image_data.filename).suffix.lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type {file_ext} not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}"
                )

            # Decode base64 content
            try:
                content = base64.b64decode(image_data.content)
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid base64 image data"
                )

            # Check file size
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File size must be less than 5MB"
                )

            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = UPLOAD_DIR / unique_filename

            # Save file
            with open(file_path, "wb") as buffer:
                buffer.write(content)

            # Store relative path for database
            uploaded_files.append(f"/uploads/items/{unique_filename}")

    except HTTPException:
        # Clean up any uploaded files if error occurs
        for uploaded_file in uploaded_files:
            file_path = Path(".") / uploaded_file.lstrip("/")
            if file_path.exists():
                file_path.unlink()
        raise
    except Exception as e:
        # Clean up any uploaded files if error occurs
        for uploaded_file in uploaded_files:
            file_path = Path(".") / uploaded_file.lstrip("/")
            if file_path.exists():
                file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading files: {str(e)}"
        )

    return {"image_urls": uploaded_files}


@router.post("/", response_model=Item)
async def create_item(
    item_create: ItemCreate,
    current_user: UserModel = Depends(require_can_sell),
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    category_repo = CategoryRepository(db)
    
    # Validate categories exist
    if item_create.category_ids:
        for category_id in item_create.category_ids:
            if not category_repo.get(category_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category with id {category_id} not found"
                )
    
    item = item_repo.create_item(item_create, current_user.id)
    return item_repo.get_with_details(item.id)


@router.get("/search", response_model=dict)
async def search_items(
    query: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    location: Optional[str] = None,
    status: Optional[AuctionStatus] = AuctionStatus.ACTIVE,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    
    search_params = ItemSearch(
        query=query,
        category_id=category_id,
        min_price=min_price,
        max_price=max_price,
        location=location,
        status=status,
        page=page,
        size=size
    )
    
    items, total = item_repo.search_items(search_params)
    
    # Convert to proper response format
    items_response = []
    for item in items:
        items_response.append({
            "id": item.id,
            "name": item.name,
            "currently": item.currently,
            "number_of_bids": item.number_of_bids,
            "ends": item.ends.isoformat() if item.ends else None,
            "status": item.status,
            "images": item.images,
            "location": item.location,
            "seller": {
                "id": item.seller.id,
                "username": item.seller.username,
                "seller_rating": item.seller.seller_rating
            } if item.seller else None,
            "categories": [{"id": cat.id, "name": cat.name} for cat in item.categories]
        })
    
    return {
        "items": items_response,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size
    }


@router.get("/active", response_model=List[ItemSummary])
async def get_active_items(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    items = item_repo.get_active_items(skip=skip, limit=limit)
    return items


@router.get("/my-items", response_model=List[Item])
async def get_my_items(
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    items = item_repo.get_by_seller(current_user.id, skip=skip, limit=limit)
    return [item_repo.get_with_details(item.id) for item in items]


@router.get("/category/{category_id}", response_model=List[ItemSummary])
async def get_items_by_category(
    category_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    category_repo = CategoryRepository(db)
    
    # Check if category exists
    if not category_repo.get(category_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    items = item_repo.get_by_category(category_id, skip=skip, limit=limit)
    return items


@router.get("/{item_id}", response_model=Item)
async def get_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    item = item_repo.get_with_details(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    return item


@router.put("/{item_id}", response_model=Item)
async def update_item(
    item_id: int,
    item_update: ItemUpdate,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    item = item_repo.get(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    if item.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this item"
        )
    
    if not item_repo.can_modify_item(item):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify item after auction has started or bids have been placed"
        )
    
    # Validate categories if provided
    if item_update.category_ids:
        category_repo = CategoryRepository(db)
        for category_id in item_update.category_ids:
            if not category_repo.get(category_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category with id {category_id} not found"
                )
        
        # Update categories
        from models.category import Category
        categories = category_repo.db.query(Category).filter(
            Category.id.in_(item_update.category_ids)
        ).all()
        item.categories = categories
    
    updated_item = item_repo.update(db_obj=item, obj_in=item_update.dict(exclude={"category_ids"}))
    return item_repo.get_with_details(updated_item.id)


@router.post("/{item_id}/start", response_model=dict)
async def start_auction(
    item_id: int,
    current_user: UserModel = Depends(get_seller_user),
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    item = item_repo.get(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    if item.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to start this auction"
        )
    
    if item.status != AuctionStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auction can only be started from draft status"
        )
    
    started_item = item_repo.start_auction(item_id)
    return {"message": "Auction started successfully", "item_id": started_item.id}


@router.delete("/{item_id}", response_model=dict)
async def delete_item(
    item_id: int,
    current_user: UserModel = Depends(get_seller_user),
    db: Session = Depends(get_db)
):
    item_repo = ItemRepository(db)
    item = item_repo.get(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    if item.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this item"
        )
    
    if not item_repo.can_modify_item(item):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete item after auction has started or bids have been placed"
        )
    
    item_repo.remove(id=item_id)
    return {"message": "Item deleted successfully"}
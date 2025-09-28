from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.category import Category, CategoryCreate, CategoryUpdate
from repositories.category import CategoryRepository
from models.user import User as UserModel
from auth.dependencies import get_admin_user

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=List[Category])
async def get_all_categories(db: Session = Depends(get_db)):
    category_repo = CategoryRepository(db)
    return category_repo.get_all_categories()


@router.post("/", response_model=Category)
async def create_category(
    category_create: CategoryCreate,
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    category_repo = CategoryRepository(db)
    
    # Check if category name already exists
    existing_category = category_repo.get_by_name(category_create.name)
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name already exists"
        )
    
    return category_repo.create_category(category_create)


@router.get("/{category_id}", response_model=Category)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    category_repo = CategoryRepository(db)
    category = category_repo.get(category_id)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category


@router.put("/{category_id}", response_model=Category)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    category_repo = CategoryRepository(db)
    category = category_repo.get(category_id)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if new name conflicts with existing category
    if category_update.name and category_update.name != category.name:
        existing_category = category_repo.get_by_name(category_update.name)
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists"
            )
    
    return category_repo.update(db_obj=category, obj_in=category_update)


@router.delete("/{category_id}", response_model=dict)
async def delete_category(
    category_id: int,
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    category_repo = CategoryRepository(db)
    category = category_repo.get(category_id)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    category_repo.remove(id=category_id)
    return {"message": "Category deleted successfully"}
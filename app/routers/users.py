from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.user import User, UserUpdate, UserApproval, UserProfile
from repositories.user import UserRepository
from models.user import User as UserModel
from auth.dependencies import get_current_user, get_admin_user, get_approved_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=User)
async def get_current_user_profile(
    current_user: UserModel = Depends(get_current_user)
):
    return current_user


@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_approved_user),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    updated_user = user_repo.update(db_obj=current_user, obj_in=user_update)
    return updated_user


@router.get("/", response_model=List[User])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    users = user_repo.get_multi(skip=skip, limit=limit)
    return users


@router.get("/pending", response_model=List[User])
async def get_pending_users(
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    pending_users = user_repo.get_pending_users()
    return pending_users


@router.post("/approve", response_model=dict)
async def approve_user(
    approval: UserApproval,
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    
    user = user_repo.get(approval.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if approval.is_approved:
        approved_user = user_repo.approve_user(approval.user_id)
        return {"message": f"User {approved_user.username} approved successfully"}
    else:
        # Deactivate user instead of approving
        deactivated_user = user_repo.deactivate_user(approval.user_id)
        return {"message": f"User {deactivated_user.username} rejected and deactivated"}


@router.get("/{user_id}", response_model=UserProfile)
async def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = user_repo.get(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.delete("/{user_id}", response_model=dict)
async def deactivate_user(
    user_id: int,
    current_user: UserModel = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    
    user = user_repo.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    deactivated_user = user_repo.deactivate_user(user_id)
    return {"message": f"User {deactivated_user.username} deactivated successfully"}
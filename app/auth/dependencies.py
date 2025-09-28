from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from auth.jwt_handler import verify_token
from models.user import User, UserRole
from repositories.user import UserRepository

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    token_data = verify_token(token)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_repo = UserRepository(db)
    user = user_repo.get_by_username(token_data["username"])
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user


def get_approved_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not approved yet"
        )
    return current_user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


def get_seller_user(current_user: User = Depends(get_approved_user)) -> User:
    if current_user.role not in [UserRole.SELLER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller permissions required"
        )
    return current_user


def get_bidder_user(current_user: User = Depends(get_approved_user)) -> User:
    if current_user.role not in [UserRole.USER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bidder permissions required"
        )
    return current_user


# Optional authentication for visitors
def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security, use_cache=False),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
    
    
def require_can_sell(current_user: User = Depends(get_approved_user)) -> User:
    if not current_user.can_sell:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create auctions"
        )
    return current_user
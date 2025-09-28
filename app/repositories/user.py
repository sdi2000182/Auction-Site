from typing import Optional, List
from sqlalchemy.orm import Session
from repositories.base import BaseRepository
from models.user import User
from schemas.user import UserCreate, UserUpdate
from utils.password import get_password_hash, verify_password


class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_afm(self, afm: str) -> Optional[User]:
        return self.db.query(User).filter(User.afm == afm).first()

    def create_user(self, user_create: UserCreate) -> User:
        # Hash the password
        hashed_password = get_password_hash(user_create.password)
        
        # Create user data without password fields
        user_data = user_create.dict(exclude={"password", "confirm_password"})
        user_data["hashed_password"] = hashed_password
        
        db_user = User(**user_data)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def authenticate(self, username: str, password: str) -> Optional[User]:
        user = self.get_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def get_pending_users(self) -> List[User]:
        return self.db.query(User).filter(User.is_approved == False).all()

    def approve_user(self, user_id: int) -> Optional[User]:
        user = self.get(user_id)
        if user:
            user.is_approved = True
            self.db.commit()
            self.db.refresh(user)
        return user

    def deactivate_user(self, user_id: int) -> Optional[User]:
        user = self.get(user_id)
        if user:
            user.is_active = False
            self.db.commit()
            self.db.refresh(user)
        return user

    def update_rating(self, user_id: int, rating: float, is_seller: bool = True) -> Optional[User]:
        user = self.get(user_id)
        if user:
            if is_seller:
                user.seller_rating = rating
            else:
                user.bidder_rating = rating
            self.db.commit()
            self.db.refresh(user)
        return user
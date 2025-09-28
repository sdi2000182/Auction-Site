from typing import Optional, List
from sqlalchemy.orm import Session
from repositories.base import BaseRepository
from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository(BaseRepository[Category, CategoryCreate, CategoryUpdate]):
    def __init__(self, db: Session):
        super().__init__(Category, db)

    def get_by_name(self, name: str) -> Optional[Category]:
        return self.db.query(Category).filter(Category.name == name).first()

    def get_all_categories(self) -> List[Category]:
        return self.db.query(Category).order_by(Category.name).all()

    def create_category(self, category_create: CategoryCreate) -> Category:
        db_category = Category(**category_create.dict())
        self.db.add(db_category)
        self.db.commit()
        self.db.refresh(db_category)
        return db_category
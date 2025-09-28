from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

# Association table for many-to-many relationship between items and categories
item_categories = Table(
    'item_categories',
    Base.metadata,
    Column('item_id', Integer, ForeignKey('items.id'), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True)
)


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500))

    # Relationships
    items = relationship("Item", secondary=item_categories, back_populates="categories")
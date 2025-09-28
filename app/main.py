from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from pathlib import Path

from config import settings
from database import engine, Base
from routers import auth, users, items, bids, categories, messages, admin, dashboard
from repositories.user import UserRepository
from models.user import User, UserRole
from utils.password import get_password_hash
from database import SessionLocal

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Electronic Auctions System API",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
uploads_dir = Path("uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
items_dir = uploads_dir / "items"
items_dir.mkdir(parents=True, exist_ok=True)

# Mount static files for uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(items.router, prefix="/api/v1")
app.include_router(bids.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    """Create default admin user and categories on startup"""
    db = SessionLocal()
    try:
        user_repo = UserRepository(db)

        # Create default admin user if not exists
        admin_user = user_repo.get_by_username("admin")
        if not admin_user:
            admin_data = {
                "username": "admin",
                "email": "admin@auction.com",
                "hashed_password": get_password_hash("admin123"),
                "first_name": "System",
                "last_name": "Administrator",
                "phone": "1234567890",
                "address": "System Address",
                "location": "Athens",
                "country": "Greece",
                "latitude": 37.9755,
                "longitude": 23.7348,
                "afm": "000000000",
                "role": UserRole.ADMIN,
                "is_approved": True,
                "is_active": True
            }
            admin_user = User(**admin_data)
            db.add(admin_user)
            db.commit()
            print("Default admin user created: username='admin', password='admin123'")

        # Create default categories
        from repositories.category import CategoryRepository
        category_repo = CategoryRepository(db)

        default_categories = [
            {"name": "Electronics", "description": "Electronic devices and gadgets"},
            {"name": "Clothing & Accessories", "description": "Fashion items and accessories"},
            {"name": "Home & Garden", "description": "Home improvement and garden items"},
            {"name": "Sports & Outdoors", "description": "Sports equipment and outdoor gear"},
            {"name": "Books & Media", "description": "Books, movies, music and media"},
            {"name": "Automotive", "description": "Car parts and automotive accessories"},
            {"name": "Collectibles", "description": "Collectible items and antiques"},
            {"name": "Art & Crafts", "description": "Art supplies and handmade items"}
        ]

        for cat_data in default_categories:
            if not category_repo.get_by_name(cat_data["name"]):
                from models.category import Category
                category = Category(**cat_data)
                db.add(category)

        db.commit()
        print("Default categories created")

    except Exception as e:
        print(f"Error during startup: {e}")
        db.rollback()
    finally:
        db.close()


@app.get("/")
async def root():
    return {
        "message": "Welcome to Electronic Auctions System API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}


@app.get("/api/v1/uploads/health")
async def uploads_health_check():
    """Check if uploads directory is accessible"""
    uploads_path = Path("uploads")
    items_path = uploads_path / "items"

    return {
        "uploads_dir_exists": uploads_path.exists(),
        "items_dir_exists": items_path.exists(),
        "uploads_path": str(uploads_path.absolute()),
        "items_path": str(items_path.absolute())
    }


# Global exception handlers
@app.exception_handler(ValueError)
async def value_error_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)}
    )


@app.exception_handler(404)
async def not_found_exception_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found"}
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=5005,
        reload=settings.DEBUG,
        ssl_keyfile=None,  # Add SSL certificates for production
        ssl_certfile=None
    )
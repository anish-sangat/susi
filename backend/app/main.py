from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.db.database import engine

from app.routers.auth import router as auth_router
from app.routers.address import router as address_router
from app.routers.cart import router as cart_router
from app.routers.category import router as category_router
from app.routers.inventory import router as inventory_router
from app.routers.order import router as order_router
from app.routers.payment import router as payment_router
from app.routers.product import router as product_router
from app.routers.product_image import router as product_image_router
from app.routers.product_item import router as product_item_router
from app.routers.storefront import router as storefront_router
from app.routers.variation import router as variation_router


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for SUSI South Korea",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(auth_router)
app.include_router(address_router)
app.include_router(category_router)
app.include_router(product_router)
app.include_router(variation_router)
app.include_router(product_item_router)
app.include_router(product_image_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(payment_router)
app.include_router(storefront_router)
app.include_router(inventory_router)


@app.get("/")
def root():
    return {
        "message": "SUSI API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/db-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1")
        )

        value = result.scalar()

    return {
        "database": "connected",
        "test": value,
    }
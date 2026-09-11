"""
Main FastAPI Application for SIH26099.
AI-Driven Standardization and Harmonization of Material Codes Across CPSEs.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.models.db import init_db, SessionLocal
from backend.app.services.material_service import material_service
from backend.app.api.endpoints import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sih26099")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and Shutdown lifecycle event handler."""
    logger.info("Initializing SQLite database tables...")
    init_db()

    logger.info("Pre-indexing material master catalogue...")
    db = SessionLocal()
    try:
        material_service.load_and_index_default(db)
    finally:
        db.close()

    logger.info("System startup complete. Ready to serve CPSE procurement requests.")
    yield
    logger.info("Shutting down CPSE Material Harmonizer.")


app = FastAPI(
    title="MatCode — CPSE Material Harmonization Platform",
    description="AI-driven standardization, attribute extraction, and cross-enterprise duplicate prevention for Indian CPSEs (IOCL, ONGC, BPCL, GAIL).",
    version="2.3.1",
    lifespan=lifespan
)

# CORS configuration for Frontend UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev server on 5173, 3000, 8000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix="/api")
app.include_router(api_router)  # Also expose without prefix for direct routes


@app.get("/")
def root():
    return {
        "message": "SIH26099 AI-Driven Material Code Standardization Platform API",
        "documentation": "/docs",
        "health": "/health",
        "primary_demo_endpoint": "POST /materials/check"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("API_PORT", 8000))
    host = os.environ.get("API_HOST", "127.0.0.1")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)

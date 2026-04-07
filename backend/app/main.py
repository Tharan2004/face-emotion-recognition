"""
Face Emotion Recognition for Visually Impaired Persons
FastAPI Application Entry Point
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.emotion import router as emotion_router
from app.services.transformers_detector import transformers_detector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Face Emotion Recognition API",
    description=(
        "API for detecting facial emotions to assist visually impaired persons. "
        "Captures facial expressions and provides audio feedback."
    ),
    version="1.0.0",
)

# CORS middleware - allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"  # Allow all origins for production (you can restrict this to your frontend domain later)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(emotion_router)


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Face Emotion Recognition API Starting...")
    logger.info(f"Model loaded: {transformers_detector.is_model_loaded}")
    if not transformers_detector.is_model_loaded:
        logger.warning(
            "⚠ Model not loaded! Run 'python download_hf_model.py' first."
        )
    logger.info("=" * 60)


@app.get("/")
async def root():
    return {
        "app": "Face Emotion Recognition for Visually Impaired",
        "status": "running",
        "model_loaded": transformers_detector.is_model_loaded,
        "docs": "/docs",
    }

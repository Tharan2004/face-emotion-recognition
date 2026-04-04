"""
Pydantic schemas for API request/response models.
"""
from pydantic import BaseModel
from typing import Optional


class EmotionResult(BaseModel):
    """Single emotion prediction result."""
    emotion: str
    confidence: float
    message: str  # Human-readable message for TTS


class PredictionResponse(BaseModel):
    """Response from the emotion detection endpoint."""
    success: bool
    face_detected: bool
    result: Optional[EmotionResult] = None
    all_emotions: Optional[dict] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool
    message: str

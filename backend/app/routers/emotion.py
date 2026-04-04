"""
Emotion Detection API Router
Handles endpoints for image-based emotion detection and audio feedback.
"""
import base64
import logging
import numpy as np
import cv2
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from app.models import PredictionResponse, EmotionResult, HealthResponse
from app.services.emotion_detector import detector
from app.services.tts_service import tts_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["emotion"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the API and model are ready."""
    return HealthResponse(
        status="ok",
        model_loaded=detector.is_model_loaded,
        message=(
            "Model is loaded and ready."
            if detector.is_model_loaded
            else "Running in DEMO mode. Place your .keras model in backend/model/ folder."
        ),
    )


@router.post("/detect", response_model=PredictionResponse)
async def detect_emotion(file: UploadFile = File(...)):
    """
    Detect emotion from an uploaded image.

    Accepts an image file (or base64 webcam frame), detects the face,
    and returns the predicted emotion with a descriptive message.
    """
    try:
        # Read image data
        contents = await file.read()

        # Decode image
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Run prediction
        result = detector.predict(image)

        if not result["success"]:
            return PredictionResponse(
                success=False,
                face_detected=result.get("face_detected", False),
                error=result.get("error", "Unknown error"),
            )

        if not result["face_detected"]:
            return PredictionResponse(
                success=True,
                face_detected=False,
            )

        return PredictionResponse(
            success=True,
            face_detected=True,
            result=EmotionResult(**result["result"]),
            all_emotions=result["all_emotions"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-base64", response_model=PredictionResponse)
async def detect_emotion_base64(data: dict):
    """
    Detect emotion from a base64-encoded image (from webcam capture).

    Expects: {"image": "data:image/jpeg;base64,..."}
    """
    try:
        image_data = data.get("image", "")

        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]

        # Decode base64
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Run prediction
        result = detector.predict(image)

        if not result["success"]:
            return PredictionResponse(
                success=False,
                face_detected=result.get("face_detected", False),
                error=result.get("error", "Unknown error"),
            )

        if not result["face_detected"]:
            return PredictionResponse(
                success=True,
                face_detected=False,
            )

        return PredictionResponse(
            success=True,
            face_detected=True,
            result=EmotionResult(**result["result"]),
            all_emotions=result["all_emotions"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/speak")
async def generate_speech(data: dict):
    """
    Generate audio from emotion message text.

    Expects: {"text": "The person appears happy."}
    Returns: Audio file (MP3)
    """
    try:
        text = data.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")

        audio_path = tts_service.generate_audio(text)
        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            filename="emotion_speech.mp3",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

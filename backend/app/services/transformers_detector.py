"""
Transformers Emotion Detection Service
Uses Hugging Face transformers with local model cache.
Model: nateraw/ferplus-emotion (downloaded locally)
"""
import logging
import cv2
import numpy as np
from typing import Dict, Optional, Tuple
from PIL import Image

logger = logging.getLogger(__name__)


class TransformersEmotionDetector:
    """Service for detecting emotions using Hugging Face transformers (offline)."""

    def __init__(self):
        self.face_cascade = None
        self.classifier = None
        self._load_face_cascade()
        self._load_model()

    def _load_model(self):
        """Load the Hugging Face model from local folder."""
        try:
            from transformers import pipeline
            from pathlib import Path
            
            # Try to load from local model folder first
            local_model_path = Path(__file__).parent.parent.parent / "model" / "final_stage4_emotion_model"
            
            if local_model_path.exists():
                logger.info(f"📦 Loading model from local folder: {local_model_path}")
                self.classifier = pipeline(
                    "image-classification",
                    model=str(local_model_path)
                )
                logger.info("✅ Local model loaded successfully!")
            else:
                # Fallback to downloading from Hugging Face
                logger.info("📦 Loading model from Hugging Face...")
                self.classifier = pipeline(
                    "image-classification",
                    model="trpakov/vit-face-expression"
                )
                logger.info("✅ Hugging Face model loaded successfully!")
                logger.info("💡 Run 'python save_model_locally.py' to save model locally")
        except Exception as e:
            logger.error(f"❌ Error loading model: {e}")
            logger.error("Run 'python download_hf_model.py' or 'python save_model_locally.py' first")
            self.classifier = None

    def _load_face_cascade(self):
        """Load OpenCV Haar Cascade for face detection."""
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            if self.face_cascade.empty():
                logger.error("Failed to load face cascade classifier")
                self.face_cascade = None
            else:
                logger.info("✅ Face cascade classifier loaded")
        except Exception as e:
            logger.error(f"Error loading face cascade: {e}")
            self.face_cascade = None

    def detect_face(self, image: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect the largest face in the image.
        Returns (x, y, w, h) of the largest face, or None if no face found.
        """
        if self.face_cascade is None:
            return None

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE,
        )

        if len(faces) == 0:
            return None

        # Return the largest face
        largest = max(faces, key=lambda f: f[2] * f[3])
        return tuple(largest)

    def predict(self, image: np.ndarray) -> Dict:
        """
        Detect face and predict emotion from an image.

        Args:
            image: BGR image as numpy array (from cv2.imdecode)

        Returns:
            Dictionary with prediction results
        """
        # Detect face
        face_rect = self.detect_face(image)
        if face_rect is None:
            return {
                "success": True,
                "face_detected": False,
                "result": None,
                "all_emotions": None,
            }

        if self.classifier is None:
            return {
                "success": False,
                "face_detected": True,
                "error": "Model not loaded. Run 'python download_hf_model.py' first.",
            }

        try:
            # Extract face region
            x, y, w, h = face_rect
            face = image[y : y + h, x : x + w]

            # Convert BGR to RGB
            face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)

            # Convert to PIL Image
            pil_image = Image.fromarray(face_rgb)

            # Predict using transformers pipeline
            logger.info("🔍 Running emotion detection...")
            results = self.classifier(pil_image)

            logger.info(f"✅ Detection results: {results}")

            # Parse results
            # Format: [{'label': 'happy', 'score': 0.95}, ...]
            if not results or len(results) == 0:
                return {
                    "success": False,
                    "face_detected": True,
                    "error": "No predictions returned",
                }

            # Map labels to our format (FER2013 has 7 emotions)
            emotion_mapping = {
                'angry': 'angry',
                'disgust': 'disgust',
                'fear': 'fear',
                'happy': 'happy',
                'sad': 'sad',
                'surprise': 'surprise',
                'neutral': 'neutral',
            }

            # Build emotion scores
            emotion_scores = {}
            for pred in results:
                label = pred['label'].lower()
                score = pred['score']
                mapped_label = emotion_mapping.get(label, label)
                emotion_scores[mapped_label] = float(score)

            # Get top emotion
            top_pred = results[0]
            top_emotion = emotion_mapping.get(top_pred['label'].lower(), top_pred['label'])
            top_confidence = float(top_pred['score'])

            # Generate message
            message = self._generate_message(top_emotion, top_confidence)

            logger.info(f"🎭 Detected: {top_emotion} ({top_confidence:.3f})")

            return {
                "success": True,
                "face_detected": True,
                "result": {
                    "emotion": top_emotion,
                    "confidence": round(top_confidence, 3),
                    "message": message,
                },
                "all_emotions": {k: round(v, 3) for k, v in emotion_scores.items()},
            }

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "face_detected": True,
                "error": f"Prediction failed: {str(e)}",
            }

    def _generate_message(self, emotion: str, confidence: float) -> str:
        """Generate a human-readable message for the detected emotion."""
        if confidence < 0.3:
            return "The expression is not clear enough to determine."

        messages = {
            "happy": "The person in front of you appears to be happy. They seem to be in a good mood.",
            "sad": "The person in front of you looks sad. They might be feeling down.",
            "angry": "The person in front of you seems angry. They appear to be upset about something.",
            "surprise": "The person in front of you looks surprised. Something seems to have caught them off guard.",
            "fear": "The person in front of you appears fearful. They seem worried or scared.",
            "disgust": "The person in front of you shows disgust. They seem displeased.",
            "neutral": "The person in front of you has a neutral expression. They appear calm.",
        }

        return messages.get(emotion, f"The person appears to be feeling {emotion}.")

    @property
    def is_model_loaded(self) -> bool:
        """Check if the detector is ready."""
        return self.classifier is not None


# Singleton instance
transformers_detector = TransformersEmotionDetector()

"""
Configuration settings for the Face Emotion Recognition app.
"""
import os

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ============================================================
# MODEL CONFIGURATION - UPDATE THESE WHEN YOU ADD YOUR MODEL
# ============================================================

# Path to your trained model file
# Place your model in the backend/model/ folder and update the filename
# Supports: .onnx, .keras, or .h5
MODEL_PATH = os.path.join(BASE_DIR, "model", "final_stage4_highacc (2).keras")

# Input image size expected by your model (height, width)
# Change this to match what your model was trained on
# Note: The model architecture uses 224x224, but error logs show 225x225
# If you see shape mismatch errors, try adjusting this
IMAGE_SIZE = (224, 224)

# Whether model expects grayscale (1 channel) or RGB (3 channels)
GRAYSCALE = False

# Emotion labels - must match your model's output order
EMOTION_LABELS = [
    "angry",
    "contempt",
    "disgust",
    "fear",
    "happy",
    "sad",
    "surprise",
    "neutral",
]

# ============================================================
# APP SETTINGS
# ============================================================

# Confidence threshold - only announce emotions above this level
CONFIDENCE_THRESHOLD = 0.4

# How often to process frames (in seconds) - prevents spamming
COOLDOWN_SECONDS = 2.0

# Audio output directory for generated TTS files
AUDIO_DIR = os.path.join(BASE_DIR, "audio_cache")
os.makedirs(AUDIO_DIR, exist_ok=True)

# OpenCV face detection cascade
FACE_CASCADE_PATH = None  # Will use default haarcascade if None

# Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

"""
Emotion Detection Service
Handles loading the trained model and making predictions on face images.

HOW TO ADD YOUR MODEL:
1. Convert your .keras model to .onnx format using the convert_model.py script
   (run on a machine that has TensorFlow installed)
2. Place the .onnx model file in backend/model/ folder
3. Update MODEL_PATH in config.py if the filename is different
4. Update IMAGE_SIZE, GRAYSCALE, and EMOTION_LABELS in config.py
   to match your model's training configuration
5. Restart the server
"""
import os
import logging
import json
import numpy as np
import cv2
import h5py
import re
import shutil
import zipfile
from typing import Optional, Tuple, Dict

from app.config import (
    MODEL_PATH,
    IMAGE_SIZE,
    GRAYSCALE,
    EMOTION_LABELS,
    CONFIDENCE_THRESHOLD,
    FACE_CASCADE_PATH,
)

logger = logging.getLogger(__name__)


class EmotionDetector:
    """Service for detecting emotions from face images."""

    def __init__(self):
        self.session = None
        self.input_name = None
        self.model = None
        self.backend = None
        self.face_cascade = None
        self._load_face_cascade()
        self._load_model()

    def _load_face_cascade(self):
        """Load OpenCV Haar Cascade for face detection."""
        try:
            if FACE_CASCADE_PATH and os.path.exists(FACE_CASCADE_PATH):
                cascade_path = FACE_CASCADE_PATH
            else:
                cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            if self.face_cascade.empty():
                logger.error("Failed to load face cascade classifier")
                self.face_cascade = None
            else:
                logger.info("Face cascade classifier loaded successfully")
        except Exception as e:
            logger.error(f"Error loading face cascade: {e}")
            self.face_cascade = None

    def _load_model(self):
        """Load the emotion recognition model."""
        if not os.path.exists(MODEL_PATH):
            logger.warning(
                f"Model file not found at {MODEL_PATH}. "
                "Please place your model in the backend/model/ folder and update MODEL_PATH if needed. "
                "The app will work in demo mode until a model is provided."
            )
            return

        try:
            model_ext = os.path.splitext(MODEL_PATH)[1].lower()

            if model_ext == ".onnx":
                import onnxruntime as ort

                self.session = ort.InferenceSession(
                    MODEL_PATH,
                    providers=["CPUExecutionProvider"],
                )
                self.input_name = self.session.get_inputs()[0].name
                input_shape = self.session.get_inputs()[0].shape
                output_shape = self.session.get_outputs()[0].shape
                self.backend = "onnx"
                logger.info(f"ONNX model loaded from {MODEL_PATH}")
                logger.info(f"Model input: {self.input_name} shape={input_shape}")
                logger.info(f"Model output shape: {output_shape}")
                return

            if model_ext in {".keras", ".h5"}:
                import tensorflow as tf

                self.model = self._load_keras_model(tf, MODEL_PATH)
                self.backend = "keras"
                logger.info(f"Keras model loaded from {MODEL_PATH}")
                logger.info(f"Model input shape: {self.model.input_shape}")
                logger.info(f"Model output shape: {self.model.output_shape}")
                return

            logger.error(f"Unsupported model format: {model_ext}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.session = None
            self.model = None
            self.backend = None

    def _load_keras_model(self, tf, model_path: str):
        """Load a Keras model, with a fallback for archives that fail to deserialize cleanly."""
        try:
            return tf.keras.models.load_model(model_path, compile=False)
        except Exception as exc:
            logger.warning(f"Standard Keras load failed, trying archive reconstruction: {exc}")
            return self._rebuild_keras_model_from_archive(tf, model_path)

    def _rebuild_keras_model_from_archive(self, tf, model_path: str):
        """
        Rebuild a Keras v3 archive by reconstructing the graph and assigning weights manually.
        This handles archives that contain valid weights but fail during direct deserialization.
        """
        extract_dir = os.path.join(os.path.dirname(model_path), "_keras_cache")
        os.makedirs(extract_dir, exist_ok=True)

        config_path = os.path.join(extract_dir, "config.json")
        weights_path = os.path.join(extract_dir, "model.weights.h5")

        with zipfile.ZipFile(model_path) as archive:
            for member, destination in (("config.json", config_path), ("model.weights.h5", weights_path)):
                with archive.open(member) as src, open(destination, "wb") as dst:
                    shutil.copyfileobj(src, dst)

        with open(config_path, "r", encoding="utf-8") as config_file:
            config = json.load(config_file)

        keras_config = config["config"]
        input_shape = tuple(keras_config["layers"][0]["config"]["batch_shape"][1:])
        class_count = keras_config["layers"][-1]["config"]["units"]

        inputs = tf.keras.Input(shape=input_shape, name=keras_config["layers"][0]["name"])
        base = tf.keras.applications.EfficientNetB3(
            include_top=False,
            weights=None,
            input_tensor=inputs,
        )
        x = base.output
        attention = tf.keras.layers.Conv2D(64, (1, 1), activation="relu", name="conv2d")(x)
        attention = tf.keras.layers.Conv2D(1, (1, 1), activation="sigmoid", name="conv2d_1")(attention)
        x = tf.keras.layers.Multiply(name="multiply")([x, attention])
        x = tf.keras.layers.GlobalAveragePooling2D(name="global_average_pooling2d")(x)
        x = tf.keras.layers.Dropout(0.4, name="dropout")(x)
        outputs = tf.keras.layers.Dense(class_count, activation="softmax", name="dense")(x)
        model = tf.keras.Model(inputs=inputs, outputs=outputs)

        nested_layers = keras_config["layers"][1]["config"]["layers"]
        with h5py.File(weights_path, "r") as weights_file:
            self._assign_nested_functional_weights(model, nested_layers, weights_file)
            self._assign_layer_weights(model.get_layer("conv2d"), weights_file["layers/conv2d/vars"])
            self._assign_layer_weights(model.get_layer("conv2d_1"), weights_file["layers/conv2d_1/vars"])
            self._assign_layer_weights(model.get_layer("dense"), weights_file["layers/dense/vars"])

        return model

    def _assign_nested_functional_weights(self, model, nested_layers, weights_file):
        class_counters = {}
        for layer_config in nested_layers:
            serialized_name = self._serialized_layer_name(layer_config["class_name"], class_counters)
            group_path = f"layers/functional/layers/{serialized_name}/vars"
            if group_path not in weights_file:
                continue

            vars_group = weights_file[group_path]
            if not vars_group.keys():
                continue

            self._assign_layer_weights(model.get_layer(layer_config["name"]), vars_group)

    def _assign_layer_weights(self, layer, vars_group):
        weights = [vars_group[str(index)][()] for index in range(len(vars_group.keys()))]
        if weights:
            layer.set_weights(weights)

    def _serialized_layer_name(self, class_name: str, class_counters: Dict[str, int]) -> str:
        """Match Keras's default serialized group names inside model.weights.h5."""
        base_name = re.sub(r"(?<!^)(?=[A-Z])", "_", class_name).lower()
        index = class_counters.get(base_name, 0)
        class_counters[base_name] = index + 1
        return base_name if index == 0 else f"{base_name}_{index}"

    @property
    def is_model_loaded(self) -> bool:
        return self.session is not None or self.model is not None

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

    def preprocess_face(self, image: np.ndarray, face_rect: Tuple[int, int, int, int]) -> np.ndarray:
        """
        Extract and preprocess the face region for model input.
        """
        x, y, w, h = face_rect

        # Extract face region
        face = image[y : y + h, x : x + w]

        input_shape = getattr(self.model, "input_shape", None) if self.model is not None else None
        target_size = IMAGE_SIZE
        expects_grayscale = GRAYSCALE

        if input_shape and len(input_shape) >= 4:
            target_size = tuple(input_shape[1:3])
            expects_grayscale = input_shape[-1] == 1

        # Convert to grayscale if needed
        if expects_grayscale and len(face.shape) == 3:
            face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)

        # Resize to model input size
        face = cv2.resize(face, target_size)

        # Normalize pixel values to [0, 1]
        face = face.astype("float32") / 255.0

        # Reshape for model input
        if expects_grayscale:
            face = np.expand_dims(face, axis=-1)  # Add channel dimension
        face = np.expand_dims(face, axis=0)  # Add batch dimension

        return face

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

        # If model isn't loaded, return demo result
        if not self.is_model_loaded:
            return self._demo_prediction(face_rect)

        try:
            # Preprocess face
            face_input = self.preprocess_face(image, face_rect)

            if self.backend == "onnx":
                predictions = self.session.run(None, {self.input_name: face_input})[0][0]
            elif self.backend == "keras":
                predictions = self.model.predict(face_input, verbose=0)[0]
            else:
                raise RuntimeError("No supported model backend is loaded")

            # Map predictions to emotion labels
            emotion_scores = {}
            for i, label in enumerate(EMOTION_LABELS):
                if i < len(predictions):
                    emotion_scores[label] = float(predictions[i])

            # Get top emotion
            top_idx = np.argmax(predictions)
            top_emotion = EMOTION_LABELS[top_idx] if top_idx < len(EMOTION_LABELS) else "unknown"
            top_confidence = float(predictions[top_idx])

            # Generate message
            message = self._generate_message(top_emotion, top_confidence)

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
            return {
                "success": False,
                "face_detected": True,
                "result": None,
                "all_emotions": None,
                "error": str(e),
            }

    def _demo_prediction(self, face_rect) -> Dict:
        """Generate a demo prediction when model is not loaded."""
        import random

        demo_emotion = random.choice(EMOTION_LABELS)
        demo_confidence = round(random.uniform(0.6, 0.95), 3)
        demo_scores = {label: round(random.uniform(0.01, 0.2), 3) for label in EMOTION_LABELS}
        demo_scores[demo_emotion] = demo_confidence

        message = self._generate_message(demo_emotion, demo_confidence)

        return {
            "success": True,
            "face_detected": True,
            "result": {
                "emotion": demo_emotion,
                "confidence": demo_confidence,
                "message": f"[DEMO MODE] {message}",
            },
            "all_emotions": demo_scores,
        }

    def _generate_message(self, emotion: str, confidence: float) -> str:
        """Generate a human-readable message for the detected emotion."""
        if confidence < CONFIDENCE_THRESHOLD:
            return "The expression is not clear enough to determine."

        messages = {
            "happy": "The person in front of you appears to be happy. They seem to be in a good mood.",
            "sad": "The person in front of you looks sad. They might be feeling down.",
            "angry": "The person in front of you seems angry. They appear to be upset about something.",
            "surprise": "The person in front of you looks surprised. Something seems to have caught them off guard.",
            "fear": "The person in front of you appears fearful. They seem worried or scared.",
            "disgust": "The person in front of you shows disgust. They seem displeased.",
            "contempt": "The person in front of you shows contempt. They appear dismissive or scornful.",
            "neutral": "The person in front of you has a neutral expression. They appear calm.",
        }

        return messages.get(emotion, f"The person appears to be feeling {emotion}.")


# Singleton instance
detector = EmotionDetector()

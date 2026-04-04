"""
Download Hugging Face emotion detection model for offline use.
Run this once to download the model.
"""
from transformers import pipeline
import os

print("📥 Downloading Hugging Face emotion detection model...")
print("Model: trpakov/vit-face-expression")
print("This may take a few minutes...")

# Download and cache the model
classifier = pipeline(
    "image-classification",
    model="trpakov/vit-face-expression"
)

print("✅ Model downloaded successfully!")
print("📁 Model cached in:", os.path.expanduser("~/.cache/huggingface"))
print("\n🎉 You can now use the model offline!")
print("\nSupported emotions: angry, disgust, fear, happy, neutral, sad, surprise")

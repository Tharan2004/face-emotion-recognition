"""
Save Hugging Face model locally in the model folder.
This allows the model to be loaded from a local path instead of cache.
"""
import os
import shutil
from pathlib import Path

# First, let's use the pipeline approach which is simpler
from transformers import pipeline

# Define paths
MODEL_NAME = "trpakov/vit-face-expression"
LOCAL_MODEL_PATH = Path("model/final_stage4_emotion_model")

print("📥 Downloading and saving Hugging Face model locally...")
print(f"Model: {MODEL_NAME}")
print(f"Destination: {LOCAL_MODEL_PATH}")

# Create model directory if it doesn't exist
LOCAL_MODEL_PATH.mkdir(parents=True, exist_ok=True)

# Download using pipeline (this caches it)
print("\n1️⃣ Downloading model using pipeline...")
classifier = pipeline(
    "image-classification",
    model=MODEL_NAME
)

print("2️⃣ Saving model components locally...")
# Save the model and processor
classifier.model.save_pretrained(LOCAL_MODEL_PATH)

# Try to save feature extractor if it exists
if hasattr(classifier, 'feature_extractor') and classifier.feature_extractor is not None:
    classifier.feature_extractor.save_pretrained(LOCAL_MODEL_PATH)
    print("   ✓ Saved feature extractor")
elif hasattr(classifier, 'image_processor') and classifier.image_processor is not None:
    classifier.image_processor.save_pretrained(LOCAL_MODEL_PATH)
    print("   ✓ Saved image processor")
else:
    print("   ⚠ No feature extractor found, model will use default preprocessing")

print(f"\n✅ Model saved successfully to: {LOCAL_MODEL_PATH.absolute()}")

# Clean up old cache folders
print("\n3️⃣ Cleaning up old files...")
old_folders = [
    Path("model/_keras_cache"),
    Path("model/_tmp_extract"),
]

for folder in old_folders:
    if folder.exists():
        try:
            shutil.rmtree(folder)
            print(f"   ✓ Removed {folder}")
        except Exception as e:
            print(f"   ⚠ Could not remove {folder}: {e}")

print("\n🎉 Setup complete! Model is ready to use.")
print("\nThe model will now load from the local folder instead of Hugging Face cache.")
print(f"\nModel location: {LOCAL_MODEL_PATH.absolute()}")

"""
Download the emotion detection model from Google Drive.
This is faster than downloading from Hugging Face during deployment.
"""
import os
import requests
from pathlib import Path
import sys

def download_file_from_google_drive(file_id, destination):
    """Download a file from Google Drive."""
    URL = "https://docs.google.com/uc?export=download"
    
    session = requests.Session()
    
    response = session.get(URL, params={'id': file_id}, stream=True)
    token = get_confirm_token(response)
    
    if token:
        params = {'id': file_id, 'confirm': token}
        response = session.get(URL, params=params, stream=True)
    
    save_response_content(response, destination)

def get_confirm_token(response):
    """Get confirmation token for large files."""
    for key, value in response.cookies.items():
        if key.startswith('download_warning'):
            return value
    return None

def save_response_content(response, destination):
    """Save the downloaded content to a file."""
    CHUNK_SIZE = 32768
    
    with open(destination, "wb") as f:
        for chunk in response.iter_content(CHUNK_SIZE):
            if chunk:
                f.write(chunk)

def download_model_from_gdrive(gdrive_file_id):
    """
    Download the model from Google Drive.
    
    Args:
        gdrive_file_id: The Google Drive file ID (from the shareable link)
    """
    MODEL_DIR = Path("model/final_stage4_emotion_model")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Download the model file
    model_file = MODEL_DIR / "final_model.safetensors"
    
    print("📥 Downloading model from Google Drive...")
    print(f"File ID: {gdrive_file_id}")
    print(f"Destination: {model_file}")
    
    try:
        download_file_from_google_drive(gdrive_file_id, model_file)
        print(f"✅ Model downloaded successfully!")
        print(f"📁 Saved to: {model_file.absolute()}")
        
        # Verify file size
        file_size = os.path.getsize(model_file)
        print(f"📊 File size: {file_size / (1024*1024):.2f} MB")
        
        if file_size < 1000000:  # Less than 1MB is suspicious
            print("⚠️ Warning: File size seems too small. Download may have failed.")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        return False

if __name__ == "__main__":
    # Get Google Drive file ID from environment variable or command line
    gdrive_id = os.getenv("GDRIVE_MODEL_ID")
    
    if len(sys.argv) > 1:
        gdrive_id = sys.argv[1]
    
    if not gdrive_id:
        print("❌ Error: Google Drive file ID not provided!")
        print("\nUsage:")
        print("  python download_from_gdrive.py YOUR_GDRIVE_FILE_ID")
        print("\nOr set environment variable:")
        print("  export GDRIVE_MODEL_ID=YOUR_GDRIVE_FILE_ID")
        print("\nTo get the file ID:")
        print("  1. Upload model.safetensors to Google Drive")
        print("  2. Right-click > Share > Get link")
        print("  3. Copy the ID from the link:")
        print("     https://drive.google.com/file/d/FILE_ID_HERE/view")
        sys.exit(1)
    
    success = download_model_from_gdrive(gdrive_id)
    sys.exit(0 if success else 1)

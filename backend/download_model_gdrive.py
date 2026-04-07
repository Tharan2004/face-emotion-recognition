"""
Download the emotion detection model from Google Drive using gdown.
This is faster and more reliable than downloading from Hugging Face.
"""
import os
import sys
from pathlib import Path

def download_model():
    """Download model from Google Drive."""
    try:
        import gdown
    except ImportError:
        print("❌ gdown not installed. Installing...")
        os.system("pip install gdown")
        import gdown
    
    # Get Google Drive file ID from environment variable
    gdrive_id = os.getenv("GDRIVE_MODEL_ID")
    
    if len(sys.argv) > 1:
        gdrive_id = sys.argv[1]
    
    if not gdrive_id:
        print("❌ Error: Google Drive file ID not provided!")
        print("\n📋 Instructions:")
        print("1. Upload 'model.safetensors' to Google Drive")
        print("2. Right-click > Share > Anyone with the link can view")
        print("3. Copy the file ID from the link:")
        print("   https://drive.google.com/file/d/FILE_ID_HERE/view")
        print("\n💻 Usage:")
        print("   python download_model_gdrive.py YOUR_FILE_ID")
        print("\n🔧 Or set environment variable:")
        print("   export GDRIVE_MODEL_ID=YOUR_FILE_ID")
        sys.exit(1)
    
    # Create model directory - use absolute path from script location
    script_dir = Path(__file__).parent
    MODEL_DIR = script_dir / "model" / "final_stage4_emotion_model"
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    model_file = MODEL_DIR / "final_model.safetensors"
    
    # Check if model already exists
    if model_file.exists():
        file_size = os.path.getsize(model_file)
        print(f"✅ Model already exists: {model_file}")
        print(f"📊 Size: {file_size / (1024*1024):.2f} MB")
        
        response = input("Do you want to re-download? (y/N): ")
        if response.lower() != 'y':
            print("Skipping download.")
            return True
    
    print("📥 Downloading model from Google Drive...")
    print(f"File ID: {gdrive_id}")
    print(f"Destination: {model_file}")
    print("⏳ This may take a few minutes (330MB)...")
    
    try:
        # Download using gdown
        url = f"https://drive.google.com/uc?id={gdrive_id}"
        gdown.download(url, str(model_file), quiet=False)
        
        # Verify download
        if model_file.exists():
            file_size = os.path.getsize(model_file)
            print(f"\n✅ Model downloaded successfully!")
            print(f"📁 Location: {model_file.absolute()}")
            print(f"📊 Size: {file_size / (1024*1024):.2f} MB")
            
            if file_size < 100_000_000:  # Less than 100MB is suspicious
                print("⚠️ Warning: File size seems too small. Download may have failed.")
                print("Please check if the Google Drive link is publicly accessible.")
                return False
            
            return True
        else:
            print("❌ Download failed: File not created")
            return False
            
    except Exception as e:
        print(f"❌ Error downloading model: {e}")
        print("\n💡 Troubleshooting:")
        print("1. Make sure the Google Drive link is set to 'Anyone with the link'")
        print("2. Verify the file ID is correct")
        print("3. Check your internet connection")
        return False

if __name__ == "__main__":
    success = download_model()
    
    if success:
        print("\n🎉 Setup complete! You can now run the application.")
        print("Run: python run.py")
    else:
        print("\n❌ Setup failed. Please fix the errors above and try again.")
        sys.exit(1)

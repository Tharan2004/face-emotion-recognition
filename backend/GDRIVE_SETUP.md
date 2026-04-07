# Google Drive Model Setup

The emotion detection model is large (330MB) and not included in the repository. You need to download it from Google Drive.

## For Local Development

### Step 1: Get the Model File

You have two options:

**Option A: Generate the model yourself**
```bash
cd backend
python save_model_locally.py
```
This downloads from Hugging Face and saves to `model/final_stage4_emotion_model/`

**Option B: Download from Google Drive** (faster)
```bash
cd backend
python download_model_gdrive.py YOUR_GOOGLE_DRIVE_FILE_ID
```

### Step 2: Upload Model to Google Drive (for deployment)

1. Locate the model file:
   - Path: `backend/model/final_stage4_emotion_model/final_model.safetensors`
   - Size: ~330MB

2. Upload to Google Drive:
   - Go to https://drive.google.com
   - Upload `final_model.safetensors`

3. Make it publicly accessible:
   - Right-click the file > Share
   - Change to "Anyone with the link"
   - Copy the link

4. Extract the File ID:
   - From link: `https://drive.google.com/file/d/1ABC123XYZ/view`
   - File ID is: `1ABC123XYZ`

## For Render Deployment

### Step 1: Set Environment Variable

In your Render dashboard:
1. Go to your service
2. Environment tab
3. Add environment variable:
   - Key: `GDRIVE_MODEL_ID`
   - Value: `YOUR_FILE_ID_HERE`

### Step 2: Deploy

The build command will automatically download the model from Google Drive:
```bash
pip install -r backend/requirements.txt && cd backend && python download_model_gdrive.py
```

## Troubleshooting

### "File size seems too small"
- Make sure the Google Drive link is set to "Anyone with the link"
- Verify you copied the correct file ID

### "Download failed"
- Check your internet connection
- Verify the file ID is correct
- Make sure the file is publicly accessible

### "gdown not installed"
- The script will auto-install it
- Or manually: `pip install gdown`

## Alternative: Direct Download URL

If you prefer, you can also use a direct download URL:

```python
# In download_model_gdrive.py, use:
url = f"https://drive.google.com/uc?export=download&id={gdrive_id}"
```

## File Structure

After successful download:
```
backend/
├── model/
│   └── final_stage4_emotion_model/
│       ├── final_model.safetensors (330MB) ← Downloaded from Google Drive
│       ├── config.json
│       └── preprocessor_config.json
```

## Notes

- The model file is in `.gitignore` and won't be committed
- Download only needs to happen once per deployment
- Local development: download once, reuse forever
- Render deployment: downloads on each new build (cached after first build)

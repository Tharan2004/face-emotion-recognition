# Deployment Guide

## Step 1: Upload Model to Google Drive

1. **Generate the model locally** (if you haven't already):
   ```bash
   cd backend
   python save_model_locally.py
   ```

2. **Locate the model file**:
   - Path: `backend/model/final_stage4_emotion_model/final_model.safetensors`
   - Size: ~330MB

3. **Upload to Google Drive**:
   - Go to https://drive.google.com
   - Click "New" > "File upload"
   - Select `final_model.safetensors`
   - Wait for upload to complete

4. **Make it public**:
   - Right-click the uploaded file
   - Click "Share"
   - Change "Restricted" to "Anyone with the link"
   - Click "Copy link"

5. **Extract File ID**:
   - Your link looks like: `https://drive.google.com/file/d/1ABC123XYZ456/view?usp=sharing`
   - File ID is: `1ABC123XYZ456` (the part between `/d/` and `/view`)

## Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**:
   - Visit https://render.com
   - Sign in or create account

2. **Create New Web Service**:
   - Click "New +" > "Web Service"
   - Connect your GitHub repository
   - Select `face-emotion-recognition` repo

3. **Configure Service**:
   - **Name**: `face-emotion-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main` (or `loading-model`)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt && python download_model_gdrive.py
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

4. **Add Environment Variables**:
   - Click "Advanced" > "Add Environment Variable"
   - Add these variables:
     ```
     PYTHON_VERSION = 3.11.0
     HOST = 0.0.0.0
     GDRIVE_MODEL_ID = YOUR_FILE_ID_HERE
     ```
   - Replace `YOUR_FILE_ID_HERE` with the ID from Step 1

5. **Choose Plan**:
   - Free tier: 512MB RAM (might not be enough)
   - Starter: $7/month, 512MB RAM (recommended minimum)
   - Standard: $25/month, 2GB RAM (best performance)

6. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes first time)
   - Model will download from Google Drive during build

7. **Get Backend URL**:
   - After deployment, copy your service URL
   - Example: `https://face-emotion-backend.onrender.com`

## Step 3: Deploy Frontend

### Option A: Vercel (Recommended)

1. **Update API URL**:
   - Edit `frontend/src/services/api.js`
   - Change `BASE_URL` to your Render backend URL

2. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repo
   - Configure:
     - **Framework**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Click "Deploy"

### Option B: Netlify

1. **Update API URL** (same as above)

2. **Deploy to Netlify**:
   - Go to https://netlify.com
   - Drag and drop `frontend/dist` folder
   - Or connect GitHub repo

### Option C: Render Static Site

1. **Update API URL** (same as above)

2. **Create Static Site**:
   - Render Dashboard > "New +" > "Static Site"
   - Connect repo
   - Configure:
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Publish Directory**: `dist`

## Step 4: Test Deployment

1. **Open Frontend URL**
2. **Enable Voice Commands**
3. **Say "Start Detection"**
4. **Point camera at face**
5. **Listen for emotion announcements**

## Troubleshooting

### Backend Issues

**"Model not found"**
- Check `GDRIVE_MODEL_ID` environment variable
- Verify Google Drive link is public
- Check Render logs for download errors

**"Out of memory"**
- Upgrade to Starter or Standard plan
- Model needs at least 512MB RAM

**"Build failed"**
- Check build logs in Render dashboard
- Verify requirements.txt is correct
- Check Python version is 3.11

### Frontend Issues

**"Cannot connect to backend"**
- Verify backend URL in `api.js`
- Check CORS settings in `backend/app/main.py`
- Make sure backend is running

**"Voice commands not working"**
- Use HTTPS (required for microphone access)
- Allow microphone permissions in browser
- Try Chrome or Edge (best support)

## Cost Estimate

### Free Tier (Limited)
- Render Free: $0 (512MB RAM, sleeps after 15min inactivity)
- Vercel Free: $0
- Total: $0/month

### Recommended Setup
- Render Starter: $7/month (512MB RAM, always on)
- Vercel Free: $0
- Total: $7/month

### Best Performance
- Render Standard: $25/month (2GB RAM)
- Vercel Pro: $20/month (optional)
- Total: $25-45/month

## Notes

- First deployment takes 5-10 minutes (model download)
- Subsequent deployments are faster (model cached)
- Free tier backend sleeps after 15min inactivity
- First request after sleep takes 30-60 seconds to wake up
- Consider paid plan for production use

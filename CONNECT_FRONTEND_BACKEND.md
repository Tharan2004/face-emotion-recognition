# How Frontend Connects to Backend

## Current Setup

### Local Development
- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:8000`
- **Connection**: Vite proxy (`/api` → `http://localhost:8000`)

### Production
- **Frontend**: Deployed on Vercel/Netlify
- **Backend**: Deployed on Render
- **Connection**: Direct API calls using environment variable

## How It Works

### 1. API Configuration (`frontend/src/services/api.js`)

```javascript
const API_BASE = import.meta.env.VITE_API_URL || "/api";
```

- **Local**: Uses `/api` (proxied to `localhost:8000`)
- **Production**: Uses `VITE_API_URL` environment variable

### 2. Vite Proxy (`frontend/vite.config.js`)

```javascript
proxy: {
  "/api": {
    target: "http://localhost:8000",
    changeOrigin: true,
  },
}
```

This only works in development mode (`npm run dev`).

### 3. Environment Variables

**Local Development** (`.env` or no file needed):
```env
# Leave empty or don't create file
# Will use proxy
```

**Production** (`.env.production`):
```env
VITE_API_URL=https://your-backend.onrender.com
```

## Quick Setup Guide

### Step 1: Deploy Backend to Render
1. Already done! ✅
2. Copy your backend URL (e.g., `https://face-emotion-backend.onrender.com`)

### Step 2: Update Frontend Environment

Edit `frontend/.env.production`:
```env
VITE_API_URL=https://face-emotion-backend.onrender.com
```

### Step 3: Deploy Frontend

**Vercel:**
```bash
cd frontend
vercel
```

Or in Vercel dashboard, add environment variable:
- Key: `VITE_API_URL`
- Value: `https://your-backend-url.onrender.com`

**Netlify:**
```bash
cd frontend
npm run build
netlify deploy --prod
```

Or in Netlify dashboard, add environment variable same as above.

## API Endpoints Used

The frontend calls these backend endpoints:

1. **Health Check**: `GET /health`
   - Checks if backend and model are ready

2. **Detect Emotion**: `POST /detect-base64`
   - Sends webcam image for emotion detection
   - Body: `{ "image": "base64_string" }`

3. **Text-to-Speech**: `POST /speak`
   - Generates audio from text
   - Body: `{ "text": "emotion message" }`

## Testing the Connection

### Test Backend Directly
```bash
curl https://your-backend-url.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Test Frontend Locally with Production Backend
```bash
cd frontend
echo "VITE_API_URL=https://your-backend-url.onrender.com" > .env.local
npm run dev
```

Open `http://localhost:5173` and test the app.

## Common Issues

### Issue: CORS Error
**Solution**: Backend CORS is already configured to allow all origins (`*`)

### Issue: 404 Not Found
**Solution**: Check `VITE_API_URL` is set correctly in environment variables

### Issue: Connection Timeout
**Solution**: 
- Render free tier sleeps after 15min inactivity
- First request takes 30-60 seconds to wake up
- Consider upgrading to paid plan

## Summary

✅ **Local Dev**: Frontend proxy → Backend localhost
✅ **Production**: Frontend env var → Backend Render URL
✅ **Environment variable**: `VITE_API_URL`
✅ **Deployment**: Update `.env.production` before deploying

# Frontend Deployment Guide

## Step 1: Get Your Backend URL

After deploying your backend to Render, you'll get a URL like:
```
https://face-emotion-backend.onrender.com
```

## Step 2: Update Production Environment

Edit `frontend/.env.production` and replace with your actual backend URL:

```env
VITE_API_URL=https://your-actual-backend-url.onrender.com
```

## Step 3: Deploy to Vercel (Recommended)

### Option A: Using Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel
```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - Key: `VITE_API_URL`
     - Value: `https://your-backend-url.onrender.com`

5. Click "Deploy"

## Step 4: Deploy to Netlify (Alternative)

### Option A: Using Netlify CLI

```bash
cd frontend
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

### Option B: Using Netlify Dashboard

1. Go to https://netlify.com
2. Drag and drop the `frontend/dist` folder
3. Or connect GitHub repo:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
   - **Environment Variables**:
     - Key: `VITE_API_URL`
     - Value: `https://your-backend-url.onrender.com`

## Local Development

For local development, the app uses the proxy configured in `vite.config.js`:

```bash
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The frontend will proxy `/api` requests to `http://localhost:8000`.

## Testing Production Build Locally

```bash
cd frontend

# Update .env.production with your backend URL
echo "VITE_API_URL=https://your-backend-url.onrender.com" > .env.production

# Build
npm run build

# Preview
npm run preview
```

## Troubleshooting

### CORS Errors

If you get CORS errors, make sure your backend `app/main.py` has the correct CORS settings:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### API Not Found (404)

- Verify `VITE_API_URL` is set correctly
- Check that backend is running and accessible
- Test backend directly: `https://your-backend-url.onrender.com/health`

### Voice Commands Not Working

- Voice commands require HTTPS (not HTTP)
- Make sure you're accessing the deployed site via HTTPS
- Allow microphone permissions in browser

# 🚀 Start Your Application

## ⚠️ Important: Model Download Required

The emotion detection model (330MB) is NOT included in git. Your friend must download it first!

## First Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/Tharan2004/face-emotion-recognition.git
cd face-emotion-recognition

# 2. Setup backend
cd backend
pip install -r requirements.txt

# 3. Download the model (REQUIRED - takes 2-5 minutes)
python save_model_locally.py

# 4. Setup frontend
cd ../frontend
npm install
```

## Run Application

### Terminal 1 - Backend
```bash
cd backend
python run.py
```
✅ Backend: http://localhost:8000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend: http://localhost:5173

---

**That's it! Open http://localhost:5173 and start detecting emotions! 🎭**

## Troubleshooting

**"Model not found" error?**
→ Run: `python backend/save_model_locally.py`

**Port already in use?**
→ Close other apps or change ports in config files

**Camera not working?**
→ Allow camera permissions in your browser

# Face Emotion Recognition for Visually Impaired

Real-time facial emotion detection system with audio feedback, designed to help visually impaired individuals understand the emotions of people they interact with.

## Features

- 🎭 Real-time emotion detection (7 emotions: angry, disgust, fear, happy, neutral, sad, surprise)
- 🔊 Audio feedback with text-to-speech
- ⏱️ Configurable detection interval (5-300 seconds)
- 📊 Visual countdown timer and detection history
- 🤖 Powered by Hugging Face Vision Transformer
- 💾 Works offline after initial setup

## Quick Start

### 1. Setup Backend

```bash
cd backend
pip install -r requirements.txt
python save_model_locally.py
```

### 2. Start Backend

```bash
python run.py
```

Backend runs on: http://localhost:8000

### 3. Setup & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Allow camera access when prompted
3. Set detection interval (default: 50 seconds)
4. Click "Start Detection"
5. Face the camera - emotion will be detected and spoken

## Technical Details

- **Model**: Vision Transformer (trpakov/vit-face-expression)
- **Backend**: FastAPI + Python
- **Frontend**: React + Vite
- **Detection**: OpenCV face detection + Transformers
- **Audio**: gTTS (Google Text-to-Speech)

## Project Structure

```
face-emotion-recognition/
├── backend/
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── models/          # Data models
│   ├── model/               # Saved model files
│   ├── audio_cache/         # TTS audio cache
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   └── services/        # API client
    └── package.json
```

## Configuration

- Detection interval: Configurable in UI (5-300 seconds)
- Auto-speak: Toggle in UI for automatic audio feedback
- Model path: `backend/model/final_stage4_emotion_model/`

## License

Final Year Project - Educational Use

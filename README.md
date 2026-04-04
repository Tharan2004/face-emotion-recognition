# Face Emotion Recognition for Visually Impaired Persons

A real-time facial emotion recognition system that helps visually impaired individuals understand the emotions of people speaking to them by providing audio feedback.

## Features

- **Real-time webcam emotion detection** — Captures frames and detects facial expressions
- **Audio feedback** — Automatically speaks the detected emotion using text-to-speech
- **Accessible UI** — Designed with ARIA labels, keyboard navigation, and high contrast
- **7 Emotions** — Detects: Happy, Sad, Angry, Surprise, Fear, Disgust, Contempt
- **Demo mode** — Works without a model for testing (random predictions)
- **Detection history** — Shows recent emotion detections with timestamps
- **Dual TTS** — Browser-based (offline) and server-side (gTTS) text-to-speech

## Project Structure

```
project/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application
│   │   ├── config.py                # Configuration (MODEL settings here)
│   │   ├── routers/
│   │   │   └── emotion.py           # API endpoints
│   │   ├── services/
│   │   │   ├── emotion_detector.py  # Model loading & prediction
│   │   │   └── tts_service.py       # Text-to-speech service
│   │   └── models/
│   │       └── __init__.py          # Pydantic schemas
│   ├── model/                       # ← Place your .keras model here
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Camera.jsx           # Webcam capture component
│   │   │   ├── EmotionDisplay.jsx   # Emotion result display
│   │   │   ├── AudioFeedback.jsx    # TTS audio controls
│   │   │   └── Header.jsx           # App header with status
│   │   ├── services/
│   │   │   └── api.js               # API communication
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                 # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.9+ 
- Node.js 18+
- Your trained `.keras` emotion recognition model

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Add Your Model

1. Copy your trained `.keras` model file to `backend/model/` folder
2. Rename it to `emotion_model.keras` (or update the filename in `backend/app/config.py`)
3. Open `backend/app/config.py` and verify these settings match your model:

```python
# Path to your model
MODEL_PATH = os.path.join(BASE_DIR, "model", "emotion_model.keras")

# Input size your model expects
IMAGE_SIZE = (48, 48)

# Whether your model expects grayscale input
GRAYSCALE = True

# Emotion labels IN THE SAME ORDER as your model's output
EMOTION_LABELS = [
    "angry",
    "contempt",
    "disgust",
    "fear",
    "happy",
    "sad",
    "surprise",
]
```

### 3. Start the Backend

```bash
cd backend
python run.py
```

The API will start at `http://localhost:8000`. Visit `http://localhost:8000/docs` for API documentation.

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`.

## How to Use

1. **Open the app** in your browser at `http://localhost:5173`
2. **Allow camera access** when prompted
3. **Point the camera** at the person speaking to you
4. **Press "Start Detection"** or hit the **Space** key
5. The system will:
   - Detect the face in the camera
   - Predict the emotion using your trained model
   - Automatically speak the result aloud
6. **Auto-Speak** is ON by default — the app will announce each new emotion

### Keyboard Shortcuts

- **Space** — Start/Stop detection

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check API & model status |
| POST | `/api/detect` | Detect emotion from uploaded image |
| POST | `/api/detect-base64` | Detect emotion from base64 webcam frame |
| POST | `/api/speak` | Generate TTS audio from text |

## Configuration

All settings are in `backend/app/config.py`:

- `MODEL_PATH` — Path to your .keras model
- `IMAGE_SIZE` — Input dimensions (must match training)
- `GRAYSCALE` — True if model expects grayscale input
- `EMOTION_LABELS` — Ordered list of emotion classes
- `CONFIDENCE_THRESHOLD` — Minimum confidence to announce (default: 0.4)
- `COOLDOWN_SECONDS` — Delay between detections (default: 2.0)

## Tech Stack

- **Frontend**: React 18, Vite, react-webcam, react-icons
- **Backend**: FastAPI, Uvicorn, TensorFlow/Keras, OpenCV
- **TTS**: Browser SpeechSynthesis API + Google TTS (gTTS)
- **Face Detection**: OpenCV Haar Cascade

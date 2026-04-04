import React, { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import Camera from "./components/Camera";
import EmotionDisplay from "./components/EmotionDisplay";
import AudioFeedback from "./components/AudioFeedback";
import { checkHealth, detectEmotionBase64 } from "./services/api";
import "./App.css";

function App() {
  // State
  const [isActive, setIsActive] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [emotionResult, setEmotionResult] = useState(null);
  const [allEmotions, setAllEmotions] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [currentMessage, setCurrentMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [noFaceCount, setNoFaceCount] = useState(0);

  // Check backend health on mount
  useEffect(() => {
    const init = async () => {
      try {
        const health = await checkHealth();
        setModelLoaded(health.model_loaded);
        if (!health.model_loaded) {
          setError(health.message);
        }
      } catch (err) {
        setError(
          "Cannot connect to backend server. Please start the FastAPI server on port 8000."
        );
      }
    };
    init();
  }, []);

  // Keyboard shortcut: Space to toggle detection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setIsActive((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle webcam frame capture
  const handleCapture = useCallback(
    async (imageBase64) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setError(null);

      try {
        const response = await detectEmotionBase64(imageBase64);

        if (response.success) {
          if (response.face_detected && response.result) {
            setEmotionResult(response.result);
            setAllEmotions(response.all_emotions);
            setCurrentMessage(response.result.message);
            setNoFaceCount(0);

            // Add to history (keep last 10)
            setHistory((prev) => {
              const newEntry = {
                emotion: response.result.emotion,
                confidence: response.result.confidence,
                timestamp: new Date().toLocaleTimeString(),
              };
              return [newEntry, ...prev].slice(0, 10);
            });
          } else {
            setNoFaceCount((prev) => {
              const next = prev + 1;
              // Only update message after 3 consecutive no-face frames
              if (next >= 3) {
                setCurrentMessage(
                  "No face detected. Please make sure the person is facing the camera."
                );
              }
              return next;
            });
          }
        } else {
          setError(response.error || "Detection failed");
        }
      } catch (err) {
        console.error("Detection error:", err);
        // Don't spam errors - only show if persistent
        if (err.code === "ERR_NETWORK") {
          setError("Lost connection to server.");
          setIsActive(false);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing]
  );

  const toggleDetection = () => {
    setIsActive((prev) => !prev);
    if (isActive) {
      // Stopping
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      <Header modelLoaded={modelLoaded} isActive={isActive} />

      <main className="main-content" role="main">
        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive">
            <p>{error}</p>
            <button onClick={() => setError(null)} aria-label="Dismiss error">
              ✕
            </button>
          </div>
        )}

        <div className="content-grid">
          {/* Left: Camera */}
          <section className="camera-section" aria-label="Camera and controls">
            <Camera
              isActive={isActive}
              onToggle={toggleDetection}
              onCapture={handleCapture}
              captureInterval={40000}
            />
          </section>

          {/* Right: Results */}
          <section className="results-section" aria-label="Detection results">
            {/* Audio controls */}
            <AudioFeedback
              message={currentMessage}
              autoSpeak={autoSpeak}
              onToggleAutoSpeak={() => setAutoSpeak((prev) => !prev)}
            />

            {/* Emotion result */}
            <EmotionDisplay
              result={emotionResult}
              allEmotions={allEmotions}
              isProcessing={isProcessing}
            />

            {/* Detection history */}
            {history.length > 0 && (
              <div className="history-card">
                <h3>Recent Detections</h3>
                <div className="history-list">
                  {history.map((entry, idx) => (
                    <div key={idx} className="history-item">
                      <span className="history-emotion">
                        {entry.emotion}
                      </span>
                      <span className="history-confidence">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                      <span className="history-time">{entry.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Accessibility instructions */}
        <section className="instructions" aria-label="Usage instructions">
          <h2>How to Use</h2>
          <div className="instructions-grid">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <p>Point the camera at the person speaking to you</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">2</div>
              <p>Press <strong>Start Detection</strong> or hit <kbd>Space</kbd></p>
            </div>
            <div className="instruction-step">
              <div className="step-number">3</div>
              <p>The system will detect their emotion and speak it to you</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">4</div>
              <p>Auto-Speak is ON by default for hands-free use</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" role="contentinfo">
        <p>Face Emotion Recognition — Final Year Project</p>
      </footer>
    </div>
  );
}

export default App;

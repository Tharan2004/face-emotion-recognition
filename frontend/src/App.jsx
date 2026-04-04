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
  const [countdown, setCountdown] = useState(50); // Countdown timer
  const [detectionInterval, setDetectionInterval] = useState(50); // Configurable interval in seconds

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

  // Countdown timer for next detection - separate from processing state
  useEffect(() => {
    let timer;
    if (isActive) {
      setCountdown(detectionInterval); // Reset to configured interval
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return detectionInterval; // Reset to configured interval
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(detectionInterval);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isActive, detectionInterval]); // Depend on detectionInterval

  // Handle webcam frame capture
  const handleCapture = useCallback(
    async (imageBase64) => {
      if (isProcessing) return;

      console.log('🎯 Detection triggered at:', new Date().toLocaleTimeString());
      setIsProcessing(true);
      setError(null);

      try {
        const response = await detectEmotionBase64(imageBase64);

        if (response.success) {
          if (response.face_detected && response.result) {
            console.log('✅ Emotion detected:', response.result.emotion);
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

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 5 && value <= 300) { // Between 5 and 300 seconds
      setDetectionInterval(value);
      if (!isActive) {
        setCountdown(value);
      }
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
            {/* Interval Configuration */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              boxShadow: 'var(--shadow)'
            }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                ⏱️ Detection Interval (seconds)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={detectionInterval}
                  onChange={handleIntervalChange}
                  disabled={isActive}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    background: isActive ? 'var(--bg-card-hover)' : 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    cursor: isActive ? 'not-allowed' : 'text'
                  }}
                />
                <span style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  minWidth: '80px'
                }}>
                  {detectionInterval} sec
                </span>
              </div>
              <p style={{
                marginTop: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontStyle: 'italic'
              }}>
                {isActive 
                  ? '⚠️ Stop detection to change interval' 
                  : '💡 Set interval between 5-300 seconds'}
              </p>
            </div>

            <Camera
              isActive={isActive}
              onToggle={toggleDetection}
              onCapture={handleCapture}
              captureInterval={detectionInterval * 1000}
            />
          </section>

          {/* Right: Results */}
          <section className="results-section" aria-label="Detection results">
            {/* Countdown Timer - Prominent Display */}
            {isActive && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Animated background */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: '600',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    {isProcessing ? '🔄 Processing...' : '⏱️ Next Detection In'}
                  </h3>
                  
                  <div style={{ 
                    fontSize: '72px', 
                    fontWeight: 'bold',
                    color: 'white',
                    lineHeight: '1',
                    marginBottom: '16px',
                    textShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    fontFamily: 'monospace'
                  }}>
                    {countdown}
                    <span style={{ fontSize: '36px', marginLeft: '8px' }}>sec</span>
                  </div>
                  
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: `${(countdown / detectionInterval) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
                      transition: 'width 1s linear',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                  
                  <p style={{ 
                    margin: '0', 
                    fontSize: '14px', 
                    color: 'rgba(255,255,255,0.85)',
                    fontWeight: '500'
                  }}>
                    {isProcessing ? 'Analyzing facial expression...' : `Detection happens every ${detectionInterval} seconds`}
                  </p>
                </div>
              </div>
            )}

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

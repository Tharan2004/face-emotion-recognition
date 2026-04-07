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
  const [countdown, setCountdown] = useState(5); // Countdown timer
  const [detectionInterval, setDetectionInterval] = useState(5); // Configurable interval in seconds (default 5 for real-time)
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastEmotion, setLastEmotion] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    const init = async () => {
      // Skip health check - assume backend is ready
      setModelLoaded(true);
      speakMessage("Face emotion recognition app is ready. Say 'start detection' to begin.");
    };
    init();
  }, []);

  // Helper function to speak messages
  const speakMessage = useCallback((text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Voice Commands Setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.log("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();
      console.log("Voice command:", command);

      // Process commands
      if (command.includes("start detection") || command.includes("start")) {
        setIsActive(true);
        speakMessage("Detection started");
      } else if (command.includes("stop detection") || command.includes("stop")) {
        setIsActive(false);
        speakMessage("Detection stopped");
      } else if (command.includes("repeat") || command.includes("say again")) {
        if (currentMessage) {
          speakMessage(currentMessage);
        }
      } else if (command.includes("what emotion") || command.includes("current emotion")) {
        if (emotionResult) {
          speakMessage(`The person appears ${emotionResult.emotion}`);
        } else {
          speakMessage("No emotion detected yet");
        }
      } else if (command.includes("help")) {
        speakMessage("You can say: start detection, stop detection, repeat, or what emotion");
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    if (voiceEnabled) {
      recognition.start();
      speakMessage("Voice commands enabled. Say 'start detection' to begin.");
    }

    return () => {
      if (voiceEnabled) {
        recognition.stop();
      }
    };
  }, [voiceEnabled, currentMessage, emotionResult, speakMessage]);

  // Gesture Controls - Shake to toggle detection
  useEffect(() => {
    let lastX = 0, lastY = 0, lastZ = 0;
    let shakeThreshold = 15;

    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity || {};
      if (!x || !y || !z) return;

      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      if (deltaX > shakeThreshold || deltaY > shakeThreshold || deltaZ > shakeThreshold) {
        setIsActive(prev => {
          const newState = !prev;
          speakMessage(newState ? "Detection started" : "Detection stopped");
          return newState;
        });
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener("devicemotion", handleMotion);
      }
    };
  }, [speakMessage]);

  // Double-tap to repeat emotion
  useEffect(() => {
    let lastTap = 0;
    
    const handleDoubleTap = (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 300 && tapLength > 0) {
        // Double tap detected
        if (currentMessage) {
          speakMessage(currentMessage);
        } else {
          speakMessage("No emotion detected yet");
        }
      }
      
      lastTap = currentTime;
    };

    document.addEventListener('touchend', handleDoubleTap);
    
    return () => {
      document.removeEventListener('touchend', handleDoubleTap);
    };
  }, [currentMessage, speakMessage]);

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

  // Handle webcam frame capture with real-time emotion change detection
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
            
            // Check if face was just detected
            if (!faceDetected) {
              setFaceDetected(true);
              speakMessage("Face detected");
            }

            // Check for emotion change (real-time feedback)
            if (lastEmotion && lastEmotion !== response.result.emotion) {
              const changeMessage = `Emotion changed to ${response.result.emotion}`;
              speakMessage(changeMessage);
              console.log('🔄 Emotion changed:', lastEmotion, '->', response.result.emotion);
            }

            setLastEmotion(response.result.emotion);
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
            // Face lost
            if (faceDetected) {
              setFaceDetected(false);
              speakMessage("Face lost. Please face the camera.");
            }

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
          speakMessage("Detection failed");
        }
      } catch (err) {
        console.error("Detection error:", err);
        // Don't spam errors - only show if persistent
        if (err.code === "ERR_NETWORK") {
          setError("Lost connection to server.");
          setIsActive(false);
          speakMessage("Lost connection to server. Detection stopped.");
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, faceDetected, lastEmotion, speakMessage]
  );

  const toggleDetection = () => {
    setIsActive((prev) => {
      const newState = !prev;
      speakMessage(newState ? "Detection started" : "Detection stopped");
      return newState;
    });
    if (isActive) {
      // Stopping
      setIsProcessing(false);
      setFaceDetected(false);
      setLastEmotion(null);
    }
  };

  const handleIntervalChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 5 && value <= 300) { // Between 5 and 300 seconds
      setDetectionInterval(value);
      speakMessage(`Detection interval set to ${value} seconds`);
      if (!isActive) {
        setCountdown(value);
      }
    }
  };

  const toggleVoiceCommands = () => {
    setVoiceEnabled(prev => !prev);
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

        {/* Accessibility Controls */}
        <div className="accessibility-controls" style={{
          background: 'var(--bg-card)',
          border: '2px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow)'
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '20px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            ♿ Accessibility Features
          </h2>
          
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Voice Commands */}
            <button
              onClick={toggleVoiceCommands}
              style={{
                padding: '20px',
                fontSize: '18px',
                fontWeight: 'bold',
                background: voiceEnabled ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-primary)',
                color: voiceEnabled ? 'white' : 'var(--text-primary)',
                border: '2px solid var(--border)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              aria-label={voiceEnabled ? "Disable voice commands" : "Enable voice commands"}
              aria-pressed={voiceEnabled}
            >
              🎤 Voice Commands: {voiceEnabled ? 'ON' : 'OFF'}
            </button>

            {voiceEnabled && (
              <div style={{
                padding: '16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Say these commands:</p>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>"Start detection" - Begin scanning</li>
                  <li>"Stop detection" - Stop scanning</li>
                  <li>"Repeat" - Hear last emotion again</li>
                  <li>"What emotion" - Current emotion</li>
                  <li>"Help" - List commands</li>
                </ul>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{
              padding: '16px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '14px' }}>
                📱 Quick Actions:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <li>Press <strong>Space</strong> to start/stop</li>
                <li><strong>Shake phone</strong> to toggle detection</li>
                <li><strong>Double-tap screen</strong> to repeat emotion</li>
              </ul>
            </div>
          </div>
        </div>

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
          <h2>How to Use (Designed for Visually Impaired)</h2>
          <div className="instructions-grid">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <p><strong>Enable Voice Commands</strong> - Control the app hands-free by speaking</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">2</div>
              <p><strong>Say "Start Detection"</strong> or press Space or shake your phone</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">3</div>
              <p><strong>Point camera at person</strong> - You'll hear when face is detected</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">4</div>
              <p><strong>Listen for emotions</strong> - App announces emotion changes immediately</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">5</div>
              <p><strong>Double-tap screen</strong> to repeat the last emotion anytime</p>
            </div>
            <div className="instruction-step">
              <div className="step-number">6</div>
              <p><strong>Say "Stop"</strong> or press Space or shake phone to stop</p>
            </div>
          </div>
          
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>🎯 Key Features for Accessibility:</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '16px', lineHeight: '1.8' }}>
              <li><strong>Real-time feedback</strong> - Hear emotion changes instantly</li>
              <li><strong>Voice control</strong> - No need to touch the screen</li>
              <li><strong>Audio announcements</strong> - Face detection, status updates</li>
              <li><strong>Gesture support</strong> - Shake phone or double-tap</li>
              <li><strong>Hands-free operation</strong> - Perfect for visually impaired users</li>
            </ul>
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

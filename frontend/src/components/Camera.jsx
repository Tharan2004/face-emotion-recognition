import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { FaCamera, FaStop, FaVideoSlash } from "react-icons/fa";
import "./Camera.css";

const Camera = ({ isActive, onToggle, onCapture, captureInterval = 5000 }) => {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const onCaptureRef = useRef(onCapture);

  // Keep onCapture ref updated
  useEffect(() => {
    onCaptureRef.current = onCapture;
  }, [onCapture]);

  // Start/stop automatic capture interval
  useEffect(() => {
    if (isActive) {
      console.log('▶️ Starting detection with interval:', captureInterval, 'ms');
      
      // Capture immediately on start
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          console.log('📸 Initial capture at:', new Date().toLocaleTimeString());
          onCaptureRef.current(imageSrc);
        }
      }
      
      // Then capture at regular intervals
      intervalRef.current = setInterval(() => {
        console.log('⏰ Interval triggered at:', new Date().toLocaleTimeString());
        if (webcamRef.current) {
          const imageSrc = webcamRef.current.getScreenshot();
          if (imageSrc) {
            console.log('📸 Capturing frame at:', new Date().toLocaleTimeString());
            onCaptureRef.current(imageSrc);
          }
        }
      }, captureInterval);
      
      console.log('✅ Interval set with ID:', intervalRef.current);
    } else {
      console.log('⏸️ Stopping detection');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('🛑 Interval cleared');
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        console.log('🧹 Cleanup: clearing interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, captureInterval]); // Only depend on isActive and captureInterval

  const handleUserMedia = () => {
    setHasPermission(true);
  };

  const handleUserMediaError = (err) => {
    console.error("Camera error:", err);
    setHasPermission(false);
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: facingMode,
  };

  return (
    <div className="camera-container" role="region" aria-label="Camera feed for emotion detection">
      <div className="camera-view">
        {hasPermission === false ? (
          <div className="camera-error" role="alert">
            <FaVideoSlash className="error-icon" aria-hidden="true" />
            <h3>Camera Access Required</h3>
            <p>
              Please allow camera access to use emotion detection.
              This app needs to see the face of the person speaking to you.
            </p>
          </div>
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.8}
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="webcam-feed"
            mirrored={facingMode === "user"}
          />
        )}
        {isActive && hasPermission && (
          <div className="scanning-overlay" aria-hidden="true">
            <div className="scan-border"></div>
          </div>
        )}
      </div>

      <div className="camera-controls">
        <button
          onClick={onToggle}
          className={`btn-control ${isActive ? "btn-stop" : "btn-start"}`}
          aria-label={isActive ? "Stop emotion detection" : "Start emotion detection"}
          disabled={hasPermission === false}
        >
          {isActive ? (
            <>
              <FaStop aria-hidden="true" /> Stop Detection
            </>
          ) : (
            <>
              <FaCamera aria-hidden="true" /> Start Detection
            </>
          )}
        </button>

        <button
          onClick={toggleCamera}
          className="btn-control btn-secondary"
          aria-label="Switch camera"
          disabled={hasPermission === false}
        >
          Switch Camera
        </button>
      </div>

      {!isActive && hasPermission && (
        <p className="camera-hint" role="status">
          Press <strong>Start Detection</strong> or press <strong>Space</strong> to begin scanning for emotions.
        </p>
      )}
    </div>
  );
};

export default Camera;

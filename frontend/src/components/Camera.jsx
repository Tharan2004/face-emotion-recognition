import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { FaCamera, FaStop, FaVideoSlash } from "react-icons/fa";
import "./Camera.css";

const Camera = ({ isActive, onToggle, onCapture, captureInterval = 2500 }) => {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  // Capture frame from webcam
  const captureFrame = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  }, [onCapture]);

  // Start/stop automatic capture interval
  useEffect(() => {
    if (isActive) {
      // Capture immediately on start
      captureFrame();
      // Then capture at regular intervals
      intervalRef.current = setInterval(captureFrame, captureInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, captureFrame, captureInterval]);

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

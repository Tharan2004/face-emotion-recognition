import React from "react";
import {
  FaSmile,
  FaSadTear,
  FaAngry,
  FaSurprise,
  FaMeh,
  FaFrown,
  FaGrimace,
  FaQuestionCircle,
} from "react-icons/fa";
import "./EmotionDisplay.css";

const emotionConfig = {
  happy: { icon: FaSmile, color: "#fbbf24", bg: "rgba(251, 191, 36, 0.1)" },
  sad: { icon: FaSadTear, color: "#60a5fa", bg: "rgba(96, 165, 250, 0.1)" },
  angry: { icon: FaAngry, color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" },
  surprise: { icon: FaSurprise, color: "#a78bfa", bg: "rgba(167, 139, 250, 0.1)" },
  fear: { icon: FaGrimace, color: "#34d399", bg: "rgba(52, 211, 153, 0.1)" },
  disgust: { icon: FaFrown, color: "#fb923c", bg: "rgba(251, 146, 60, 0.1)" },
  contempt: { icon: FaMeh, color: "#e879f9", bg: "rgba(232, 121, 249, 0.1)" },
  neutral: { icon: FaMeh, color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" },
};

const EmotionDisplay = ({ result, allEmotions, isProcessing }) => {
  if (isProcessing) {
    return (
      <div className="emotion-card" role="status" aria-live="polite">
        <div className="emotion-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing expression...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="emotion-card emotion-empty" role="status">
        <FaQuestionCircle className="empty-icon" aria-hidden="true" />
        <h3>No Emotion Detected Yet</h3>
        <p>Start detection to analyze facial expressions of the person in front of you.</p>
      </div>
    );
  }

  const config = emotionConfig[result.emotion] || emotionConfig.neutral;
  const Icon = config.icon;
  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <div className="emotion-card" role="region" aria-label="Detected emotion result" aria-live="assertive">
      {/* Main emotion result */}
      <div className="emotion-main" style={{ background: config.bg }}>
        <Icon
          className="emotion-icon"
          style={{ color: config.color }}
          aria-hidden="true"
        />
        <div className="emotion-info">
          <span className="emotion-label" style={{ color: config.color }}>
            {result.emotion.charAt(0).toUpperCase() + result.emotion.slice(1)}
          </span>
          <div className="confidence-bar-container">
            <div
              className="confidence-bar"
              style={{
                width: `${confidencePercent}%`,
                backgroundColor: config.color,
              }}
              role="progressbar"
              aria-valuenow={confidencePercent}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label={`Confidence: ${confidencePercent}%`}
            ></div>
          </div>
          <span className="confidence-text">{confidencePercent}% confidence</span>
        </div>
      </div>

      {/* Message */}
      <div className="emotion-message" role="status" aria-live="polite">
        <p>{result.message}</p>
      </div>

      {/* All emotions breakdown */}
      {allEmotions && (
        <div className="emotions-breakdown">
          <h4>All Emotions</h4>
          <div className="emotions-grid">
            {Object.entries(allEmotions)
              .sort(([, a], [, b]) => b - a)
              .map(([emotion, score]) => {
                const ec = emotionConfig[emotion] || emotionConfig.neutral;
                const percent = Math.round(score * 100);
                return (
                  <div key={emotion} className="emotion-bar-item">
                    <div className="emotion-bar-label">
                      <span>{emotion}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="emotion-bar-track">
                      <div
                        className="emotion-bar-fill"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: ec.color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionDisplay;

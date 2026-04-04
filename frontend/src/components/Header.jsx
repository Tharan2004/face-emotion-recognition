import React from "react";
import { FaEye, FaCircle } from "react-icons/fa";
import "./Header.css";

const Header = ({ modelLoaded, isActive }) => {
  return (
    <header className="header" role="banner">
      <div className="header-content">
        <div className="header-title">
          <FaEye className="header-icon" aria-hidden="true" />
          <div>
            <h1>Face Emotion Recognition</h1>
            <p className="header-subtitle">
              Assistive Tool for Visually Impaired
            </p>
          </div>
        </div>
        <div className="header-status">
          <div
            className={`status-badge ${modelLoaded ? "status-ready" : "status-demo"}`}
            role="status"
            aria-live="polite"
          >
            <FaCircle className="status-dot" aria-hidden="true" />
            <span>{modelLoaded ? "Model Ready" : "Demo Mode"}</span>
          </div>
          {isActive && (
            <div className="status-badge status-active" role="status" aria-live="polite">
              <FaCircle className="status-dot pulse" aria-hidden="true" />
              <span>Scanning</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

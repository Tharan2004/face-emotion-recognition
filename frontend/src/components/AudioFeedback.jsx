import React, { useRef, useCallback, useEffect, useState } from "react";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { generateSpeech } from "../services/api";
import "./AudioFeedback.css";

const AudioFeedback = ({ message, autoSpeak, onToggleAutoSpeak }) => {
  const audioRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [useBrowserTTS, setUseBrowserTTS] = useState(true);
  const lastMessageRef = useRef("");

  /**
   * Speak using browser's built-in SpeechSynthesis API (works offline)
   */
  const speakBrowser = useCallback((text) => {
    if (!("speechSynthesis" in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "en-US";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  /**
   * Speak using server-side gTTS (higher quality)
   */
  const speakServer = useCallback(async (text) => {
    try {
      setIsSpeaking(true);
      const audioUrl = await generateSpeech(text);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (err) {
      console.error("Server TTS failed, falling back to browser:", err);
      // Fallback to browser TTS
      speakBrowser(text);
    }
  }, [speakBrowser]);

  /**
   * Main speak function
   */
  const speak = useCallback(
    (text) => {
      if (!text) return;

      if (useBrowserTTS) {
        speakBrowser(text);
      } else {
        speakServer(text);
      }
    },
    [useBrowserTTS, speakBrowser, speakServer]
  );

  /**
   * Auto-speak when message changes
   */
  useEffect(() => {
    if (autoSpeak && message && message !== lastMessageRef.current) {
      lastMessageRef.current = message;
      speak(message);
    }
  }, [message, autoSpeak, speak]);

  const handleAudioEnded = () => {
    setIsSpeaking(false);
  };

  const handleManualSpeak = () => {
    if (message) {
      speak(message);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  return (
    <div className="audio-feedback" role="region" aria-label="Audio feedback controls">
      <audio ref={audioRef} onEnded={handleAudioEnded} />

      <div className="audio-controls">
        {/* Auto-speak toggle */}
        <button
          onClick={onToggleAutoSpeak}
          className={`btn-audio ${autoSpeak ? "btn-audio-active" : ""}`}
          aria-label={autoSpeak ? "Disable automatic speech" : "Enable automatic speech"}
          aria-pressed={autoSpeak}
        >
          {autoSpeak ? (
            <FaVolumeUp aria-hidden="true" />
          ) : (
            <FaVolumeMute aria-hidden="true" />
          )}
          <span>{autoSpeak ? "Auto-Speak ON" : "Auto-Speak OFF"}</span>
        </button>

        {/* Manual speak button */}
        <button
          onClick={isSpeaking ? stopSpeaking : handleManualSpeak}
          className="btn-audio btn-speak"
          disabled={!message}
          aria-label={isSpeaking ? "Stop speaking" : "Speak current emotion"}
        >
          {isSpeaking ? "⏹ Stop" : "🔊 Speak Now"}
        </button>

        {/* TTS engine toggle */}
        <button
          onClick={() => setUseBrowserTTS(!useBrowserTTS)}
          className="btn-audio btn-tts-toggle"
          aria-label={`Switch to ${useBrowserTTS ? "server" : "browser"} text-to-speech`}
        >
          {useBrowserTTS ? "Browser TTS" : "Server TTS"}
        </button>
      </div>

      {isSpeaking && (
        <div className="speaking-indicator" role="status" aria-live="polite">
          <div className="sound-wave" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <p>Speaking...</p>
        </div>
      )}
    </div>
  );
};

export default AudioFeedback;

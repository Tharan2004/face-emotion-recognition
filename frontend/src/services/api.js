/**
 * API Service - Communicates with FastAPI backend
 */
import axios from "axios";

// Use environment variable for API URL, fallback to /api for local dev
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

/**
 * Check API health and model status
 */
export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

/**
 * Send a base64-encoded webcam frame for emotion detection
 * @param {string} imageBase64 - Base64 encoded image from webcam
 */
export const detectEmotionBase64 = async (imageBase64) => {
  const response = await api.post("/detect-base64", {
    image: imageBase64,
  });
  return response.data;
};

/**
 * Send an image file for emotion detection
 * @param {File} file - Image file
 */
export const detectEmotionFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/detect", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * Generate speech audio from text (server-side TTS)
 * @param {string} text - Text to convert to speech
 * @returns {string} Object URL for the audio blob
 */
export const generateSpeech = async (text) => {
  const response = await api.post(
    "/speak",
    { text },
    { responseType: "blob" }
  );
  return URL.createObjectURL(response.data);
};

export default api;

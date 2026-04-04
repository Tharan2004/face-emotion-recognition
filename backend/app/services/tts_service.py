"""
Text-to-Speech Service
Generates audio files from emotion messages using gTTS.
"""
import os
import hashlib
import logging
from gtts import gTTS
from app.config import AUDIO_DIR

logger = logging.getLogger(__name__)


class TTSService:
    """Text-to-Speech service using Google TTS."""

    def __init__(self):
        self.cache_dir = AUDIO_DIR
        os.makedirs(self.cache_dir, exist_ok=True)

    def generate_audio(self, text: str, lang: str = "en") -> str:
        """
        Generate an audio file from text.
        Uses caching to avoid regenerating the same audio.

        Args:
            text: The text to convert to speech
            lang: Language code (default: English)

        Returns:
            Path to the generated audio file
        """
        # Create a cache key from the text
        cache_key = hashlib.md5(text.encode()).hexdigest()
        audio_path = os.path.join(self.cache_dir, f"{cache_key}.mp3")

        # Return cached file if it exists
        if os.path.exists(audio_path):
            return audio_path

        try:
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(audio_path)
            logger.info(f"Generated audio: {audio_path}")
            return audio_path
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            raise

    def get_audio_filename(self, text: str) -> str:
        """Get the filename for a given text's audio."""
        cache_key = hashlib.md5(text.encode()).hexdigest()
        return f"{cache_key}.mp3"


# Singleton instance
tts_service = TTSService()

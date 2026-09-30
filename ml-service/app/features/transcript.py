import os
from faster_whisper import WhisperModel

# Initialize model once globally. Using 'tiny' for fast inference during development.
# In production, this can be configured via environment variables.
model_size = os.getenv("WHISPER_MODEL_SIZE", "tiny")
model = WhisperModel(model_size, device="cpu", compute_type="int8")

def transcribe_audio(audio_path: str):
    """
    Transcribes audio and returns a list of words with timestamps.
    """
    # word_timestamps=True is crucial for fluency metrics (WPM and pauses)
    segments, info = model.transcribe(audio_path, word_timestamps=True)
    
    words = []
    text = ""
    for segment in segments:
        text += segment.text
        for word in segment.words:
            words.append({
                "word": word.word,
                "start": word.start,
                "end": word.end,
                "probability": word.probability
            })
            
    return {
        "text": text.strip(),
        "words": words,
        "duration": info.duration
    }

import io
import librosa
import numpy as np

def load_audio(file_bytes: bytes, target_sr: int = 16000):
    """
    Loads audio from bytes using soundfile/librosa.
    Returns (y, sr, duration).
    """
    # Use io.BytesIO to simulate a file object
    y, sr = librosa.load(io.BytesIO(file_bytes), sr=target_sr)
    duration = librosa.get_duration(y=y, sr=sr)
    return y, sr, round(duration, 2)

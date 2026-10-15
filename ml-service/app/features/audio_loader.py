import io
import soundfile as sf
import librosa
import numpy as np

def load_audio(file_bytes: bytes, target_sr: int = 16000):
    """
    Loads audio from bytes using soundfile, converting to mono and target_sr if needed.
    Returns (y, sr, duration).
    """
    try:
        y, sr = sf.read(io.BytesIO(file_bytes), dtype='float32')
        if y.ndim > 1:
            y = np.mean(y, axis=1)
        if sr != target_sr:
            y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
            sr = target_sr
        duration = len(y) / sr
        return y, sr, round(float(duration), 2)
    except Exception:
        # Fallback to librosa.load if soundfile fails on unusual headers
        y, sr = librosa.load(io.BytesIO(file_bytes), sr=target_sr)
        duration = librosa.get_duration(y=y, sr=sr)
        return y, sr, round(float(duration), 2)

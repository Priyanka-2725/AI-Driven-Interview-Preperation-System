import librosa
import numpy as np
from app.core.constants import PITCH_FMIN_HZ, PITCH_FMAX_HZ, FRAME_LENGTH, HOP_LENGTH

def estimate_f0(y, sr):
    if len(y) == 0:
        return np.array([])
    
    # YIN algorithm for pitch estimation (probabilistic YIN)
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y, 
        fmin=PITCH_FMIN_HZ, 
        fmax=PITCH_FMAX_HZ, 
        sr=sr,
        frame_length=FRAME_LENGTH,
        hop_length=HOP_LENGTH
    )
    
    # Filter out unvoiced frames or frames with probability < 0.5
    valid_f0 = f0[(voiced_flag) & (voiced_probs > 0.5)]
    return valid_f0

def extract_pitch(y, sr):
    valid_f0 = estimate_f0(y, sr)
    
    if len(valid_f0) == 0:
        return {
            "meanHz": 0.0,
            "stdHz": 0.0,
            "voicedRatio": 0.0
        }
        
    mean_hz = np.mean(valid_f0)
    std_hz = np.std(valid_f0)
    
    # Total frames is roughly len(y) / hop_length
    total_frames = max(1, len(y) // HOP_LENGTH)
    voiced_ratio = len(valid_f0) / total_frames
    
    return {
        "meanHz": round(float(mean_hz), 1),
        "stdHz": round(float(std_hz), 1),
        "voicedRatio": round(float(voiced_ratio), 2)
    }

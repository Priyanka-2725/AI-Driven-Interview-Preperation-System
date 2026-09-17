import librosa
import numpy as np
from app.core.constants import MIN_DB_THRESHOLD, MAX_DB_THRESHOLD, FRAME_LENGTH, HOP_LENGTH, EPSILON, MIN_PAUSE_DURATION_S

def compute_rms_frames(y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH):
    # Frame the signal and compute sqrt(mean(x**2)) per frame using numpy
    frames = librosa.util.frame(y, frame_length=frame_length, hop_length=hop_length)
    # frames shape is (frame_length, n_frames)
    rms_frames = np.sqrt(np.mean(frames**2, axis=0))
    return rms_frames

def rms_to_db(rms_frames):
    # 20 * log10(max(rms, EPSILON))
    # use np.maximum to apply EPSILON across the array
    return 20.0 * np.log10(np.maximum(rms_frames, EPSILON))

def detect_silence_segments(db_frames, hop_length, sr, threshold_db, min_duration_s):
    is_silent = db_frames < threshold_db
    
    segment_count = 0
    total_silent_frames = 0
    longest_segment_frames = 0
    current_segment_frames = 0
    
    for silent in is_silent:
        if silent:
            current_segment_frames += 1
            total_silent_frames += 1
        else:
            if current_segment_frames > 0:
                frame_duration = hop_length / sr
                if (current_segment_frames * frame_duration) >= min_duration_s:
                    segment_count += 1
                    if current_segment_frames > longest_segment_frames:
                        longest_segment_frames = current_segment_frames
                current_segment_frames = 0
                
    if current_segment_frames > 0:
        frame_duration = hop_length / sr
        if (current_segment_frames * frame_duration) >= min_duration_s:
            segment_count += 1
            if current_segment_frames > longest_segment_frames:
                longest_segment_frames = current_segment_frames
            
    frame_duration = hop_length / sr
    total_silent_seconds = total_silent_frames * frame_duration
    longest_silent_seconds = longest_segment_frames * frame_duration
    
    return {
        "segmentCount": segment_count,
        "totalSilentSeconds": round(total_silent_seconds, 2),
        "longestSilentSeconds": round(longest_silent_seconds, 2)
    }

def extract_energy(y, sr):
    if len(y) == 0:
        return {"meanDb": -100.0, "minDb": -100.0, "maxDb": -100.0, "frameCount": 0}, {"segmentCount": 0, "totalSilentSeconds": 0.0, "longestSilentSeconds": 0.0}

    hop_length = HOP_LENGTH
    rms_frames = compute_rms_frames(y, hop_length=hop_length)
    db_frames = rms_to_db(rms_frames)
    
    mean_db = np.mean(db_frames)
    min_db = np.min(db_frames)
    max_db = np.max(db_frames)
    
    rms_stats = {
        "meanDb": round(float(mean_db), 1),
        "minDb": round(float(min_db), 1),
        "maxDb": round(float(max_db), 1),
        "frameCount": len(db_frames)
    }
    
    silence_stats = detect_silence_segments(db_frames, hop_length, sr, MIN_DB_THRESHOLD, MIN_PAUSE_DURATION_S)
    return rms_stats, silence_stats

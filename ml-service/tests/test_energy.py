import pytest
import numpy as np
from app.features.energy import compute_rms_frames, rms_to_db, detect_silence_segments
from app.core.constants import MIN_DB_THRESHOLD, MIN_PAUSE_DURATION_S

def test_full_scale_sine_rms():
    # Generate 1 second full-scale sine wave at 440Hz
    sr = 16000
    t = np.linspace(0, 1, sr, False)
    # Full scale amplitude is 1.0 (since we reference 1.0 for dB)
    y = np.sin(440 * 2 * np.pi * t)
    
    rms = compute_rms_frames(y, frame_length=512, hop_length=160)
    db = rms_to_db(rms)
    
    mean_db = np.mean(db)
    # A full-scale sine wave has an RMS of 1/sqrt(2) ≈ 0.707
    # 20 * log10(0.707) ≈ -3.01 dB
    assert -3.5 <= mean_db <= -2.5, f"Expected ~-3.01 dB, got {mean_db}"

def test_tone_silence_tone():
    sr = 16000
    # 1s tone
    t_tone = np.linspace(0, 1, sr, False)
    tone = np.sin(440 * 2 * np.pi * t_tone)
    
    # 2s silence
    silence = np.zeros(2 * sr)
    
    # Combine: tone -> silence -> tone
    y = np.concatenate([tone, silence, tone])
    
    rms = compute_rms_frames(y, frame_length=512, hop_length=160)
    db = rms_to_db(rms)
    
    stats = detect_silence_segments(db, 160, sr, MIN_DB_THRESHOLD, MIN_PAUSE_DURATION_S)
    
    assert stats["segmentCount"] == 1
    # Check if silent seconds is close to 2.0 (allow small tolerance due to frame hop length)
    assert 1.8 <= stats["longestSilentSeconds"] <= 2.2

def test_digital_silence():
    sr = 16000
    # 2s of pure silence
    y = np.zeros(2 * sr)
    
    rms = compute_rms_frames(y, frame_length=512, hop_length=160)
    db = rms_to_db(rms)
    
    # DB should be very low (close to EPSILON -> -200dB)
    assert np.all(db < -100)

def test_sub_threshold_gap():
    sr = 16000
    # 1s tone
    t_tone = np.linspace(0, 1, sr, False)
    tone = np.sin(440 * 2 * np.pi * t_tone)
    
    # 0.5s silence (below 1.2s MIN_PAUSE_DURATION_S)
    silence = np.zeros(int(0.5 * sr))
    
    # Combine: tone -> short silence -> tone
    y = np.concatenate([tone, silence, tone])
    
    rms = compute_rms_frames(y, frame_length=512, hop_length=160)
    db = rms_to_db(rms)
    
    stats = detect_silence_segments(db, 160, sr, MIN_DB_THRESHOLD, MIN_PAUSE_DURATION_S)
    
    # Should not register as a valid silence segment since it's < 1.2s
    assert stats["segmentCount"] == 0

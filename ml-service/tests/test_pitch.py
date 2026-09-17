import pytest
import numpy as np
from app.features.pitch import estimate_f0, extract_pitch

def test_pitch_220hz_sine():
    sr = 16000
    t = np.linspace(0, 1, sr, False)
    # Generate 220Hz sine wave
    y = np.sin(220 * 2 * np.pi * t)
    
    stats = extract_pitch(y, sr)
    
    # Check that meanHz is close to 220Hz (within 5Hz)
    assert 215.0 <= stats["meanHz"] <= 225.0, f"Expected ~220Hz, got {stats['meanHz']}"
    
    # It should be highly voiced
    assert stats["voicedRatio"] > 0.8

def test_white_noise():
    sr = 16000
    # Generate 1s of white noise
    np.random.seed(42)
    y = np.random.uniform(-1, 1, sr)
    
    stats = extract_pitch(y, sr)
    
    # White noise should have a very low voiced ratio 
    assert stats["voicedRatio"] < 0.2

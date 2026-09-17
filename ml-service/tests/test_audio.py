import io
import pytest
import numpy as np
import scipy.io.wavfile as wavfile
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_extract_audio_features_invalid_format():
    file_content = b"This is not a wav file."
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/api/v1/audio/features", files=files)
    
    assert response.status_code == 422
    assert "UNSUPPORTED_FORMAT" in response.json()["detail"]

def test_extract_audio_features_valid_format():
    sr = 16000
    duration = 1.0
    t = np.linspace(0, duration, int(sr * duration), False)
    # 220 Hz sine wave
    tone = np.sin(220 * 2 * np.pi * t)
    audio = np.int16(tone * 32767)
    
    wav_io = io.BytesIO()
    wavfile.write(wav_io, sr, audio)
    wav_bytes = wav_io.getvalue()
    
    files = {"file": ("test_synthetic.wav", io.BytesIO(wav_bytes), "audio/wav")}
    response = client.post("/api/v1/audio/features", files=files)
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify contract shape
    assert "durationSeconds" in data
    assert "sampleRate" in data
    assert "rms" in data
    assert "silence" in data
    assert "pitch" in data
    
    assert "meanDb" in data["rms"]
    assert "segmentCount" in data["silence"]
    assert "meanHz" in data["pitch"]
    
    # Verify realistic numerical values for the 220Hz tone
    assert 215.0 <= data["pitch"]["meanHz"] <= 225.0
    assert data["durationSeconds"] == 1.0
    assert data["sampleRate"] == 16000

import io
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
import numpy as np
import scipy.io.wavfile as wavfile

client = TestClient(app)

@patch("app.api.endpoints.evaluate.transcribe_audio")
def test_evaluate_recording_success(mock_transcribe):
    # Setup mock return value
    mock_transcribe.return_value = {
        "text": "Hello world",
        "words": [{"word": "Hello"}, {"word": "world"}],
        "duration": 2.0
    }
    
    # Create a synthetic valid wav file buffer
    sr = 16000
    duration = 0.1
    audio = np.zeros(int(sr * duration), dtype=np.int16)
    wav_io = io.BytesIO()
    wavfile.write(wav_io, sr, audio)
    wav_bytes = wav_io.getvalue()
    
    # Note: endpoint expects field name "audio"
    files = {"audio": ("test.wav", io.BytesIO(wav_bytes), "audio/wav")}
    response = client.post("/api/v1/evaluate", files=files)
    
    assert response.status_code == 200
    data = response.json()
    
    assert "fluency" in data
    assert "confidence" in data
    
    # WPM = 2 words / 2 seconds * 60 = 60 wpm
    assert data["fluency"]["wpm"] == 60.0
    
    # Confidence should be a float
    assert 70.0 <= data["confidence"]["score"] <= 100.0
    assert data["confidence"]["isSample"] is True

def test_evaluate_recording_invalid_extension():
    files = {"audio": ("test.mp3", io.BytesIO(b"dummy"), "audio/mpeg")}
    response = client.post("/api/v1/evaluate", files=files)
    
    assert response.status_code == 400
    assert "Only .wav files are supported" in response.json()["detail"]

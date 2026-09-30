import json
from app.features.transcript import transcribe_audio
from fastapi.testclient import TestClient
from app.main import app

if __name__ == "__main__":
    print("=== 1. Real Whisper Transcription ===")
    transcript = transcribe_audio("speech.wav")
    print(f"Transcript Text: {transcript['text']}")
    print("Word Timestamps:")
    for w in transcript['words']:
        print(f"  [{w['start']:.2f}s - {w['end']:.2f}s]: '{w['word']}' (prob: {w['probability']:.2f})")
        
    print("\n=== 2. Real /evaluate Endpoint ===")
    client = TestClient(app)
    with open("speech.wav", "rb") as f:
        files = {"audio": ("speech.wav", f, "audio/wav")}
        res = client.post("/api/v1/evaluate", files=files)
        
    print(f"Status Code: {res.status_code}")
    print(json.dumps(res.json(), indent=2))

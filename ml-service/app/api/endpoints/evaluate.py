import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.evaluate import EvaluateResponse, FluencyResult, ConfidenceResult
from app.features.transcript import transcribe_audio
from app.features.fluency import compute_wpm, compute_fluency_score
from app.features.confidence_sample import get_mock_confidence

router = APIRouter()

@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_recording(audio: UploadFile = File(...)):
    if not audio.filename.endswith(".wav"):
        raise HTTPException(status_code=400, detail="Only .wav files are supported")
    
    try:
        # Save uploaded file to temp file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await audio.read()
            temp_audio.write(content)
            temp_path = temp_audio.name
            
        try:
            # 1. Transcribe & extract timestamps
            transcript = transcribe_audio(temp_path)
            
            # 2. Compute Fluency (WPM + Score)
            wpm = compute_wpm(transcript["words"], transcript["duration"])
            fluency_score = compute_fluency_score(wpm)
            
            # 3. Compute Confidence (Mock placeholder for Week 3 Vision)
            conf_score = get_mock_confidence()
            
            return EvaluateResponse(
                fluency=FluencyResult(score=fluency_score, wpm=round(wpm, 1)),
                confidence=ConfidenceResult(isSample=True, score=conf_score)
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

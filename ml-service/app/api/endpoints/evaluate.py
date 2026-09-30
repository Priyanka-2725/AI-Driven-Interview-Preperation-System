import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.evaluate import EvaluateResponse, FluencyResult, ConfidenceResult
from app.features.transcript import transcribe_audio
from app.features.fluency import compute_wpm, compute_fluency_score
from app.features.confidence_sample import get_mock_confidence
from app.features import audio_loader, energy, pitch
from app.core.filler_words import count_filler_words

router = APIRouter()

@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_recording(audio: UploadFile = File(...)):
    if not audio.filename.endswith(".wav"):
        raise HTTPException(status_code=400, detail="Only .wav files are supported")
    
    try:
        content = await audio.read()
        
        # Save uploaded file to temp file for faster-whisper which requires a file path
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(content)
            temp_path = temp_audio.name
            
        try:
            # 1. Transcribe & extract timestamps
            transcript = transcribe_audio(temp_path)
            
            # 2. Extract Energy & Pitch features (for silence stats)
            y, sr, duration = audio_loader.load_audio(content)
            rms_stats, silence_stats = energy.extract_energy(y, sr)
            pitch_stats = pitch.extract_pitch(y, sr)
            
            # Compute silence ratio
            silence_ratio = 0.0
            if duration > 0:
                silence_ratio = silence_stats.get("totalSilentSeconds", 0.0) / duration
            silence_stats["silenceRatio"] = silence_ratio
            
            # 3. Compute Fluency (WPM + Fillers + Score)
            wpm = compute_wpm(transcript["words"], transcript["duration"])
            filler_count = count_filler_words(transcript["text"])
            
            fluency_dict = compute_fluency_score(wpm, filler_count, silence_stats, pitch_stats)
            
            # 4. Compute Confidence (Mock placeholder for Week 3 Vision)
            conf_dict = get_mock_confidence()
            
            return EvaluateResponse(
                fluency=FluencyResult(**fluency_dict),
                confidence=ConfidenceResult(**conf_dict)
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

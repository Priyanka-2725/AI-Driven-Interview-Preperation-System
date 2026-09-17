from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.features import audio_loader, energy, pitch, geometry

router = APIRouter()

class RmsData(BaseModel):
    meanDb: float
    minDb: float
    maxDb: float
    frameCount: int

class SilenceData(BaseModel):
    segmentCount: int
    totalSilentSeconds: float
    longestSilentSeconds: float

class PitchData(BaseModel):
    meanHz: float
    stdHz: float
    voicedRatio: float

class AudioFeatureResponse(BaseModel):
    durationSeconds: float
    sampleRate: int
    rms: RmsData
    silence: SilenceData
    pitch: PitchData

@router.post("/features", response_model=AudioFeatureResponse)
async def extract_audio_features(file: UploadFile = File(...)):
    if not file.filename.endswith(".wav"):
        raise HTTPException(status_code=422, detail="UNSUPPORTED_FORMAT: Only .wav files are supported.")
    
    # 1. Load Audio
    file_bytes = await file.read()
    y, sr, duration = audio_loader.load_audio(file_bytes)
    
    # 2. Extract Energy (RMS & Silence)
    rms_stats, silence_stats = energy.extract_energy(y, sr)
    
    # 3. Extract Pitch
    pitch_stats = pitch.extract_pitch(y, sr)
    
    # 4. Geometry (Placeholder execution for Week 1)
    geometry.extract_geometry()
    
    return AudioFeatureResponse(
        durationSeconds=duration,
        sampleRate=sr,
        rms=RmsData(**rms_stats),
        silence=SilenceData(**silence_stats),
        pitch=PitchData(**pitch_stats)
    )

import time
import librosa
from app.features import audio_loader
from app.core.constants import PITCH_FMIN_HZ, PITCH_FMAX_HZ, FRAME_LENGTH, HOP_LENGTH
import os

print('Loading audio...')
y, sr, dur = audio_loader.load_audio(open(r'D:\AI-INTERVIEW-COACH\backend\uploads\recordings\recording-1791056243686-623187322.webm.wav', 'rb').read())
print(f'Duration: {dur}s, sr: {sr}')

print('Testing pyin...')
t0 = time.time()
f0, flag, probs = librosa.pyin(y, fmin=PITCH_FMIN_HZ, fmax=PITCH_FMAX_HZ, sr=sr, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)
print(f'pyin took {time.time() - t0:.2f}s')

print('Testing yin...')
t1 = time.time()
f0_yin = librosa.yin(y, fmin=PITCH_FMIN_HZ, fmax=PITCH_FMAX_HZ, sr=sr, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)
print(f'yin took {time.time() - t1:.2f}s')


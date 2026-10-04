import time
print('Loading module...')
t0 = time.time()
from app.features.transcript import transcribe_audio
print(f'Module loaded in {time.time() - t0:.2f}s')

audio = r'D:\AI-INTERVIEW-COACH\backend\uploads\recordings\recording-1791056243686-623187322.webm.wav'
print('Transcribing...')
t1 = time.time()
res = transcribe_audio(audio)
print(f'Transcription took {time.time() - t1:.2f}s')
print(res)

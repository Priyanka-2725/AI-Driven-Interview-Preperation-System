# ML Feature Extraction Notes

## 1. Acoustic Features
Acoustic feature extraction heavily relies on `librosa` and `praat-parselmouth` to analyze raw audio arrays.

### 1.1 Energy (RMS)
Energy represents the perceived loudness of the audio.
- Extracted via `librosa.feature.rms`.
- We convert the linear RMS values to Decibels (dB) using `librosa.amplitude_to_db`.
- **Thresholds**: Silence is defined as anything below `-45.0 dB`. Clipping happens near `0.0 dB`.

### 1.2 Pitch (F0)
Fundamental frequency tracking maps the user's vocal range.
- Extracted using `librosa.pyin` for probabilistic fundamental frequency estimation.
- **Voicing Decision Rule**: We rely on the built-in probabilistic model of `pyin` to generate the raw per-frame voicing decision (`voiced_probs > 0.5`). This is considered raw-signal extraction, allowing us to safely exclude noise (like white noise, which breaks simple energy thresholding on raw `yin`).
- The downstream aggregation (meanHz, stdHz, voicedRatio) and subsequent fluency confidence scoring are entirely hand-rolled in NumPy.

### 1.3 Pacing & Pauses
Speech rate is estimated by detecting onset envelopes.
- We use `librosa.onset.onset_detect` combined with silence detection to find spoken syllables versus pauses.
- Pauses longer than 1.5 seconds are tracked.

## 2. Geometry Features (Week 2 Deferred)
In Week 2, video will be processed using Dlib or MediaPipe to extract facial landmarks.

### 2.1 Head Pose Estimation
- Uses the solvePnP algorithm to map 2D facial landmarks to a 3D model.
- Determines Yaw (left/right) and Pitch (up/down).
- **Thresholds**: `MAX_HEAD_YAW = 15.0` degrees; `MAX_HEAD_PITCH = 10.0` degrees.

## 3. Optimizations
- Features are extracted sequentially but could be parallelized using ThreadPoolExecutor.
- Audio should be resampled to 16kHz for normalized processing.

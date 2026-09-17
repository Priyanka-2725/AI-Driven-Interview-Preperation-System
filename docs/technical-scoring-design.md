# Technical Scoring Design

## Overview
This document outlines how the raw ML features are aggregated and translated into 0-100 scores for the end user. The scoring models use non-linear penalty curves rather than simple linear averages, meaning perfect scores require consistency across the entire recording.

## 1. Energy Score Computation
Energy scoring evaluates the consistency and volume of the candidate's speech.
- **Penalty for Silence**: High penalty for segments of audio below `MIN_DB_THRESHOLD` (-45.0 dB) that exceed typical breath-pause durations.
- **Penalty for Clipping**: Immediate penalty if DB > `MAX_DB_THRESHOLD` (0.0 dB), as this implies shouting or mic blow-out.
- **Calculation**: Score = 100 - (Silence % * 100) - (Clip % * 150)

## 2. Pitch Score (Monotone Detection)
Pitch scoring measures vocal modulation.
- **Variance Metric**: We calculate the standard deviation of valid F0 values (ignoring 0/unvoiced frames).
- **Thresholds**: If standard deviation falls below a defined baseline, a monotone penalty is applied.
- **Score Mapping**: Normalized against a benchmark deviation of ~25-40 Hz for conversational speech.

## 3. Pacing Score
Pacing evaluates speech rate and fluency.
- **Syllable Rate**: Number of detected onsets per minute.
- **Optimal Range**: 120-160 WPM equivalent.
- **Penalties**: Severe deductions for extreme rushing (>180 WPM) or halting speech (<100 WPM).

## 4. Geometry Score (Eye Contact)
- **Calculation**: Percentage of frames where head yaw and pitch remain within `MAX_HEAD_YAW` (15 deg) and `MAX_HEAD_PITCH` (10 deg).
- **Grace Period**: Short glances away (under 0.5s) are smoothed out using a moving average filter.

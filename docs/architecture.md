# Architecture Decisions

## ADR-004: Python Version Selection
Python 3.11 unavailable on dev machine (confirmed via `py -0p` and a failed `py -3.11 -m venv` attempt), 3.12 venv confirmed broken in Phase 1, 3.10.11 approved as the practical alternative.

## ADR-005: Pitch Extraction and Voicing Decision
We originally attempted to use `librosa.yin` for fundamental frequency estimation to adhere strictly to the "build it yourself" rule for scoring and decision boundaries. However, `librosa.yin` forces a pitch estimate for every frame, regardless of periodicity. Using a simple energy threshold (RMS > -45 dB) proved insufficient for voicing detection, as demonstrated by a test where white noise was erroneously classified as 97% voiced speech.

**Decision**: We restored `librosa.pyin` scoped strictly to raw signal extraction (f0 and probability-based voicing detection). The probabilistic model in `pyin` reliably isolates true voiced pitch. The downstream aggregation (meanHz, stdHz, voicedRatio) and future confidence scoring remain entirely hand-rolled in NumPy, preserving the intent of the from-scratch policy.

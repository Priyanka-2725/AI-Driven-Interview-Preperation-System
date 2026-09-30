from app.features.fluency import compute_wpm, compute_fluency_score

def test_compute_wpm():
    # 5 words in 2 seconds -> 2.5 words per second -> 150 wpm
    words = [{"word": "a"}] * 5
    assert compute_wpm(words, 2.0) == 150.0
    
    assert compute_wpm(words, 0.0) == 0.0

def test_compute_fluency_score():
    wpm = 145.0  # perfect, 0 penalty
    filler_count = {"total": 2, "breakdown": {"um": 2}} # penalty = 2 * 1.5 = 3
    silence_stats = {"silenceRatio": 0.10} # 10%, penalty = 10 * 1.0 = 10
    pitch_stats = {}
    
    res = compute_fluency_score(wpm, filler_count, silence_stats, pitch_stats)
    
    # 100 - 0 (wpm) - 3 (filler) - 10 (silence) = 87
    assert res["score"] == 87
    assert res["wpm"] == 145.0
    assert res["fillerWordCount"] == 2
    assert res["silenceRatio"] == 0.10
    assert res["breakdown"]["wpmPenalty"] == 0.0
    assert res["breakdown"]["fillerPenalty"] == 3.0
    assert res["breakdown"]["silencePenalty"] == 10.0

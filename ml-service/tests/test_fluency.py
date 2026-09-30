from app.features.fluency import compute_wpm, compute_fluency_score

def test_compute_wpm():
    # 5 words in 2 seconds -> 2.5 words per second -> 150 wpm
    words = [{"word": "a"}] * 5
    assert compute_wpm(words, 2.0) == 150.0
    
    # 0 duration
    assert compute_wpm(words, 0.0) == 0.0

def test_compute_fluency_score():
    # Target 145 wpm = 100
    assert compute_fluency_score(145.0) == 100.0
    
    # 120 wpm = diff 25, 25 * 0.8 = 20, 100 - 20 = 80
    assert compute_fluency_score(120.0) == 80.0
    
    # 170 wpm = diff 25, 25 * 0.8 = 20, 100 - 20 = 80
    assert compute_fluency_score(170.0) == 80.0
    
    # Extreme diff (e.g., 0 wpm) -> max(0, 100 - 145*0.8) -> 100 - 116 = 0
    assert compute_fluency_score(0.0) == 0.0

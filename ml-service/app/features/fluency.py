def compute_wpm(words: list, duration: float) -> float:
    """
    Computes Words Per Minute (WPM).
    
    Formula: (number of words / duration in seconds) * 60
    """
    if duration <= 0:
        return 0.0
    return (len(words) / duration) * 60.0

def compute_fluency_score(wpm: float) -> float:
    """
    Calculate a fluency score from 0-100 based on Words Per Minute.
    
    - The target/ideal WPM for normal speech is ~145 WPM.
    - We use a piecewise linear penalty where the score drops as WPM diverges from the target.
    - For every 1 WPM deviation from the target, we deduct 0.8 points.
      (e.g., 145 WPM = 100 score. 120 WPM (diff 25) -> deduct 20 = 80 score).
    """
    if wpm <= 0:
        return 0.0
        
    TARGET_WPM = 145.0
    PENALTY_PER_WPM = 0.8
    
    deviation = abs(wpm - TARGET_WPM)
    score = 100.0 - (deviation * PENALTY_PER_WPM)
    
    return max(0.0, min(100.0, round(score, 1)))

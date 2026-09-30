def compute_wpm(words: list, duration: float) -> float:
    if duration <= 0:
        return 0.0
    return (len(words) / duration) * 60.0

def compute_fluency_score(wpm: float, filler_count: dict, silence_stats: dict, pitch_stats: dict) -> dict:
    """
    Computes a holistic fluency score (0-100) factoring in WPM, filler words, and awkward silences.
    """
    score = 100.0
    
    # 1. WPM Penalty: 
    # Target is ~145 WPM. We deduct 0.5 points for every 1 WPM deviation.
    # Why 0.5? WPM naturally fluctuates. A 20 WPM deviation is normal and should only cost 10 points.
    TARGET_WPM = 145.0
    PENALTY_PER_WPM = 0.5
    wpm_deviation = abs(wpm - TARGET_WPM)
    wpm_penalty = min(30.0, wpm_deviation * PENALTY_PER_WPM) # Cap penalty at 30 points
    
    # 2. Filler Word Penalty:
    # We deduct 1.5 points per filler word. 
    # Why 1.5? A few "um"s are natural, but 10 filler words in a short answer should aggressively drop the score by 15 points.
    total_fillers = filler_count.get("total", 0)
    filler_penalty = min(30.0, total_fillers * 1.5) # Cap penalty at 30 points
    
    # 3. Silence Penalty:
    # We deduct 1 point for every 1% of the audio that is awkward silence.
    # Why 1.0? If 20% of the interview is dead air (silence_ratio = 0.20), losing 20 points is a fair heuristic.
    silence_ratio = silence_stats.get("silenceRatio", 0.0) if silence_stats else 0.0
    silence_penalty = min(40.0, (silence_ratio * 100) * 1.0) # Cap penalty at 40 points
    
    total_penalty = wpm_penalty + filler_penalty + silence_penalty
    final_score = max(0.0, round(score - total_penalty))
    
    return {
        "score": int(final_score),
        "wpm": round(wpm, 1),
        "fillerWordCount": total_fillers,
        "fillerWordBreakdown": filler_count.get("breakdown", {}),
        "silenceRatio": round(silence_ratio, 2),
        "breakdown": {
            "wpmPenalty": round(wpm_penalty, 1),
            "fillerPenalty": round(filler_penalty, 1),
            "silencePenalty": round(silence_penalty, 1)
        }
    }

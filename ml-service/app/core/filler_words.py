import re

FILLER_WORDS = {"um", "uh", "like", "you know", "so", "actually", "basically", "literally"}

def count_filler_words(text: str) -> dict:
    """
    Counts occurrences of known filler words in the transcript.
    Uses word-boundary regex to prevent matching "sound" inside "resound".
    """
    text = text.lower()
    breakdown = {}
    total_count = 0
    
    for filler in FILLER_WORDS:
        # \b ensures word boundaries so we don't match substrings
        pattern = r'\b' + re.escape(filler) + r'\b'
        matches = re.findall(pattern, text)
        count = len(matches)
        if count > 0:
            breakdown[filler] = count
            total_count += count
            
    return {
        "total": total_count,
        "breakdown": breakdown
    }

import random

def get_mock_confidence() -> float:
    """
    Generates a random confidence score between 70 and 100.
    This acts as a placeholder for the visual confidence evaluation (eye tracking, head pose)
    until it is fully implemented in Week 3.
    """
    return round(random.uniform(70.0, 100.0), 1)

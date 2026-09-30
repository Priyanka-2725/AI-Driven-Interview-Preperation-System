def get_mock_confidence() -> dict:
    """
    Returns a mocked confidence evaluation payload.
    """
    return {
        "isSample": True,
        "score": 72,
        "eyeContactPercent": 68.0,
        "headStability": "moderate",
        "note": "Sample data — real video-based confidence scoring is not yet implemented (see docs/week2-report.md open concerns)."
    }

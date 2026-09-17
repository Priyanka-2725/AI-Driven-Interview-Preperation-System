import pytest
from app.features.geometry import eye_aspect_ratio, is_blink

def test_eye_aspect_ratio():
    # Construct an open eye polygon
    # Points order: p0 (left), p1 (top left), p2 (top right), p3 (right), p4 (bottom right), p5 (bottom left)
    open_eye = [
        (0, 5),    # p0
        (2, 8),    # p1
        (8, 8),    # p2
        (10, 5),   # p3
        (8, 2),    # p4
        (2, 2)     # p5
    ]
    
    ear_open = eye_aspect_ratio(open_eye)
    assert ear_open > 0.30
    assert not is_blink(ear_open)
    
    # Construct a flattened eye polygon
    closed_eye = [
        (0, 5),
        (2, 5.5),
        (8, 5.5),
        (10, 5),
        (8, 4.5),
        (2, 4.5)
    ]
    
    ear_closed = eye_aspect_ratio(closed_eye)
    assert ear_closed < 0.15
    assert is_blink(ear_closed)

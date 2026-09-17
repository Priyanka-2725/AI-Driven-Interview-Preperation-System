import math

def euclidean(p1, p2):
    """
    Calculate Euclidean distance between two points (x, y).
    """
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def eye_aspect_ratio(eye):
    """
    Compute Eye Aspect Ratio (EAR) given 6 facial landmarks for an eye.
    """
    # Vertical distances
    A = euclidean(eye[1], eye[5])
    B = euclidean(eye[2], eye[4])
    # Horizontal distance
    C = euclidean(eye[0], eye[3])
    
    if C == 0:
        return 0.0
        
    ear = (A + B) / (2.0 * C)
    return ear

def is_blink(ear, threshold=0.2):
    """
    Determine if eye is blinked based on EAR.
    """
    return ear < threshold

def extract_geometry():
    """
    Placeholder for main geometry extraction endpoint, which is deferred to Week 2.
    """
    pass

# Audio Framing
FRAME_LENGTH = 512
HOP_LENGTH = 160

# Energy Thresholds
MIN_DB_THRESHOLD = -45.0  # db, below this is considered silence
MAX_DB_THRESHOLD = 0.0    # db, clipping point
EPSILON = 1e-10           # Smallest value for log calculation
MIN_PAUSE_DURATION_S = 1.2 # seconds, minimum duration for a silence segment

# Pitch Thresholds
PITCH_FMIN_HZ = 50.0       # Hz, lowest valid human voice
PITCH_FMAX_HZ = 400.0      # Hz, highest valid human voice

# Geometry Thresholds
MAX_HEAD_YAW = 15.0       # degrees, maximum allowed turn from center before flagging
MAX_HEAD_PITCH = 10.0     # degrees, maximum allowed tilt up/down before flagging

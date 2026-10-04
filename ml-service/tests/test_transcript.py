import pytest
from app.features.transcript import transcribe_audio

def test_transcribe_empty_or_silent():
    # If we pass a file that doesn't exist, it should raise an error
    with pytest.raises(Exception):
        transcribe_audio("non_existent_file.wav")

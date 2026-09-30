Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("d:\AI-INTERVIEW-COACH\ml-service\speech.wav")
$synth.Speak("Um, actually, I am literally a computer. Like, you know.")
$synth.Dispose()

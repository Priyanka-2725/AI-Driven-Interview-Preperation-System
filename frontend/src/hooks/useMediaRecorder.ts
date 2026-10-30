import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingStatus = 'idle' | 'permissionRequested' | 'ready' | 'recording' | 'uploading' | 'complete' | 'error';

export const useMediaRecorder = () => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const MAX_DURATION_SECONDS = 300; // 5 minutes cap
  
  const requestPermissions = useCallback(async () => {
    setStatus('permissionRequested');
    setError(null);
    try {
      // We request both for preview, but will only record audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      previewStreamRef.current = stream;
      
      // Setup Analyser for AudioLevelMeter
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      setStatus('ready');
      return stream;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get media permissions');
      setStatus('error');
      return null;
    }
  }, []);

  const stopRecordingInternal = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!previewStreamRef.current) {
      setError('Media stream not ready');
      return;
    }
    
    setRecordedBlob(null);
    setElapsedSeconds(0);
    
    try {
      // Create a stream with ONLY the audio tracks (per ADR-007)
      const audioOnlyStream = new MediaStream(previewStreamRef.current.getAudioTracks());
      
      // Enforce webm/opus per spec
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback for Safari/others if needed, but webm is requested by spec
        mimeType = 'audio/mp4'; 
      }
      
      const recorder = new MediaRecorder(audioOnlyStream, { mimeType });
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        setRecordedBlob(blob);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus('recording');
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= MAX_DURATION_SECONDS - 1) {
            stopRecordingInternal();
            return MAX_DURATION_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setStatus('error');
    }
  }, [stopRecordingInternal]);

  const stopRecording = useCallback(() => {
    stopRecordingInternal();
    setStatus('complete'); // Actually, let's just let it transition to idle or keep ready
  }, [stopRecordingInternal]);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    setElapsedSeconds(0);
    setStatus('ready');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    status,
    setStatus,
    error,
    recordedBlob,
    elapsedSeconds,
    previewStream: previewStreamRef.current,
    analyser: analyserRef.current,
    requestPermissions,
    startRecording,
    stopRecording,
    resetRecording
  };
};

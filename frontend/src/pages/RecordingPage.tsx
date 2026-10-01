import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { recordingService } from '../services/recordingService';
import { RecordingTimer } from '../components/recording/RecordingTimer';
import { AudioLevelMeter } from '../components/recording/AudioLevelMeter';
import { RecordingControls } from '../components/recording/RecordingControls';

export const RecordingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    status,
    setStatus,
    error: recorderError,
    recordedBlob,
    elapsedSeconds,
    previewStream,
    analyser,
    requestPermissions,
    startRecording,
    stopRecording,
    resetRecording
  } = useMediaRecorder();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bind live camera to video element
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const handleUpload = async () => {
    if (!recordedBlob) return;
    setUploadError(null);
    setStatus('uploading');
    try {
      const recording = await recordingService.uploadRecording(recordedBlob);
      navigate(`/results/${recording._id}`);
    } catch (err: any) {
      // Axios error handling
      setUploadError(err.response?.data?.error?.message || err.message || 'Upload failed');
      setStatus('complete'); // Allow retry
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Interview Practice</h1>
      
      {(recorderError || uploadError) && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
          <p className="font-bold">Error</p>
          <p>{recorderError || uploadError}</p>
        </div>
      )}

      {status === 'idle' && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-semibold mb-4">Ready to start?</h2>
          <p className="text-gray-600 mb-6">
            We will need access to your camera and microphone. Your video is only shown to you as a mirror and is NEVER recorded or uploaded. Only your audio is captured for fluency analysis.
          </p>
          <button 
            onClick={requestPermissions}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Allow Camera & Microphone
          </button>
        </div>
      )}

      {status !== 'idle' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          
          {/* Live Video Preview OR Audio playback preview */}
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {status !== 'complete' ? (
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${(status === 'ready' || status === 'recording' || status === 'uploading') ? 'opacity-100' : 'opacity-0'}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-800 flex-col space-y-4">
                <span className="text-white text-lg">Preview your response</span>
                {recordedBlob && (
                  <audio controls src={URL.createObjectURL(recordedBlob)} className="w-3/4" />
                )}
              </div>
            )}
            
            {status === 'recording' && (
              <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                REC
              </div>
            )}
          </div>
          
          {/* Info and controls */}
          <div className="flex flex-col items-center">
            <RecordingTimer elapsedSeconds={elapsedSeconds} />
            
            <div className="w-full max-w-md mt-4">
              <AudioLevelMeter analyser={analyser} isActive={status === 'recording' || status === 'ready'} />
            </div>
            
            <RecordingControls 
              status={status}
              onStart={startRecording}
              onStop={stopRecording}
              onReset={resetRecording}
              onUpload={handleUpload}
            />

            {status === 'uploading' && (
              <div className="mt-8 text-center w-full max-w-md">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-600 font-semibold text-lg">Transcribing & Analyzing...</span>
                </div>
                <p className="text-sm text-gray-500">
                  This can take up to 60 seconds depending on the length of your response. We are generating your transcript, computing WPM, and analyzing fluency in real-time. Please do not close this page.
                </p>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
};

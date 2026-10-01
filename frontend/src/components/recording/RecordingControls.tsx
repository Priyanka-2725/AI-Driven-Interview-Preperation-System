import React from 'react';
import { RecordingStatus } from '../../hooks/useMediaRecorder';

interface RecordingControlsProps {
  status: RecordingStatus;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onUpload: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({ status, onStart, onStop, onReset, onUpload }) => {
  if (status === 'idle' || status === 'permissionRequested') {
    return null;
  }

  return (
    <div className="flex justify-center items-center space-x-4 mt-6">
      {status === 'ready' && (
        <button onClick={onStart} className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition">
          Start Recording
        </button>
      )}
      
      {status === 'recording' && (
        <button onClick={onStop} className="px-6 py-3 bg-gray-800 text-white rounded-full font-semibold hover:bg-gray-900 transition flex items-center">
          <span className="w-4 h-4 bg-red-500 rounded-sm mr-2 animate-pulse"></span>
          Stop Recording
        </button>
      )}

      {status === 'complete' && (
        <>
          <button onClick={onReset} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition">
            Discard & Re-record
          </button>
          <button onClick={onUpload} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Submit for Analysis
          </button>
        </>
      )}

      {status === 'uploading' && (
        <button disabled className="px-6 py-3 bg-blue-400 text-white rounded-lg font-semibold cursor-not-allowed">
          Uploading & Analyzing...
        </button>
      )}
    </div>
  );
};

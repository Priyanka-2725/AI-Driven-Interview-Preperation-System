import React from 'react';

interface RecordingTimerProps {
  elapsedSeconds: number;
}

export const RecordingTimer: React.FC<RecordingTimerProps> = ({ elapsedSeconds }) => {
  const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
  const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
  
  // Show red if we are close to the 5 minute limit (e.g., > 4m 30s)
  const isWarning = elapsedSeconds > 270; 
  
  return (
    <div className={`text-2xl font-mono font-bold tracking-widest ${isWarning ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>
      {mins}:{secs} / 05:00
    </div>
  );
};

import React, { useEffect, useState } from 'react';

interface AudioLevelMeterProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

export const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({ analyser, isActive }) => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!analyser || !isActive) {
      setLevel(0);
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrameId: number;

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      // Convert to 0-100%
      const percent = Math.min(100, Math.round((avg / 255) * 100 * 1.5)); // 1.5x boost for visibility
      setLevel(percent);

      animationFrameId = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isActive]);

  return (
    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mt-2">
      <div 
        className="h-full bg-green-500 transition-all duration-75 ease-out"
        style={{ width: `${level}%` }}
      />
    </div>
  );
};

import { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';

export const useSystemHealth = () => {
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [mlStatus, setMlStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const result = await systemService.getMlHealth();
      setBackendStatus(result.backend as 'online' | 'offline' | 'checking');
      setMlStatus(result.mlService as 'online' | 'offline' | 'checking');
    } catch {
      setBackendStatus('offline');
      setMlStatus('offline');
    } finally {
      setIsChecking(false);
      setLastCheckedAt(new Date());
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkHealth();
    const intervalId = setInterval(checkHealth, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return { backendStatus, mlStatus, isChecking, lastCheckedAt };
};

import { apiClient } from './apiClient';
import { Recording } from '../types/recording';

export const recordingService = {
  uploadRecording: async (blob: Blob): Promise<Recording> => {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    
    // axios sets the multipart boundary automatically when sending FormData
    // The timeout for this endpoint needs to be large (180 seconds) because ML evaluation is synchronous
    const response = await apiClient.post<{ status: string; data: Recording }>('/recordings', formData, {
      timeout: 180000 // 180 seconds (3 minutes)
    });
    return response.data.data;
  },
  
  listRecordings: async (page = 1, limit = 20): Promise<{ recordings: Recording[], total: number, page: number, totalPages: number }> => {
    const response = await apiClient.get('/recordings', { params: { page, limit } });
    return response.data.data;
  },
  
  getRecording: async (id: string): Promise<Recording> => {
    const response = await apiClient.get<{ status: string; data: Recording }>(`/recordings/${id}`);
    return response.data.data;
  }
};

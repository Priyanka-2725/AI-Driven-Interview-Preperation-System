import { apiClient } from './apiClient';
import { ApiResponse } from '../types/api.types';

export interface MLHealthResponse {
  backend: string;
  mlService: string;
}

export const systemService = {
  async getMlHealth(): Promise<MLHealthResponse> {
    const response = await apiClient.get<ApiResponse<MLHealthResponse>>('/system/ml-health');
    if (!response.data.success || !response.data.data) {
      throw response.data.error;
    }
    return response.data.data;
  }
};

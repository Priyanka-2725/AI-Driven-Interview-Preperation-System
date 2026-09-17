import { apiClient } from './apiClient';
import { AuthResponse, RefreshResponse, User } from '../types/auth.types';
import { ApiResponse } from '../types/api.types';
import { setToken, clearToken } from '../utils/tokenStorage';

export const authService = {
  async login(email: string, password: string):Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    if (!response.data.success || !response.data.data) {
      throw response.data.error;
    }
    setToken(response.data.data.accessToken);
    return response.data.data;
  },

  async register(fullName: string, email: string, password: string):Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', { fullName, email, password });
    if (!response.data.success || !response.data.data) {
      throw response.data.error;
    }
    setToken(response.data.data.accessToken);
    return response.data.data;
  },

  async refreshSession(): Promise<string> {
    // using axios directly for refresh to avoid interceptor loop
    const { env } = await import('../config/env');
    const axios = (await import('axios')).default;
    const response = await axios.post<ApiResponse<RefreshResponse>>(`${env.API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
    
    if (!response.data.success || !response.data.data) {
      throw response.data.error;
    }
    setToken(response.data.data.accessToken);
    return response.data.data.accessToken;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearToken();
    }
  },

  async getMe() {
    const response = await apiClient.get<ApiResponse<{user: User}>>('/auth/me');
    if (!response.data.success || !response.data.data) {
      throw response.data.error;
    }
    return response.data.data.user;
  }
};

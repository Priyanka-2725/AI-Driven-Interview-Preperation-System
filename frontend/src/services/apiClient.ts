import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { getToken, setToken, clearToken } from '../utils/tokenStorage';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Request-Id'] = crypto.randomUUID();
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
      console.log('[Axios] Interceptor caught 401, entering retry block');
      if (isRefreshing) {
        console.log('[Axios] isRefreshing is true, queuing request');
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      console.log('[Axios] Calling /auth/refresh via axios.post');
      return new Promise(function (resolve, reject) {
        axios.post(`${env.API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          .then((response) => {
            const token = response.data.data.accessToken;
            setToken(token);
            processQueue(null, token);
            resolve(apiClient(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            clearToken();
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

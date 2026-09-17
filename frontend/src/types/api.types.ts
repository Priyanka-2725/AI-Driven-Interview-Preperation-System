export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export class ApiResponse {
  static success(data, requestId) {
    return {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      }
    };
  }

  static error(code, message, details, requestId) {
    return {
      success: false,
      error: {
        code,
        message,
        details: details || null
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

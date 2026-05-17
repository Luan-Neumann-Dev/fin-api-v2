export class ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;

  constructor(params: {
    success: boolean;
    message: string;
    data?: T | null;
    meta?: Record<string, unknown>;
  }) {
    this.success = params.success;
    this.message = params.message;
    this.data = params.data ?? null;
    this.meta = params.meta;
  }

  static ok<T>(data: T, message = 'Success', meta?: Record<string, unknown>) {
    return new ApiResponse({ success: true, message, data, meta });
  }

  static created<T>(data: T, message = 'Created') {
    return new ApiResponse({ success: true, message, data });
  }

  static noContent(message = 'Deleted') {
    return new ApiResponse({ success: true, message, data: null });
  }

  static error(message: string) {
    return new ApiResponse({ success: false, message, data: null });
  }
}

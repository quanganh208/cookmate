/**
 * Backend `ApiResponse<T>` envelope mirror. Kept in sync with
 * `backend/src/main/java/com/cookmate/shared/dto/ApiResponse.java`.
 */
export interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/**
 * Typed API error thrown by `apiClient` on a non-successful response. Carries the backend error
 * code (semantic, e.g. `BAD_CREDENTIALS`) so callers — typically error mappers in the auth
 * feature — can render the right user-facing message without string-matching.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/** Common network/parse failure code when the wire response cannot be interpreted. */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

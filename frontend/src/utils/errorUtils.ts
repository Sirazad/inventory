import axios from 'axios';

/**
 * Extract a user-facing error message from an API error.
 * Replaces all `catch (err: any)` patterns with a type-safe alternative.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message
      ?? err.response?.data?.error
      ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

/**
 * Check if the error is an Axios error with a specific HTTP status.
 */
export function isApiStatus(err: unknown, status: number): boolean {
  return axios.isAxiosError(err) && err.response?.status === status;
}

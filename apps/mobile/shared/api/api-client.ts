const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

/** Typed fetch wrapper with error handling */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const { headers: customHeaders, ...restOptions } = options ?? {};
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: { 'Content-Type': 'application/json', ...customHeaders },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

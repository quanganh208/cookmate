import { useAuthStore } from '@/features/auth/store';
import { ApiError, NETWORK_ERROR_CODE, type ApiResponseEnvelope } from '@/shared/api/api-error';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? 'dev-api-key-change-in-production';

export interface UploadResult {
  url: string;
}

/**
 * Multipart upload — intentionally goes around the regular {@code apiClient} because fetch's
 * {@code FormData} support can't be preceded by a JSON body. Still injects the API key and
 * Bearer token from the auth store and unwraps the {@code ApiResponseEnvelope} in the same
 * shape callers expect.
 */
export async function uploadImage(localUri: string, uploadId: string): Promise<UploadResult> {
  const accessToken = useAuthStore.getState().session?.accessToken;
  const form = new FormData();
  // React Native FormData requires a { uri, name, type } triple for native files.
  form.append('file', {
    uri: localUri,
    name: `recipe-${uploadId}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);

  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'X-Upload-Id': uploadId,
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/uploads/image`, {
      method: 'POST',
      headers,
      body: form as unknown as BodyInit,
    });
  } catch (err) {
    throw new ApiError(NETWORK_ERROR_CODE, (err as Error).message ?? 'Upload failed', 0);
  }

  let envelope: ApiResponseEnvelope<UploadResult> | null = null;
  try {
    envelope = (await response.json()) as ApiResponseEnvelope<UploadResult>;
  } catch {
    // fallthrough
  }

  if (!response.ok || !envelope || envelope.success === false) {
    const code = envelope?.error?.code ?? `HTTP_${response.status}`;
    const message = envelope?.error?.message ?? `Upload failed (${response.status})`;
    throw new ApiError(code, message, response.status);
  }

  return envelope.data as UploadResult;
}

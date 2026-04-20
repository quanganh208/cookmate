import { useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../api/upload-repository';
import { resizeImageForUpload } from '../utils/resize-image';
import { ApiError } from '@/shared/api/api-error';

type Phase = 'idle' | 'picking' | 'resizing' | 'uploading' | 'done' | 'error';

function generateUploadId(): string {
  // RFC 4122 v4 without pulling in uuid — crypto.randomUUID() is available in Hermes + new arch.
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Fallback: timestamp + random hex (not cryptographically strong, but the BE just treats
  // this as an opaque dedup key — good enough).
  return `fallback-${Date.now()}-${Math.floor(Math.random() * 1e9).toString(16)}`;
}

interface UseUploadImageResult {
  phase: Phase;
  imageUrl: string | null;
  previewUri: string | null;
  error: string | null;
  pickFromLibrary: () => Promise<void>;
  takePhoto: () => Promise<void>;
  reset: () => void;
}

/**
 * End-to-end image picker → resize → upload flow. The same {@code uploadId} is reused across
 * retries so the BE's {@code X-Upload-Id} idempotency kicks in (no duplicate R2 objects on
 * network flake).
 */
export function useUploadImage(): UseUploadImageResult {
  const [phase, setPhase] = useState<Phase>('idle');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadIdRef = useRef<string>(generateUploadId());

  const reset = useCallback(() => {
    setPhase('idle');
    setImageUrl(null);
    setPreviewUri(null);
    setError(null);
    uploadIdRef.current = generateUploadId();
  }, []);

  const runPipeline = useCallback(
    async (result: ImagePicker.ImagePickerResult, sourceLabel: 'library' | 'camera') => {
      if (result.canceled || !result.assets[0]) {
        setPhase('idle');
        return;
      }
      const asset = result.assets[0];
      setPreviewUri(asset.uri);

      try {
        setPhase('resizing');
        const orientation = (asset.exif?.Orientation ?? asset.exif?.orientation) as
          | number
          | undefined;
        const resized = await resizeImageForUpload({ uri: asset.uri, orientation });
        setPreviewUri(resized.uri);

        setPhase('uploading');
        const up = await uploadImage(resized.uri, uploadIdRef.current);
        setImageUrl(up.url);
        setPhase('done');
      } catch (err) {
        setPhase('error');
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : `Upload (${sourceLabel}) failed`,
        );
      }
    },
    [],
  );

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo library permission required');
      setPhase('error');
      return;
    }
    setPhase('picking');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: true,
    });
    await runPipeline(result, 'library');
  }, [runPipeline]);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError('Camera permission required');
      setPhase('error');
      return;
    }
    setPhase('picking');
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      exif: true,
    });
    await runPipeline(result, 'camera');
  }, [runPipeline]);

  return { phase, imageUrl, previewUri, error, pickFromLibrary, takePhoto, reset };
}

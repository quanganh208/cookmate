import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Target max width in pixels — keeps typical uploads under ~1 MB after JPEG compression while
 * staying sharp on hi-DPI phone screens. See plan red-team finding #10 + decision D9.
 */
export const MAX_WIDTH = 1280;
export const JPEG_QUALITY = 0.8;

/** Mapping from EXIF Orientation tag (#274) to rotation degrees the manipulator needs. */
export function orientationToDegrees(orientation: number | undefined): number {
  switch (orientation) {
    case 3:
    case 4:
      return 180;
    case 5:
    case 6:
      return 90;
    case 7:
    case 8:
      return 270;
    default:
      // 1 and 2 (or undefined) → no rotation needed.
      return 0;
  }
}

export interface ResizeInput {
  uri: string;
  orientation?: number;
}

export interface ResizeResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * EXIF-orientation-safe resize pipeline. Applies explicit rotation FIRST (so pixel data ends up
 * upright) and then resizes to at most {@link MAX_WIDTH} keeping aspect ratio. Output is always
 * JPEG at {@link JPEG_QUALITY} — EXIF is stripped as a byproduct, which is fine because we've
 * already baked the correct pixel orientation into the bitmap.
 *
 * iPhone portrait shots default to Orientation=6 with landscape pixel data; without the explicit
 * rotate step the resulting upload renders sideways on any viewer that ignores EXIF.
 */
export async function resizeImageForUpload({
  uri,
  orientation,
}: ResizeInput): Promise<ResizeResult> {
  const actions: ImageManipulator.Action[] = [];
  const degrees = orientationToDegrees(orientation);
  if (degrees !== 0) {
    actions.push({ rotate: degrees });
  }
  actions.push({ resize: { width: MAX_WIDTH } });

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return { uri: result.uri, width: result.width, height: result.height };
}

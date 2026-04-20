/**
 * Unit tests for the pure `orientationToDegrees` helper. The full `resizeImageForUpload`
 * pipeline wraps `expo-image-manipulator` which is a native module — we verify the
 * EXIF-Orientation → degrees mapping that drives it.
 */

import { orientationToDegrees } from '@/features/create-recipe/utils/resize-image';

describe('orientationToDegrees', () => {
  it('returns 0 for undefined and the "no rotation" orientations', () => {
    expect(orientationToDegrees(undefined)).toBe(0);
    expect(orientationToDegrees(1)).toBe(0);
    expect(orientationToDegrees(2)).toBe(0);
  });

  it('maps 3/4 to 180 (upside down)', () => {
    expect(orientationToDegrees(3)).toBe(180);
    expect(orientationToDegrees(4)).toBe(180);
  });

  it('maps 5/6 to 90 (iPhone portrait default)', () => {
    expect(orientationToDegrees(5)).toBe(90);
    expect(orientationToDegrees(6)).toBe(90);
  });

  it('maps 7/8 to 270', () => {
    expect(orientationToDegrees(7)).toBe(270);
    expect(orientationToDegrees(8)).toBe(270);
  });

  it('treats unknown values as no-op', () => {
    expect(orientationToDegrees(99)).toBe(0);
  });
});

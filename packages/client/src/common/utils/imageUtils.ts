/**
 * Utilities for extracting image dimensions and computing standard scene/grid layouts.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export const DEFAULT_MAP_DIMENSIONS: ImageDimensions = {
  width: 2000,
  height: 1500,
};

/**
 * Calculates standard default tiles and grid size for a given map resolution.
 */
export function calculateDefaultTiles(
  width: number,
  height: number
): {
  tilesX: number;
  tilesY: number;
  gridSize: number;
} {
  const safeWidth = width > 0 ? width : DEFAULT_MAP_DIMENSIONS.width;
  const safeHeight = height > 0 ? height : DEFAULT_MAP_DIMENSIONS.height;
  const tilesX = Math.max(10, Math.round(safeWidth / 70));
  const tilesY = Math.max(10, Math.round(safeHeight / 70));
  const gridSize = Math.round(safeWidth / tilesX);
  return { tilesX, tilesY, gridSize };
}

/**
 * Safely resolves the natural dimensions of an image source (data URL, object URL, or URL).
 * Falls back to default dimensions (2000x1500) if image loading fails or is not in a browser environment.
 */
export function getImageDimensions(
  src: string,
  fallback = DEFAULT_MAP_DIMENSIONS,
  timeoutMs = 5000
): Promise<ImageDimensions> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined' || !src) {
      resolve(fallback);
      return;
    }

    const img = new Image();
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        const width = img.naturalWidth || img.width || fallback.width;
        const height = img.naturalHeight || img.height || fallback.height;
        resolve({ width, height });
      }
    };

    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(fallback);
      }
    };

    img.src = src;

    // In case the image was already cached/synchronously loaded
    if (img.complete && img.naturalWidth > 0 && !settled) {
      settled = true;
      clearTimeout(timer);
      resolve({
        width: img.naturalWidth || img.width || fallback.width,
        height: img.naturalHeight || img.height || fallback.height,
      });
    }
  });
}

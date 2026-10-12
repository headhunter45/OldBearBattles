import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  calculateDefaultTiles,
  DEFAULT_MAP_DIMENSIONS,
  getImageDimensions,
} from './imageUtils.js';

describe('imageUtils', () => {
  it('calculates tiles and grid size for 1024x1536 map', () => {
    const layout = calculateDefaultTiles(1024, 1536);
    // 1024 / 70 = 14.63 -> 15
    assert.strictEqual(layout.tilesX, 15);
    // 1536 / 70 = 21.94 -> 22
    assert.strictEqual(layout.tilesY, 22);
    // 1024 / 15 = 68.26 -> 68
    assert.strictEqual(layout.gridSize, 68);
  });

  it('calculates tiles and grid size for 2000x1500 default map', () => {
    const layout = calculateDefaultTiles(2000, 1500);
    assert.strictEqual(layout.tilesX, 29);
    assert.strictEqual(layout.tilesY, 21);
    assert.strictEqual(layout.gridSize, 69);
  });

  it('enforces minimum tile count of 10 for small images', () => {
    const layout = calculateDefaultTiles(200, 300);
    assert.strictEqual(layout.tilesX, 10);
    assert.strictEqual(layout.tilesY, 10);
    assert.strictEqual(layout.gridSize, 20);
  });

  it('returns fallback dimensions in Node test environment where Image is undefined', async () => {
    const dims = await getImageDimensions('data:image/png;base64,fake');
    assert.strictEqual(dims.width, DEFAULT_MAP_DIMENSIONS.width);
    assert.strictEqual(dims.height, DEFAULT_MAP_DIMENSIONS.height);
  });

  it('resolves custom fallback if provided and Image is undefined', async () => {
    const dims = await getImageDimensions('data:image/png;base64,fake', {
      width: 1024,
      height: 1536,
    });
    assert.strictEqual(dims.width, 1024);
    assert.strictEqual(dims.height, 1536);
  });
});

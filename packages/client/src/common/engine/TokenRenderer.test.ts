import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isPointInToken } from './TokenRenderer.js';
import { Token } from '@oldbear/shared';

describe('isPointInToken Hit Detection (OB-194)', () => {
  const gridSize = 50;

  it('detects hits anywhere within a 1x1 circular token ring border', () => {
    const token: Token = {
      id: 'tok-1',
      mapId: 'map-1',
      name: 'Fighter',
      x: 100,
      y: 100,
      size: 1,
      rotation: 0,
      ringColor: '#64748b',
      fillColor: '#1e293b',
      clipCircle: true,
      currentHp: 10,
      maxHp: 10,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
    };

    // Center is (125, 125), radius is 25
    assert.strictEqual(isPointInToken({ x: 125, y: 125 }, token, gridSize), true, 'Center should hit');
    assert.strictEqual(isPointInToken({ x: 125, y: 100 }, token, gridSize), true, 'Top edge of ring should hit');
    assert.strictEqual(isPointInToken({ x: 150, y: 125 }, token, gridSize), true, 'Right edge of ring should hit');
    assert.strictEqual(isPointInToken({ x: 125, y: 150 }, token, gridSize), true, 'Bottom edge of ring should hit');
    assert.strictEqual(isPointInToken({ x: 100, y: 125 }, token, gridSize), true, 'Left edge of ring should hit');
    assert.strictEqual(isPointInToken({ x: 140, y: 140 }, token, gridSize), true, 'Inside diagonal should hit');

    // Corners outside the circle
    assert.strictEqual(isPointInToken({ x: 101, y: 101 }, token, gridSize), false, 'Top-left corner outside ring should not hit');
    assert.strictEqual(isPointInToken({ x: 149, y: 101 }, token, gridSize), false, 'Top-right corner outside ring should not hit');
    assert.strictEqual(isPointInToken({ x: 90, y: 125 }, token, gridSize), false, 'Far left outside ring should not hit');
    assert.strictEqual(isPointInToken({ x: 160, y: 125 }, token, gridSize), false, 'Far right outside ring should not hit');
  });

  it('detects hits accurately for multi-tile tokens (e.g. 2x2 large creature)', () => {
    const token: Token = {
      id: 'tok-large',
      mapId: 'map-1',
      name: 'Ogre',
      x: 100,
      y: 100,
      size: 2,
      rotation: 0,
      ringColor: '#64748b',
      fillColor: '#1e293b',
      clipCircle: true,
      currentHp: 50,
      maxHp: 50,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
    };

    // 2x2 token occupies (100, 100) to (200, 200).
    // True visual center is (150, 150) with radius 50.
    assert.strictEqual(isPointInToken({ x: 150, y: 150 }, token, gridSize), true, 'Center should hit');
    assert.strictEqual(isPointInToken({ x: 195, y: 150 }, token, gridSize), true, 'Right ring border should hit');
    assert.strictEqual(isPointInToken({ x: 150, y: 195 }, token, gridSize), true, 'Bottom ring border should hit');
    assert.strictEqual(isPointInToken({ x: 105, y: 150 }, token, gridSize), true, 'Left ring border should hit');
    assert.strictEqual(isPointInToken({ x: 150, y: 105 }, token, gridSize), true, 'Top ring border should hit');

    // Outside points
    assert.strictEqual(isPointInToken({ x: 90, y: 90 }, token, gridSize), false, 'Top-left outside should not hit');
    assert.strictEqual(isPointInToken({ x: 210, y: 150 }, token, gridSize), false, 'Right outside should not hit');
  });

  it('detects hits anywhere within square and rounded token rectangle borders', () => {
    const squareToken: Token = {
      id: 'tok-square',
      mapId: 'map-1',
      name: 'Gelatinous Cube',
      x: 100,
      y: 100,
      size: 1,
      rotation: 0,
      ringColor: '#64748b',
      fillColor: '#1e293b',
      clipCircle: false,
      clipShape: 'square',
      currentHp: 30,
      maxHp: 30,
      tempHp: 0,
      speed: 15,
      conditions: [],
      isProp: false,
      layer: 'token',
    };

    // Square occupies (100, 100) to (150, 150).
    // All 4 corners inside rectangle border must register:
    assert.strictEqual(isPointInToken({ x: 101, y: 101 }, squareToken, gridSize), true, 'Top-left corner within rectangle border should hit');
    assert.strictEqual(isPointInToken({ x: 149, y: 101 }, squareToken, gridSize), true, 'Top-right corner within rectangle border should hit');
    assert.strictEqual(isPointInToken({ x: 101, y: 149 }, squareToken, gridSize), true, 'Bottom-left corner within rectangle border should hit');
    assert.strictEqual(isPointInToken({ x: 149, y: 149 }, squareToken, gridSize), true, 'Bottom-right corner within rectangle border should hit');
    assert.strictEqual(isPointInToken({ x: 125, y: 125 }, squareToken, gridSize), true, 'Center of square should hit');

    // Points outside rectangle border
    assert.strictEqual(isPointInToken({ x: 99, y: 125 }, squareToken, gridSize), false, 'Left of rectangle border should not hit');
    assert.strictEqual(isPointInToken({ x: 151, y: 125 }, squareToken, gridSize), false, 'Right of rectangle border should not hit');

    const roundedToken: Token = {
      ...squareToken,
      id: 'tok-rounded',
      clipShape: 'rounded',
    };
    assert.strictEqual(isPointInToken({ x: 125, y: 125 }, roundedToken, gridSize), true, 'Center of rounded should hit');
    assert.strictEqual(isPointInToken({ x: 125, y: 102 }, roundedToken, gridSize), true, 'Edge of rounded should hit');
  });

  it('handles rotated square tokens correctly', () => {
    const rotatedSquare: Token = {
      id: 'tok-rot-sq',
      mapId: 'map-1',
      name: 'Diamond Token',
      x: 100,
      y: 100,
      size: 1,
      rotation: 45,
      ringColor: '#64748b',
      fillColor: '#1e293b',
      clipCircle: false,
      clipShape: 'square',
      currentHp: 20,
      maxHp: 20,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
    };

    // Center is (125, 125). Rotated 45 degrees, the corners are along the axes at distance radius * sqrt(2) ~ 35.35:
    // (125, 125 - 35) is near top diamond tip.
    assert.strictEqual(isPointInToken({ x: 125, y: 125 }, rotatedSquare, gridSize), true, 'Center should hit');
    assert.strictEqual(isPointInToken({ x: 125, y: 95 }, rotatedSquare, gridSize), true, 'Top diamond point should hit');

    // (102, 102) was the unrotated corner; rotated 45 deg, that area is now outside the diamond:
    assert.strictEqual(isPointInToken({ x: 102, y: 102 }, rotatedSquare, gridSize), false, 'Outside rotated diamond corner should not hit');
  });

  it('detects hits anywhere within prop and modular tile rectangular borders', () => {
    const tileProp: Token = {
      id: 'tile-dungeon',
      mapId: 'map-1',
      name: 'Corridor 4x2',
      x: 200,
      y: 300,
      size: 1,
      propWidth: 4,
      propHeight: 2,
      rotation: 0,
      ringColor: 'transparent',
      fillColor: 'transparent',
      clipCircle: false,
      currentHp: 1,
      maxHp: 1,
      tempHp: 0,
      speed: 0,
      conditions: [],
      isProp: true,
      layer: 'map',
    };

    // Prop is 4x2 tiles = 200px wide, 100px high. Occupies (200, 300) to (400, 400).
    assert.strictEqual(isPointInToken({ x: 205, y: 305 }, tileProp, gridSize), true, 'Top-left of prop should hit');
    assert.strictEqual(isPointInToken({ x: 395, y: 305 }, tileProp, gridSize), true, 'Top-right of prop should hit');
    assert.strictEqual(isPointInToken({ x: 205, y: 395 }, tileProp, gridSize), true, 'Bottom-left of prop should hit');
    assert.strictEqual(isPointInToken({ x: 395, y: 395 }, tileProp, gridSize), true, 'Bottom-right of prop should hit');
    assert.strictEqual(isPointInToken({ x: 300, y: 350 }, tileProp, gridSize), true, 'Center of prop should hit');

    // Outside bounds
    assert.strictEqual(isPointInToken({ x: 195, y: 350 }, tileProp, gridSize), false, 'Left of prop should not hit');
    assert.strictEqual(isPointInToken({ x: 405, y: 350 }, tileProp, gridSize), false, 'Right of prop should not hit');
    assert.strictEqual(isPointInToken({ x: 300, y: 295 }, tileProp, gridSize), false, 'Above prop should not hit');
    assert.strictEqual(isPointInToken({ x: 300, y: 405 }, tileProp, gridSize), false, 'Below prop should not hit');
  });

  it('detects hits for hexagon and octagon token shapes', () => {
    const hexToken: Token = {
      id: 'tok-hex',
      mapId: 'map-1',
      name: 'Hex Hero',
      x: 100,
      y: 100,
      size: 1,
      rotation: 0,
      ringColor: '#64748b',
      fillColor: '#1e293b',
      clipCircle: false,
      clipShape: 'hexagon',
      currentHp: 20,
      maxHp: 20,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
    };

    assert.strictEqual(isPointInToken({ x: 125, y: 125 }, hexToken, gridSize), true, 'Hex center should hit');
    assert.strictEqual(isPointInToken({ x: 148, y: 125 }, hexToken, gridSize), true, 'Hex right vertex should hit');
    assert.strictEqual(isPointInToken({ x: 102, y: 125 }, hexToken, gridSize), true, 'Hex left vertex should hit');
    assert.strictEqual(isPointInToken({ x: 101, y: 101 }, hexToken, gridSize), false, 'Hex corner outside should not hit');

    const octToken: Token = {
      ...hexToken,
      id: 'tok-oct',
      clipShape: 'octagon',
    };

    assert.strictEqual(isPointInToken({ x: 125, y: 125 }, octToken, gridSize), true, 'Oct center should hit');
    assert.strictEqual(isPointInToken({ x: 101, y: 101 }, octToken, gridSize), false, 'Oct corner outside should not hit');
  });
});

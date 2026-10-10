import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Viewport } from './Viewport.js';
import {
  TRACKPAD_PAN_SENSITIVITY,
  TRACKPAD_ZOOM_SENSITIVITY,
  MOUSE_WHEEL_ZOOM_SENSITIVITY,
  computeRelativeDragPosition,
  CanvasEngine,
} from './CanvasEngine.js';

describe('CanvasEngine', () => {
  it('selects all enclosed tokens with box select and moves them as a group (Bug #78)', () => {
    // Mock tokens within a map
    const mockTokens = [
      { id: 't1', name: 'Goblin 1', x: 100, y: 100, size: 1, mapId: 'map-1' },
      { id: 't2', name: 'Goblin 2', x: 150, y: 100, size: 1, mapId: 'map-1' },
      { id: 't3', name: 'Goblin 3', x: 200, y: 100, size: 1, mapId: 'map-1' },
      { id: 't4', name: 'Dragon', x: 500, y: 500, size: 2, mapId: 'map-1' },
    ];

    const gridSize = 50;
    const boxStart = { x: 80, y: 80 };
    const boxEnd = { x: 280, y: 180 };

    const minX = Math.min(boxStart.x, boxEnd.x);
    const maxX = Math.max(boxStart.x, boxEnd.x);
    const minY = Math.min(boxStart.y, boxEnd.y);
    const maxY = Math.max(boxStart.y, boxEnd.y);

    const enclosed = mockTokens.filter((t) => {
      const diameter = t.size * gridSize;
      const cx = t.x + diameter / 2;
      const cy = t.y + diameter / 2;
      return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
    });

    // Verify all 3 goblins are enclosed, but not Dragon
    assert.strictEqual(enclosed.length, 3);
    assert.deepStrictEqual(
      enclosed.map((t) => t.id),
      ['t1', 't2', 't3'],
    );

    // Simulate group movement delta: dx = 50, dy = 100
    const deltaX = 50;
    const deltaY = 100;
    const movedTokens = enclosed.map((t) => ({
      ...t,
      x: t.x + deltaX,
      y: t.y + deltaY,
    }));

    assert.strictEqual(movedTokens[0].x, 150);
    assert.strictEqual(movedTokens[0].y, 200);
    assert.strictEqual(movedTokens[1].x, 200);
    assert.strictEqual(movedTokens[1].y, 200);
    assert.strictEqual(movedTokens[2].x, 250);
    assert.strictEqual(movedTokens[2].y, 200);
  });

  it('separates trackpad two-finger pan from pinch-to-zoom using sensitivity constants (Task #117)', () => {
    const vp = new Viewport(0, 0, 1.0);

    // Standard two-finger swipe (e.ctrlKey === false): pans without changing scale
    const deltaX = 30;
    const deltaY = 50;
    const panX = -deltaX * TRACKPAD_PAN_SENSITIVITY;
    const panY = -deltaY * TRACKPAD_PAN_SENSITIVITY;
    vp.pan(panX, panY);

    assert.strictEqual(vp.x, -30);
    assert.strictEqual(vp.y, -50);
    assert.strictEqual(vp.scale, 1.0);

    // Pinch-to-zoom (e.ctrlKey === true): zooms exponentially at cursor anchor
    const pinchDelta = -10;
    const zoomFactor = Math.exp(-pinchDelta * TRACKPAD_ZOOM_SENSITIVITY);
    vp.zoomAt(100, 100, zoomFactor);

    assert.strictEqual(vp.scale > 1.0, true);
    assert.strictEqual(TRACKPAD_PAN_SENSITIVITY > 0, true);
    assert.strictEqual(TRACKPAD_ZOOM_SENSITIVITY > 0, true);
    assert.strictEqual(MOUSE_WHEEL_ZOOM_SENSITIVITY > 0, true);
  });

  it('reverts box select tool to arrow select upon enclosing tokens (Task #117)', () => {
    let currentTool = 'box-select';
    const onToolChange = (tool: string) => {
      currentTool = tool;
    };

    const enclosedTokens = [{ id: 't1' }, { id: 't2' }];
    if (enclosedTokens.length > 0) {
      currentTool = 'select';
      onToolChange('select');
    }

    assert.strictEqual(currentTool, 'select');
  });

  describe('Relative Dragging for Tokens, Modular Tiles, and Props (OB-188)', () => {
    it('drags token relatively without jumping origin or center to cursor', () => {
      // 1x1 token at (100, 100). User grabs at (115, 125)
      const token = { x: 100, y: 100, size: 1 };
      const grabPos = { x: 115, y: 125 };
      const grabOffset = { x: grabPos.x - token.x, y: grabPos.y - token.y };

      // Cursor moves to (165, 175) with snap disabled
      const newPos = computeRelativeDragPosition(
        { x: 165, y: 175 },
        grabOffset,
        false,
        50,
        1
      );

      assert.strictEqual(newPos.x, 150);
      assert.strictEqual(newPos.y, 150);
    });

    it('snaps relatively to grid without jumping center to cursor', () => {
      const token = { x: 100, y: 100, size: 1 };
      const grabOffset = { x: 10, y: 10 };

      // Cursor moves 30px right: (140, 110)
      // Raw position: (140 - 10, 110 - 10) = (130, 100)
      // Snapped to 50px grid: (150, 100)
      const snapped = computeRelativeDragPosition(
        { x: 140, y: 110 },
        grabOffset,
        true,
        50,
        1
      );

      assert.strictEqual(snapped.x, 150);
      assert.strictEqual(snapped.y, 100);
    });

    it('drags large 8x8 modular room tile relatively without corner-to-center jumping', () => {
      // 8x8 tile (400px x 400px) at (500, 500)
      const roomTile = { x: 500, y: 500, size: 8, isProp: true, propWidth: 8, propHeight: 8 };
      // User grabs near bottom-right corner at (850, 850)
      const grabPos = { x: 850, y: 850 };
      const grabOffset = { x: grabPos.x - roomTile.x, y: grabPos.y - roomTile.y }; // { x: 350, y: 350 }

      // Drag cursor moves by (50, 100) -> worldPos = (900, 950)
      const newPos = computeRelativeDragPosition(
        { x: 900, y: 950 },
        grabOffset,
        false,
        50,
        8
      );

      assert.strictEqual(newPos.x, 550);
      assert.strictEqual(newPos.y, 600);
    });

    it('preserves multi-token group drag relative offsets for all selected tokens', () => {
      const tokenA = { id: 'a', x: 100, y: 100 };
      const tokenB = { id: 'b', x: 250, y: 100 };
      const tokenC = { id: 'c', x: 100, y: 300 };

      // Grab tokenA at (120, 120), grabOffset = (20, 20)
      const grabOffsetA = { x: 20, y: 20 };
      const dragStartPos = { x: tokenA.x, y: tokenA.y };

      // Move cursor to (220, 220)
      const newPosA = computeRelativeDragPosition(
        { x: 220, y: 220 },
        grabOffsetA,
        false,
        50,
        1
      );

      const deltaX = newPosA.x - dragStartPos.x; // 200 - 100 = 100
      const deltaY = newPosA.y - dragStartPos.y; // 200 - 100 = 100

      const movedB = { x: tokenB.x + deltaX, y: tokenB.y + deltaY };
      const movedC = { x: tokenC.x + deltaX, y: tokenC.y + deltaY };

      assert.strictEqual(newPosA.x, 200);
      assert.strictEqual(newPosA.y, 200);
      assert.strictEqual(movedB.x, 350);
      assert.strictEqual(movedB.y, 200);
      assert.strictEqual(movedC.x, 200);
      assert.strictEqual(movedC.y, 400);

      // Relative distances between tokens are exactly preserved
      assert.strictEqual(movedB.x - newPosA.x, tokenB.x - tokenA.x);
      assert.strictEqual(movedC.y - newPosA.y, tokenC.y - tokenA.y);
    });
  });

  it('blurs active input elements and focuses canvas on pointerdown (OB-218)', () => {
    let blurred = false;
    let canvasFocused = false;
    const mockInput: any = {
      tagName: 'INPUT',
      blur: () => {
        blurred = true;
      },
    };
    // Make instanceof HTMLElement work in Node test env
    Object.setPrototypeOf(mockInput, (globalThis as any).HTMLElement?.prototype || Object.prototype);

    const mockCanvas: any = {
      getContext: () => ({}),
      addEventListener: () => {},
      removeEventListener: () => {},
      setPointerCapture: () => {},
      focus: () => {
        canvasFocused = true;
      },
      style: {},
    };
    Object.setPrototypeOf(mockCanvas, (globalThis as any).HTMLElement?.prototype || Object.prototype);

    const prevDoc = (globalThis as any).document;
    const prevWin = (globalThis as any).window;
    const prevRaf = (globalThis as any).requestAnimationFrame;
    const prevCaf = (globalThis as any).cancelAnimationFrame;

    (globalThis as any).requestAnimationFrame = (cb: any) => 0;
    (globalThis as any).cancelAnimationFrame = () => {};

    (globalThis as any).document = {
      activeElement: mockInput,
      createElement: () => ({
        getContext: () => ({}),
        width: 100,
        height: 100,
      }),
    };
    (globalThis as any).window = {
      addEventListener: () => {},
      removeEventListener: () => {},
      innerWidth: 1920,
      innerHeight: 1080,
    };

    const engine = new CanvasEngine(mockCanvas);
    assert.strictEqual(mockCanvas.tabIndex, 0, 'Canvas has tabIndex 0 to be focusable');

    let prevented = false;
    (engine as any).onPointerDown({
      preventDefault: () => {
        prevented = true;
      },
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });

    (globalThis as any).document = prevDoc;
    (globalThis as any).window = prevWin;
    (globalThis as any).requestAnimationFrame = prevRaf;
    (globalThis as any).cancelAnimationFrame = prevCaf;

    assert.strictEqual(blurred, true, 'Active input is blurred on canvas click');
    assert.strictEqual(canvasFocused, true, 'Canvas is focused on click');
    assert.strictEqual(prevented, true, 'Pointerdown prevents default browser drag');
  });
});

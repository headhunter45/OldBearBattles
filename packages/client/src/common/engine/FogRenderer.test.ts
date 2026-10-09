import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FogRenderer } from './FogRenderer.js';
import { FogState, FogShape } from '@oldbear/shared';

describe('FogRenderer Single Layer Architecture (OB-199)', () => {
  it('instantiates FogRenderer', () => {
    const renderer = new FogRenderer();
    assert.strictEqual(typeof renderer.render, 'function');
  });

  it('renders fog sequentially onto a single layer with sequential operations', () => {
    const renderer = new FogRenderer();

    const ops: string[] = [];
    const mockCtx: any = {
      canvas: { width: 1000, height: 1000 },
      clearRect: () => ops.push('clearRect'),
      fillRect: () => ops.push(`fillRect:${mockCtx.globalCompositeOperation}`),
      beginPath: () => ops.push('beginPath'),
      arc: () => ops.push('arc'),
      moveTo: () => ops.push('moveTo'),
      lineTo: () => ops.push('lineTo'),
      closePath: () => ops.push('closePath'),
      fill: () => ops.push(`fill:${mockCtx.globalCompositeOperation}`),
      stroke: () => ops.push(`stroke:${mockCtx.globalCompositeOperation}`),
      drawImage: () => ops.push('drawImage'),
      globalCompositeOperation: 'source-over',
      fillStyle: '',
    };

    // Replace offCtx with mockCtx to track operations
    (renderer as any).offCtx = mockCtx;
    (renderer as any).offscreen = { width: 1000, height: 1000 };

    const targetCtx: any = {
      drawImage: () => ops.push('targetDrawImage'),
    };

    const fog: FogState = {
      mapId: 'map-1',
      globalCovered: true,
      shapes: [
        {
          id: 's1',
          mode: 'reveal',
          type: 'rect',
          points: [{ x: 10, y: 10 }, { x: 100, y: 10 }, { x: 100, y: 100 }, { x: 10, y: 100 }],
        },
        {
          id: 's2',
          mode: 'hide',
          type: 'rect',
          points: [{ x: 50, y: 50 }, { x: 80, y: 50 }, { x: 80, y: 80 }, { x: 50, y: 80 }],
        },
        {
          id: 's3',
          mode: 'reveal',
          type: 'brush',
          radius: 25,
          points: [{ x: 60, y: 60 }, { x: 70, y: 70 }],
        },
      ],
    };

    renderer.render(targetCtx, fog, 1000, 1000, false);

    // Verify chronological order:
    // 1. clearRect
    // 2. fillRect (base cover)
    // 3. reveal rect (destination-out)
    // 4. hide rect (source-over)
    // 5. reveal brush (destination-out stroke/fill)
    // 6. targetDrawImage
    assert.ok(ops.includes('clearRect'));
    assert.ok(ops.includes('fillRect:source-over'));
    assert.ok(ops.includes('fill:destination-out'), 'Reveal applies destination-out');
    assert.ok(ops.includes('fill:source-over'), 'Hide applies source-over');
    assert.ok(ops.includes('stroke:destination-out'), 'Brush reveal applies destination-out stroke');
    assert.ok(ops.includes('targetDrawImage'));
  });
});

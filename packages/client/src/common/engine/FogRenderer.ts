import { FogState, FogShape } from '@oldbear/shared';

export class FogRenderer {
  private offscreen?: HTMLCanvasElement;
  private offCtx?: CanvasRenderingContext2D;

  constructor() {
    if (typeof document !== 'undefined') {
      this.offscreen = document.createElement('canvas');
      this.offCtx = this.offscreen.getContext('2d')!;
    }
  }

  resize(width: number, height: number) {
    if (this.offscreen && (this.offscreen.width !== width || this.offscreen.height !== height)) {
      this.offscreen.width = Math.max(1, width);
      this.offscreen.height = Math.max(1, height);
    }
  }

  render(
    targetCtx: CanvasRenderingContext2D,
    fog: FogState,
    mapWidth: number,
    mapHeight: number,
    isGm: boolean
  ) {
    this.resize(mapWidth, mapHeight);
    const ctx = this.offCtx;
    if (!ctx) return;

    // Reset offscreen canvas
    ctx.clearRect(0, 0, mapWidth, mapHeight);

    const fogColor = isGm ? 'rgba(8, 12, 22, 0.65)' : 'rgba(8, 12, 22, 1.0)';

    // Single raster layer: start with base coverage if globalCovered is true
    if (fog.globalCovered) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = fogColor;
      ctx.fillRect(0, 0, mapWidth, mapHeight);
    }

    // Sequentially apply each shape in chronological order onto the single raster layer
    for (const shape of fog.shapes) {
      if (shape.mode === 'reveal') {
        ctx.globalCompositeOperation = 'destination-out';
        this.drawShape(ctx, shape);
      } else if (shape.mode === 'hide') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = fogColor;
        this.drawShape(ctx, shape);
      }
    }

    ctx.globalCompositeOperation = 'source-over';

    // Composite offscreen fog canvas to main target
    if (this.offscreen) {
      targetCtx.drawImage(this.offscreen, 0, 0);
    }
  }

  private drawShape(ctx: CanvasRenderingContext2D, shape: FogShape) {
    if (!shape.points || shape.points.length === 0) return;

    if (shape.type === 'brush') {
      const radius = shape.radius || 30;
      if (shape.points.length === 1) {
        ctx.beginPath();
        ctx.arc(shape.points[0].x, shape.points[0].y, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = radius * 2;
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
      }
    } else if (shape.type === 'polygon' || shape.type === 'rect') {
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}

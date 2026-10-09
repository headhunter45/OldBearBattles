import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SubmapEditorDrawer,
  SUBMAP_TYPE_LABELS,
} from './SubmapEditorDrawer.js';
import {
  SUBMAP_BORDER_PRESET_COLORS,
  SUBMAP_BG_PRESET_COLORS,
  SUBMAP_TYPE_DEFAULTS,
} from '../engine/SubmapManager.js';

describe('SubmapEditorDrawer Component & Presets (OB-187)', () => {
  it('exports SubmapEditorDrawer component and type labels', () => {
    assert.strictEqual(typeof SubmapEditorDrawer, 'function');
    assert.strictEqual(SUBMAP_TYPE_LABELS.building_floor, 'Upper/Lower Floor');
    assert.strictEqual(SUBMAP_TYPE_LABELS.deployment_zone, 'Deployment Zone');
    assert.strictEqual(SUBMAP_TYPE_LABELS.casualty_tray, 'Casualty Tray / Graveyard');
    assert.strictEqual(SUBMAP_TYPE_LABELS.staging_area, 'Staging Area (Reserves)');
  });

  it('provides border preset colors including sky, red, emerald, and purple', () => {
    assert.ok(Array.isArray(SUBMAP_BORDER_PRESET_COLORS));
    assert.ok(SUBMAP_BORDER_PRESET_COLORS.includes('#38bdf8')); // Sky
    assert.ok(SUBMAP_BORDER_PRESET_COLORS.includes('#ef4444')); // Red
    assert.ok(SUBMAP_BORDER_PRESET_COLORS.includes('#10b981')); // Emerald
    assert.ok(SUBMAP_BORDER_PRESET_COLORS.includes('#8b5cf6')); // Purple
  });

  it('provides background fill presets including transparent and tint options', () => {
    assert.ok(Array.isArray(SUBMAP_BG_PRESET_COLORS));
    assert.ok(SUBMAP_BG_PRESET_COLORS.includes('transparent'));
    assert.ok(SUBMAP_BG_PRESET_COLORS.includes('#1e293b'));
    assert.ok(SUBMAP_BG_PRESET_COLORS.some((c) => c.includes('rgba(239, 68, 68')));
  });

  it('defines valid defaults for all submap types in SUBMAP_TYPE_DEFAULTS', () => {
    const types = [
      'building_floor',
      'connected_dungeon',
      'deployment_zone',
      'casualty_tray',
      'staging_area',
      'custom',
    ] as const;

    for (const t of types) {
      const def = SUBMAP_TYPE_DEFAULTS[t];
      assert.ok(def, `Missing default config for type ${t}`);
      assert.ok(def.name, `Missing name for type ${t}`);
      assert.ok(def.borderColor, `Missing borderColor for type ${t}`);
      assert.ok(def.bgColor, `Missing bgColor for type ${t}`);
      assert.ok(def.defaultWidth > 0, `defaultWidth must be > 0 for type ${t}`);
      assert.ok(def.defaultHeight > 0, `defaultHeight must be > 0 for type ${t}`);
    }
  });
});

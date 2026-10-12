import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PRESET_TOKENS } from './TokenPickerModal.js';

describe('TokenPickerModal PRESET_TOKENS (OB-195)', () => {
  it('includes presets with calibrated zoom and offsets', () => {
    assert.ok(PRESET_TOKENS.length > 0);

    const knight = PRESET_TOKENS.find((p) => p.name === 'Knight Warrior');
    assert.ok(knight);
    assert.strictEqual(knight?.zoom, 1.35);
    assert.strictEqual(knight?.offsetY, -10);

    const wizard = PRESET_TOKENS.find((p) => p.name === 'Elven Wizard');
    assert.ok(wizard);
    assert.strictEqual(wizard?.zoom, 1.3);
    assert.strictEqual(wizard?.offsetY, -12);

    const dragonMask = PRESET_TOKENS.find((p) => p.name.includes('Dragon Mask'));
    assert.ok(dragonMask);
    assert.strictEqual(dragonMask?.zoom, 1.2);
    assert.strictEqual(dragonMask?.offsetX, 0);
    assert.strictEqual(dragonMask?.offsetY, 0);
  });
});

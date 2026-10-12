import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PRESET_TOKENS } from './TokenPickerModal.js';

describe('Token Image Browser & Existing Image Selection (OB-193)', () => {
  it('exports preset tokens with complete image metadata and URLs', () => {
    assert.ok(PRESET_TOKENS.length > 0, 'PRESET_TOKENS must contain preset tokens');
    for (const preset of PRESET_TOKENS) {
      assert.ok(preset.name, 'Preset token must have a name');
      assert.ok(preset.url, `Preset ${preset.name} must have a url`);
      assert.ok(preset.url.startsWith('https://images.unsplash.com/'), 'Preset URL must point to image source');
    }
  });

  it('contains expected classic presets like Anime Girl and Rudra masks', () => {
    const anime = PRESET_TOKENS.find((p) => p.name === 'Anime Girl');
    assert.ok(anime, 'Anime Girl preset must exist');
    assert.ok(anime.url.includes('vector-1760040811785-401bbbb5c32f'));

    const mask = PRESET_TOKENS.find((p) => p.name.includes('Mask of human face'));
    assert.ok(mask, 'Mask preset must exist');
  });
});

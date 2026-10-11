import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isFeatureEnabled,
  updateActiveFlags,
  setFeatureFlagOverride,
  fetchServerFeatureFlags,
} from './featureFlags.js';

describe('Client Feature Flags Runtime (OB-232)', () => {
  it('reports default feature flag states accurately', () => {
    // By default, chess_clock and brawl_mode are disabled per requirements
    assert.strictEqual(isFeatureEnabled('chess_clock'), false);
    assert.strictEqual(isFeatureEnabled('brawl_mode'), false);

    // Other core capabilities are enabled by default
    assert.strictEqual(isFeatureEnabled('voice_chat'), true);
    assert.strictEqual(isFeatureEnabled('soundboard'), true);
    assert.strictEqual(isFeatureEnabled('dice_roller'), true);
    assert.strictEqual(isFeatureEnabled('scoreboard'), true);
    assert.strictEqual(isFeatureEnabled('objectives'), true);
  });

  it('updates active flags when server sends runtime flags', () => {
    updateActiveFlags({ chess_clock: true, soundboard: false });

    assert.strictEqual(isFeatureEnabled('chess_clock'), true);
    assert.strictEqual(isFeatureEnabled('soundboard'), false);

    // Reset back
    updateActiveFlags({ chess_clock: false, soundboard: true });
    assert.strictEqual(isFeatureEnabled('chess_clock'), false);
    assert.strictEqual(isFeatureEnabled('soundboard'), true);
  });

  it('handles unknown flags with fallback', () => {
    assert.strictEqual(isFeatureEnabled('non_existent_flag', false), false);
    assert.strictEqual(isFeatureEnabled('non_existent_flag', true), true);
  });
});

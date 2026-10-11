import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isFeatureEnabled,
  isCompoundFlagEnabled,
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

  it('evaluates compound flags via isCompoundFlagEnabled and isFeatureEnabled', () => {
    // By default, multiple_floors, connected_dungeons, and brawl_mode are false
    assert.strictEqual(isCompoundFlagEnabled('submaps_and_regions'), false);
    assert.strictEqual(isFeatureEnabled('submaps_and_regions'), false);

    // Turn on a VTT submap flag
    updateActiveFlags({ multiple_floors: true });
    assert.strictEqual(isCompoundFlagEnabled('submaps_and_regions'), true);
    assert.strictEqual(isFeatureEnabled('submaps_and_regions'), true);

    // Reset multiple_floors
    updateActiveFlags({ multiple_floors: false });
    assert.strictEqual(isCompoundFlagEnabled('submaps_and_regions'), false);

    // Brawl submap flag only activates when brawl_mode is also true
    updateActiveFlags({ deployment_zones: true });
    assert.strictEqual(isCompoundFlagEnabled('submaps_and_regions'), false);

    updateActiveFlags({ brawl_mode: true, deployment_zones: true });
    assert.strictEqual(isCompoundFlagEnabled('submaps_and_regions'), true);

    // Reset back
    updateActiveFlags({ brawl_mode: false, deployment_zones: false });
    assert.strictEqual(isCompoundFlagEnabled('submaps_and_regions'), false);
  });
});

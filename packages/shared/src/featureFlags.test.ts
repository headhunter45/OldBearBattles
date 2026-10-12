import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_FEATURE_FLAGS,
  parseFeatureFlagValue,
  normalizeFeatureKey,
  parseFeatureFlags,
  isFeatureFlagActive,
  isCompoundFeatureActive,
  isCompoundFeatureFlag,
} from './featureFlags.js';

describe('System-Wide Feature Flags (OB-232)', () => {
  it('parses boolean, string, and number flag values accurately', () => {
    assert.strictEqual(parseFeatureFlagValue(true), true);
    assert.strictEqual(parseFeatureFlagValue(false), false);
    assert.strictEqual(parseFeatureFlagValue(1), true);
    assert.strictEqual(parseFeatureFlagValue(0), false);
    assert.strictEqual(parseFeatureFlagValue('true'), true);
    assert.strictEqual(parseFeatureFlagValue('True'), true);
    assert.strictEqual(parseFeatureFlagValue('1'), true);
    assert.strictEqual(parseFeatureFlagValue('yes'), true);
    assert.strictEqual(parseFeatureFlagValue('on'), true);
    assert.strictEqual(parseFeatureFlagValue('enabled'), true);

    assert.strictEqual(parseFeatureFlagValue('false'), false);
    assert.strictEqual(parseFeatureFlagValue('False'), false);
    assert.strictEqual(parseFeatureFlagValue('0'), false);
    assert.strictEqual(parseFeatureFlagValue('no'), false);
    assert.strictEqual(parseFeatureFlagValue('off'), false);
    assert.strictEqual(parseFeatureFlagValue('disabled'), false);

    assert.strictEqual(parseFeatureFlagValue(''), undefined);
    assert.strictEqual(parseFeatureFlagValue(null), undefined);
    assert.strictEqual(parseFeatureFlagValue(undefined), undefined);
    assert.strictEqual(parseFeatureFlagValue('invalid'), undefined);
  });

  it('normalizes environment variable keys to snake_case feature flag names', () => {
    assert.strictEqual(normalizeFeatureKey('FEATURE_CHESS_CLOCK'), 'chess_clock');
    assert.strictEqual(normalizeFeatureKey('VITE_FEATURE_CHESS_CLOCK'), 'chess_clock');
    assert.strictEqual(normalizeFeatureKey('VITE_FEATURE_VOICE_CHAT'), 'voice_chat');
    assert.strictEqual(normalizeFeatureKey('FEATURE_voice_chat'), 'voice_chat');
    assert.strictEqual(normalizeFeatureKey('chessClock'), 'chess_clock');
    assert.strictEqual(normalizeFeatureKey('dice-roller'), 'dice_roller');
    assert.strictEqual(normalizeFeatureKey('FEATURE_BRAWL'), 'brawl_mode');
    assert.strictEqual(normalizeFeatureKey('FEATURE_BRAWL_MODE'), 'brawl_mode');
  });

  it('provides default states matching standard platform defaults', () => {
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.chess_clock, false);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.brawl_mode, false);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.voice_chat, true);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.soundboard, true);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.dice_roller, true);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.scoreboard, false);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.objectives, false);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.to_mode, true);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.dndbeyond, false);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.pathbuilder, false);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.army_roster, false);
    assert.strictEqual(DEFAULT_FEATURE_FLAGS.fog_of_war, true);
  });

  it('parses feature flags from environment dictionary with FEATURE_ prefix', () => {
    const env = {
      FEATURE_CHESS_CLOCK: 'true',
      FEATURE_SOUNDBOARD: 'false',
      VITE_FEATURE_VOICE_CHAT: '0',
      FEATURE_CUSTOM_EXPERIMENT: '1',
    };

    const flags = parseFeatureFlags(env);
    assert.strictEqual(flags.chess_clock, true);
    assert.strictEqual(flags.soundboard, false);
    assert.strictEqual(flags.voice_chat, false);
    assert.strictEqual(flags.custom_experiment, true);
    // Unspecified default retains its default
    assert.strictEqual(flags.dice_roller, true);
  });

  it('correctly reports isFeatureFlagActive with fallback support', () => {
    const flags = {
      chess_clock: true,
      soundboard: false,
    };

    assert.strictEqual(isFeatureFlagActive(flags, 'chess_clock'), true);
    assert.strictEqual(isFeatureFlagActive(flags, 'FEATURE_CHESS_CLOCK'), true);
    assert.strictEqual(isFeatureFlagActive(flags, 'soundboard'), false);
    assert.strictEqual(isFeatureFlagActive(flags, 'unknown_feature', false), false);
    assert.strictEqual(isFeatureFlagActive(flags, 'unknown_feature', true), true);
  });

  describe('Compound Feature Flags', () => {
    it('defaults compound flags to false when flags object is empty or dependent flags missing', () => {
      assert.strictEqual(isCompoundFeatureFlag('submaps_and_regions'), true);
      assert.strictEqual(isCompoundFeatureFlag('brawl_mode'), false);

      assert.strictEqual(isCompoundFeatureActive({}, 'submaps_and_regions'), false);
      assert.strictEqual(isFeatureFlagActive({}, 'submaps_and_regions'), false);
    });

    it('evaluates submaps_and_regions to true when multiple_floors or connected_dungeons is true', () => {
      assert.strictEqual(
        isCompoundFeatureActive({ multiple_floors: true }, 'submaps_and_regions'),
        true,
      );
      assert.strictEqual(
        isCompoundFeatureActive({ connected_dungeons: true }, 'submaps_and_regions'),
        true,
      );
      assert.strictEqual(
        isCompoundFeatureActive({ multiple_floors: false, connected_dungeons: false }, 'submaps_and_regions'),
        false,
      );
    });

    it('evaluates brawl submap dependencies only when brawl_mode is active', () => {
      // deployment_zones true without brawl_mode -> false
      assert.strictEqual(
        isCompoundFeatureActive({ brawl_mode: false, deployment_zones: true }, 'submaps_and_regions'),
        false,
      );
      // deployment_zones true with brawl_mode -> true
      assert.strictEqual(
        isCompoundFeatureActive({ brawl_mode: true, deployment_zones: true }, 'submaps_and_regions'),
        true,
      );
      assert.strictEqual(
        isCompoundFeatureActive({ brawl_mode: true, casualty_tray: true }, 'submaps_and_regions'),
        true,
      );
      assert.strictEqual(
        isCompoundFeatureActive({ brawl_mode: true, staging_area: true }, 'submaps_and_regions'),
        true,
      );
    });

    it('does not allow setting compound flags via environment variables', () => {
      const env = {
        FEATURE_SUBMAPS_AND_REGIONS: 'true',
        VITE_FEATURE_SUBMAPS_AND_REGIONS: 'true',
      };
      const parsed = parseFeatureFlags(env);
      assert.strictEqual(parsed.submaps_and_regions, undefined);
      // isCompoundFeatureActive still evaluates to false because dependencies are not set
      assert.strictEqual(isCompoundFeatureActive(parsed, 'submaps_and_regions'), false);
      assert.strictEqual(isFeatureFlagActive(parsed, 'submaps_and_regions'), false);
    });
  });
});

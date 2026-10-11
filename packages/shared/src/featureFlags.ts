/**
 * System-Wide Feature Flags (OB-232)
 *
 * Provides a unified feature flag schema, environment variable parsing,
 * and default states for enabling/disabling individual platform capabilities.
 */

export type KnownFeatureFlag =
  | 'chess_clock'
  | 'voice_chat'
  | 'soundboard'
  | 'dice_roller'
  | 'scoreboard'
  | 'objectives'
  | 'to_mode'
  | 'dndbeyond'
  | 'pathbuilder'
  | 'army_roster'
  | 'fog_of_war';

export type FeatureFlagKey = KnownFeatureFlag | (string & {});

/**
 * Standard platform defaults for known feature flags.
 * Features can be individually toggled via FEATURE_<FLAG_NAME>=true|false
 * or VITE_FEATURE_<FLAG_NAME>=true|false.
 */
export const DEFAULT_FEATURE_FLAGS: Record<KnownFeatureFlag, boolean> = {
  chess_clock: false, // Chess clock disabled by default per user request
  voice_chat: true,
  soundboard: true,
  dice_roller: true,
  scoreboard: true,
  objectives: true,
  to_mode: true,
  dndbeyond: true,
  pathbuilder: true,
  army_roster: true,
  fog_of_war: true,
};

/**
 * Parses a string/boolean value into a boolean flag.
 * Returns undefined if unparseable or empty.
 */
export function parseFeatureFlagValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on', 'enabled'].includes(trimmed)) return true;
  if (['false', '0', 'no', 'off', 'disabled'].includes(trimmed)) return false;
  return undefined;
}

/**
 * Normalizes an environment variable key or feature key to snake_case.
 * E.g., 'FEATURE_CHESS_CLOCK' -> 'chess_clock'
 *       'VITE_FEATURE_VOICE_CHAT' -> 'voice_chat'
 *       'chessClock' -> 'chess_clock'
 */
export function normalizeFeatureKey(rawKey: string): string {
  let key = rawKey.trim();
  if (key.startsWith('VITE_')) {
    key = key.substring(5);
  }
  if (key.startsWith('FEATURE_')) {
    key = key.substring(8);
  }
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Parses all feature flags from an environment dictionary (such as process.env
 * or import.meta.env).
 *
 * Automatically inspects:
 * 1. Known flags with prefixes: FEATURE_<FLAG> and VITE_FEATURE_<FLAG>
 * 2. Any generic FEATURE_* / VITE_FEATURE_* keys in the env object.
 */
export function parseFeatureFlags(
  env: Record<string, string | boolean | undefined> = {},
  defaults: Record<string, boolean> = DEFAULT_FEATURE_FLAGS
): Record<string, boolean> {
  const flags: Record<string, boolean> = { ...defaults };

  // First pass: scan all keys in env for FEATURE_ or VITE_FEATURE_ prefixes
  for (const [rawKey, rawVal] of Object.entries(env)) {
    if (rawVal === undefined || rawVal === '') continue;

    const upper = rawKey.toUpperCase();
    if (upper.startsWith('FEATURE_') || upper.startsWith('VITE_FEATURE_')) {
      const normalized = normalizeFeatureKey(rawKey);
      const parsed = parseFeatureFlagValue(rawVal);
      if (parsed !== undefined) {
        flags[normalized] = parsed;
      }
    }
  }

  // Second pass: explicit check for all known flags in case env was passed with direct keys
  for (const knownKey of Object.keys(defaults)) {
    const directVal = env[knownKey];
    if (directVal !== undefined && directVal !== '') {
      const parsed = parseFeatureFlagValue(directVal);
      if (parsed !== undefined) {
        flags[knownKey] = parsed;
      }
    }
  }

  return flags;
}

/**
 * Check if a specific feature flag is enabled in the flags object.
 */
export function isFeatureFlagActive(
  flags: Record<string, boolean>,
  flag: string,
  fallback = false
): boolean {
  const normalized = normalizeFeatureKey(flag);
  if (normalized in flags) {
    return flags[normalized];
  }
  return fallback;
}

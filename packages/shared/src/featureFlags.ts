/**
 * System-Wide Feature Flags (OB-232)
 *
 * Provides a unified feature flag schema, environment variable parsing,
 * and default states for enabling/disabling individual platform capabilities.
 */

export type KnownFeatureFlag =
  | 'army_roster'
  | 'brawl_mode'
  | 'casualty_tray'
  | 'chess_clock'
  | 'connected_dungeons'
  | 'default_brawl_tokens'
  | 'default_map_tiles'
  | 'default_vtt_tokens'
  | 'deployment_zones'
  | 'dice_roller'
  | 'dndbeyond'
  | 'fog_of_war'
  | 'multiple_floors'
  | 'objectives'
  | 'pathbuilder'
  | 'scoreboard'
  | 'search_open5e'
  | 'search_pf2e'
  | 'soundboard'
  | 'staging_area'
  | 'sync_dndbeyond'
  | 'to_mode'
  | 'voice_chat';

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
  brawl_mode: false,
  multiple_floors: false,
  connected_dungeons: false,
  deployment_zones: false,
  casualty_tray: false,
  staging_area: false,
  default_vtt_tokens: false,
  default_brawl_tokens: false,
  default_map_tiles: false,
  search_open5e: false,
  search_pf2e: false,
  sync_dndbeyond: false,
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
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
  if (normalized === 'brawl') return 'brawl_mode';
  return normalized;
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
  defaults: Record<string, boolean> = DEFAULT_FEATURE_FLAGS,
): Record<string, boolean> {
  const flags: Record<string, boolean> = { ...defaults };

  // First pass: scan all keys in env for FEATURE_ or VITE_FEATURE_ prefixes
  for (const [rawKey, rawVal] of Object.entries(env)) {
    if (rawVal === undefined || rawVal === '') continue;

    const upper = rawKey.toUpperCase();
    if (upper.startsWith('FEATURE_') || upper.startsWith('VITE_FEATURE_')) {
      const normalized = normalizeFeatureKey(rawKey);
      // Compound flags cannot be set directly via environment variables
      if (isCompoundFeatureFlag(normalized)) continue;

      const parsed = parseFeatureFlagValue(rawVal);
      if (parsed !== undefined) {
        flags[normalized] = parsed;
      }
    }
  }

  // Second pass: explicit check for all known flags in case env was passed with direct keys
  for (const knownKey of Object.keys(defaults)) {
    // Compound flags cannot be set directly via environment variables
    if (isCompoundFeatureFlag(knownKey)) continue;

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
 * Union of all compound (derived) feature flags.
 * Compound flags are computed from primitive flags and cannot be set directly via env.
 */
export type CompoundFeatureFlag = 'submaps_and_regions';

/**
 * Registry of compound feature flag evaluators.
 * If dependent flags do not exist in the active flags object, they default to false.
 */
export const COMPOUND_FEATURE_FLAGS: Record<
  CompoundFeatureFlag,
  (flags: Record<string, boolean>) => boolean
> = {
  submaps_and_regions: (flags: Record<string, boolean>) =>
    Boolean(
      flags['multiple_floors'] ||
      flags['connected_dungeons'] ||
      (flags['brawl_mode'] &&
        (flags['deployment_zones'] ||
          flags['casualty_tray'] ||
          flags['staging_area']))
    ),
};

/**
 * Type guard to check if a flag key corresponds to a compound feature flag.
 */
export function isCompoundFeatureFlag(
  flag: string,
): flag is CompoundFeatureFlag {
  const normalized = normalizeFeatureKey(flag);
  return Object.prototype.hasOwnProperty.call(COMPOUND_FEATURE_FLAGS, normalized);
}

/**
 * Evaluates a compound (derived) feature flag against an active flags map.
 * Compound flags cannot be set directly by environment variables; they are
 * dynamically calculated based on the state of their dependent flags.
 * If any dependent flags are missing or undefined, they are treated as false.
 */
export function isCompoundFeatureActive(
  flags: Record<string, boolean>,
  flag: CompoundFeatureFlag,
  fallback = false,
): boolean {
  const normalized = normalizeFeatureKey(flag) as CompoundFeatureFlag;
  const evaluator = COMPOUND_FEATURE_FLAGS[normalized];
  if (evaluator) {
    return evaluator(flags);
  }
  return fallback;
}

/**
 * Check if a specific feature flag (primitive or compound) is enabled in the flags object.
 */
export function isFeatureFlagActive(
  flags: Record<string, boolean>,
  flag: string,
  fallback = false,
): boolean {
  const normalized = normalizeFeatureKey(flag);
  if (isCompoundFeatureFlag(normalized)) {
    return isCompoundFeatureActive(flags, normalized, fallback);
  }
  if (normalized in flags) {
    return flags[normalized];
  }
  return fallback;
}

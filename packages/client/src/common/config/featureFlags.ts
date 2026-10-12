/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import {
  DEFAULT_FEATURE_FLAGS,
  parseFeatureFlags,
  parseFeatureFlagValue,
  normalizeFeatureKey,
  FeatureFlagKey,
  CompoundFeatureFlag,
  isCompoundFeatureFlag,
  isCompoundFeatureActive,
} from '@oldbear/shared';

export type { CompoundFeatureFlag } from '@oldbear/shared';

// Active in-memory feature flags store
let currentFlags: Record<string, boolean> = { ...DEFAULT_FEATURE_FLAGS };
const listeners = new Set<() => void>();
let fetchInitiated = false;

/**
 * Extracts environment dictionary safely from import.meta.env or process.env
 */
function getEnvironmentDict(): Record<string, string | boolean | undefined> {
  const env: Record<string, string | boolean | undefined> = {};

  if (typeof process !== 'undefined' && process.env) {
    Object.assign(env, process.env);
  }

  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    Object.assign(env, (import.meta as any).env);
  }

  return env;
}

/**
 * Checks for query parameter overrides:
 * E.g., ?feature:chess_clock=true or ?enable_feature=chess_clock or ?disable_feature=soundboard
 */
function getUrlOverrides(): Record<string, boolean> {
  const overrides: Record<string, boolean> = {};
  if (typeof window === 'undefined' || !window.location || !window.location.search) {
    return overrides;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of params.entries()) {
      if (key.startsWith('feature:')) {
        const flag = normalizeFeatureKey(key.slice('feature:'.length));
        if (isCompoundFeatureFlag(flag)) continue;
        const parsed = parseFeatureFlagValue(value);
        if (parsed !== undefined) overrides[flag] = parsed;
      } else if (key === 'enable_feature') {
        const flag = normalizeFeatureKey(value);
        if (isCompoundFeatureFlag(flag)) continue;
        overrides[flag] = true;
      } else if (key === 'disable_feature') {
        const flag = normalizeFeatureKey(value);
        if (isCompoundFeatureFlag(flag)) continue;
        overrides[flag] = false;
      }
    }
  } catch (e) {
    console.warn('[FeatureFlags] Error parsing URL flag overrides:', e);
  }

  return overrides;
}

/**
 * Checks for local storage / session storage overrides
 */
function getStorageOverrides(): Record<string, boolean> {
  const overrides: Record<string, boolean> = {};
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return overrides;
  }

  try {
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith('oldbear_feature_override_')) {
        const flag = normalizeFeatureKey(key.slice('oldbear_feature_override_'.length));
        if (isCompoundFeatureFlag(flag)) continue;
        const val = window.sessionStorage.getItem(key);
        const parsed = parseFeatureFlagValue(val);
        if (parsed !== undefined) overrides[flag] = parsed;
      }
    }
  } catch (e) {
    console.warn('[FeatureFlags] Error reading storage overrides:', e);
  }

  return overrides;
}

/**
 * Recomputes active flags by layering:
 * 1. Default flags
 * 2. Build-time / Dev env vars (import.meta.env / process.env)
 * 3. Server-provided runtime flags (if loaded)
 * 4. Local storage overrides
 * 5. URL query overrides
 */
let serverFlags: Record<string, boolean> = {};

export function updateActiveFlags(newServerFlags?: Record<string, boolean>): void {
  if (newServerFlags) {
    serverFlags = { ...serverFlags, ...newServerFlags };
  }

  const envDict = getEnvironmentDict();
  const envFlags = parseFeatureFlags(envDict, DEFAULT_FEATURE_FLAGS);

  currentFlags = {
    ...envFlags,
    ...serverFlags,
    ...getStorageOverrides(),
    ...getUrlOverrides(),
  };

  listeners.forEach((listener) => listener());
}

// Initial synchronous computation
updateActiveFlags();

/**
 * Asynchronously fetches runtime feature flags from backend server /api/features.
 * This allows flags configured in server environment variables or docker-compose
 * to take effect immediately in production without rebuilding the client bundle.
 */
export async function fetchServerFeatureFlags(): Promise<Record<string, boolean>> {
  if (typeof fetch === 'undefined') return currentFlags;

  try {
    const res = await fetch('/api/features', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.features === 'object') {
        updateActiveFlags(data.features);
        return currentFlags;
      }
    }
  } catch {
    // Server might be unreachable (offline mode, standalone P2P), silently fall back
  }

  return currentFlags;
}

/**
 * Check synchronously if a compound (derived) feature flag is currently active.
 * Strictly typed to Known CompoundFeatureFlag keys.
 */
export function isCompoundFlagEnabled(
  flag: CompoundFeatureFlag,
  fallback = false,
): boolean {
  return isCompoundFeatureActive(currentFlags, flag, fallback);
}

/**
 * Check synchronously if a feature flag is currently active.
 * Transparently supports primitive FeatureFlagKey and CompoundFeatureFlag.
 */
export function isFeatureEnabled(
  flag: FeatureFlagKey | CompoundFeatureFlag,
  fallback = false,
): boolean {
  const normalized = normalizeFeatureKey(flag);
  if (isCompoundFeatureFlag(normalized)) {
    return isCompoundFlagEnabled(normalized, fallback);
  }
  if (normalized in currentFlags) {
    return currentFlags[normalized];
  }
  return fallback;
}

/**
 * Set an override for a feature flag (useful for testing or debugging in the browser).
 * Pass value = null to clear override. Compound flags cannot be overridden directly.
 */
export function setFeatureFlagOverride(
  flag: FeatureFlagKey,
  value: boolean | null,
): void {
  const normalized = normalizeFeatureKey(flag);
  if (isCompoundFeatureFlag(normalized)) {
    console.warn(
      `[FeatureFlags] Cannot override compound flag "${flag}" directly. Toggle its underlying dependent flags instead.`,
    );
    return;
  }
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const key = `oldbear_feature_override_${normalized}`;
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, String(value));
    }
  }
  updateActiveFlags();
}

/**
 * React hook to observe a single feature flag and reactively update if toggled.
 */
export function useFeatureFlag(flag: FeatureFlagKey, fallback = false): boolean {
  const normalized = normalizeFeatureKey(flag);
  const [enabled, setEnabled] = useState<boolean>(() => isFeatureEnabled(normalized, fallback));

  useEffect(() => {
    const handleChange = () => {
      setEnabled(isFeatureEnabled(normalized, fallback));
    };

    listeners.add(handleChange);
    // Ensure accurate value in case it changed between init and effect
    handleChange();

    return () => {
      listeners.delete(handleChange);
    };
  }, [normalized, fallback]);

  return enabled;
}

/**
 * React hook to observe a compound feature flag and reactively update if any
 * of its underlying dependent feature flags change.
 */
export function useCompoundFeatureFlag(
  flag: CompoundFeatureFlag,
  fallback = false,
): boolean {
  const [enabled, setEnabled] = useState<boolean>(() =>
    isCompoundFlagEnabled(flag, fallback),
  );

  useEffect(() => {
    const handleChange = () => {
      setEnabled(isCompoundFlagEnabled(flag, fallback));
    };

    listeners.add(handleChange);
    handleChange();

    return () => {
      listeners.delete(handleChange);
    };
  }, [flag, fallback]);

  return enabled;
}

/**
 * React hook to observe all feature flags.
 */
export function useFeatureFlags(): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => ({ ...currentFlags }));

  useEffect(() => {
    const handleChange = () => {
      setFlags({ ...currentFlags });
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return flags;
}

// Auto-fetch server flags once on client boot
if (typeof window !== 'undefined' && !fetchInitiated) {
  fetchInitiated = true;
  fetchServerFeatureFlags();

  // Expose helper on window for debugging & testing
  (window as any).__oldbear_features = {
    get: isFeatureEnabled,
    getAll: () => ({ ...currentFlags }),
    set: setFeatureFlagOverride,
    reset: () => {
      if (window.sessionStorage) {
        for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
          const key = window.sessionStorage.key(i);
          if (key && key.startsWith('oldbear_feature_override_')) {
            window.sessionStorage.removeItem(key);
          }
        }
      }
      updateActiveFlags();
    },
    reload: fetchServerFeatureFlags,
  };
}

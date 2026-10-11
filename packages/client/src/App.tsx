import React, { useMemo, useEffect } from 'react';
import { AppVtt } from './vtt/AppVtt.js';
import { AppBrawl } from './brawl/AppBrawl.js';
import { isFeatureEnabled, useFeatureFlag } from './common/config/featureFlags.js';

export type GameMode = 'vtt' | 'brawl';

export interface GameModeConfig {
  allowedModes: GameMode[];
  defaultMode: GameMode;
  isSingleMode: boolean;
}

export function parseAllowedModes(
  envAllowed?: string,
  envSingle?: string,
  brawlModeEnabled?: boolean
): GameModeConfig {
  const isBrawlActive = brawlModeEnabled !== undefined
    ? brawlModeEnabled
    : isFeatureEnabled('brawl_mode');

  // If brawl_mode is disabled, brawl mode is strictly unavailable and only vtt is allowed
  if (!isBrawlActive) {
    return {
      allowedModes: ['vtt'],
      defaultMode: 'vtt',
      isSingleMode: true,
    };
  }

  const single = envSingle?.toLowerCase().trim();
  if (single === 'brawl' || single === 'vtt') {
    return {
      allowedModes: [single],
      defaultMode: single,
      isSingleMode: true,
    };
  }

  const raw = envAllowed?.toLowerCase().trim();
  if (raw) {
    const list = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s === 'vtt' || s === 'brawl') as GameMode[];
    if (list.length > 0) {
      return {
        allowedModes: list,
        defaultMode: list[0],
        isSingleMode: list.length === 1,
      };
    }
  }

  return {
    allowedModes: ['vtt', 'brawl'],
    defaultMode: 'vtt',
    isSingleMode: false,
  };
}

export function detectGameMode(
  searchString?: string,
  storedMode?: string | null,
  envMode?: string,
  envAllowedModes?: string,
  brawlModeEnabled?: boolean
): GameMode {
  const isBrawlActive = brawlModeEnabled !== undefined
    ? brawlModeEnabled
    : isFeatureEnabled('brawl_mode');

  const resolvedEnvMode = envMode !== undefined
    ? envMode
    : (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAME_MODE || import.meta.env?.GAME_MODE) : undefined);

  const resolvedEnvAllowed = envAllowedModes !== undefined
    ? envAllowedModes
    : (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAME_MODES || import.meta.env?.GAME_MODES) : undefined);

  const config = parseAllowedModes(resolvedEnvAllowed, resolvedEnvMode, isBrawlActive);

  // If brawl mode is disabled, reset any persisted brawl preference to vtt and return vtt
  if (!isBrawlActive) {
    if (typeof localStorage !== 'undefined' && storedMode === undefined) {
      try {
        if (localStorage.getItem('oldbear_mode') === 'brawl') {
          localStorage.setItem('oldbear_mode', 'vtt');
        }
      } catch {}
    }
    return 'vtt';
  }

  if (config.isSingleMode) {
    return config.defaultMode;
  }

  let requestedMode: string | null = null;
  if (searchString !== undefined) {
    const params = new URLSearchParams(searchString);
    requestedMode = params.get('mode') || params.get('gamemode');
  } else if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    requestedMode = params.get('mode') || params.get('gamemode');
  }

  if (requestedMode === 'brawl' && config.allowedModes.includes('brawl')) {
    if (typeof localStorage !== 'undefined' && storedMode === undefined) {
      try {
        localStorage.setItem('oldbear_mode', 'brawl');
      } catch {}
    }
    return 'brawl';
  }
  if (requestedMode === 'vtt' && config.allowedModes.includes('vtt')) {
    if (typeof localStorage !== 'undefined' && storedMode === undefined) {
      try {
        localStorage.setItem('oldbear_mode', 'vtt');
      } catch {}
    }
    return 'vtt';
  }

  const stored = storedMode !== undefined
    ? storedMode
    : (typeof window !== 'undefined' && typeof localStorage !== 'undefined' ? localStorage.getItem('oldbear_mode') : null);
  if (stored === 'brawl' && config.allowedModes.includes('brawl')) return 'brawl';
  if (stored === 'vtt' && config.allowedModes.includes('vtt')) return 'vtt';

  return config.defaultMode;
}

export function switchGameMode(targetMode: GameMode): void {
  if (typeof window !== 'undefined') {
    let modeToSet: GameMode = targetMode;
    // When brawl_mode is false, attempts to switch to brawl must set vtt instead
    if (modeToSet === 'brawl' && !isFeatureEnabled('brawl_mode')) {
      modeToSet = 'vtt';
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('oldbear_mode', modeToSet);
      } catch {}
    }
    const url = new URL(window.location.href);
    url.searchParams.set('mode', modeToSet);
    window.location.href = url.toString();
  }
}

export function isSingleGameModeEnforced(
  envMode?: string,
  envAllowedModes?: string,
  brawlModeEnabled?: boolean
): boolean {
  const isBrawlActive = brawlModeEnabled !== undefined
    ? brawlModeEnabled
    : isFeatureEnabled('brawl_mode');

  if (!isBrawlActive) {
    return true;
  }

  const resolvedEnvMode = envMode !== undefined
    ? envMode
    : (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAME_MODE || import.meta.env?.GAME_MODE) : undefined);

  const resolvedEnvAllowed = envAllowedModes !== undefined
    ? envAllowedModes
    : (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GAME_MODES || import.meta.env?.GAME_MODES) : undefined);

  return parseAllowedModes(resolvedEnvAllowed, resolvedEnvMode, isBrawlActive).isSingleMode;
}

export const App: React.FC = () => {
  const isBrawlEnabled = useFeatureFlag('brawl_mode');
  const mode = useMemo(() => {
    const detected = detectGameMode(undefined, undefined, undefined, undefined, isBrawlEnabled);
    if (detected === 'brawl' && !isBrawlEnabled) {
      return 'vtt';
    }
    return detected;
  }, [isBrawlEnabled]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('oldbear_mode', mode);
      } catch {}
    }
  }, [mode]);

  // Cleanse URL query if brawl was requested while brawl mode is disabled
  useEffect(() => {
    if (!isBrawlEnabled && typeof window !== 'undefined' && window.location) {
      try {
        const params = new URLSearchParams(window.location.search);
        let modified = false;
        if (params.get('mode') === 'brawl') {
          params.set('mode', 'vtt');
          modified = true;
        }
        if (params.get('gamemode') === 'brawl') {
          params.set('gamemode', 'vtt');
          modified = true;
        }
        if (params.has('brawl')) {
          params.delete('brawl');
          params.set('mode', 'vtt');
          modified = true;
        }
        if (modified) {
          const newSearch = params.toString();
          const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`;
          window.history.replaceState(null, '', newUrl);
        }
      } catch {}
    }
  }, [isBrawlEnabled]);

  if (mode === 'brawl' && isBrawlEnabled) {
    return <AppBrawl />;
  }

  return <AppVtt />;
};



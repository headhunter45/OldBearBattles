import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  detectGameMode,
  parseAllowedModes,
  switchGameMode,
  isSingleGameModeEnforced,
} from './App.js';
import { updateActiveFlags } from './common/config/featureFlags.js';

describe('Application Game Mode Dispatcher & Brawl Mode Feature Flag', () => {
  describe('When brawl_mode feature flag is false (default)', () => {
    it('strictly forces vtt mode when ?mode=brawl URL query is requested', () => {
      updateActiveFlags({ brawl_mode: false });
      const mode = detectGameMode('?mode=brawl');
      assert.strictEqual(mode, 'vtt');
    });

    it('strictly forces vtt mode when ?gamemode=brawl URL query is requested', () => {
      updateActiveFlags({ brawl_mode: false });
      const mode = detectGameMode('?gamemode=brawl');
      assert.strictEqual(mode, 'vtt');
    });

    it('forces vtt mode when storedMode in localStorage is brawl', () => {
      updateActiveFlags({ brawl_mode: false });
      const mode = detectGameMode('', 'brawl');
      assert.strictEqual(mode, 'vtt');
    });

    it('forces vtt mode even if GAME_MODE=brawl is configured in environment', () => {
      updateActiveFlags({ brawl_mode: false });
      const mode = detectGameMode('', null, 'brawl');
      assert.strictEqual(mode, 'vtt');
    });

    it('treats system as single-mode vtt enforcement when brawl_mode is false', () => {
      updateActiveFlags({ brawl_mode: false });
      assert.strictEqual(isSingleGameModeEnforced(undefined, 'vtt,brawl'), true);
      const config = parseAllowedModes('vtt,brawl');
      assert.deepStrictEqual(config.allowedModes, ['vtt']);
      assert.strictEqual(config.isSingleMode, true);
    });

    it('redirects switchGameMode to vtt when target is brawl and brawl_mode is false', () => {
      updateActiveFlags({ brawl_mode: false });
      const storage: Record<string, string> = {};
      const originalLocalStorage = globalThis.localStorage;
      const originalWindow = globalThis.window;

      (globalThis as any).localStorage = {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => { storage[k] = v; },
        removeItem: (k: string) => { delete storage[k]; },
      };

      let assignedUrl = '';
      (globalThis as any).window = {
        location: {
          href: 'http://localhost:3000/?mode=brawl',
        },
      };
      Object.defineProperty((globalThis as any).window.location, 'href', {
        get: () => assignedUrl || 'http://localhost:3000/?mode=brawl',
        set: (v: string) => { assignedUrl = v; },
      });

      try {
        switchGameMode('brawl');
        assert.strictEqual(storage['oldbear_mode'], 'vtt');
        assert.ok(assignedUrl.includes('mode=vtt'));
      } finally {
        (globalThis as any).localStorage = originalLocalStorage;
        (globalThis as any).window = originalWindow;
      }
    });
  });

  describe('When brawl_mode feature flag is true (OB-136, OB-154)', () => {
    it('detects brawl mode from ?mode=brawl URL query when enabled', () => {
      updateActiveFlags({ brawl_mode: true });
      const mode = detectGameMode('?mode=brawl');
      assert.strictEqual(mode, 'brawl');
    });

    it('detects brawl mode from ?gamemode=brawl URL query when enabled', () => {
      updateActiveFlags({ brawl_mode: true });
      const mode = detectGameMode('?gamemode=brawl');
      assert.strictEqual(mode, 'brawl');
    });

    it('detects vtt mode explicitly from ?mode=vtt URL query', () => {
      updateActiveFlags({ brawl_mode: true });
      const mode = detectGameMode('?mode=vtt');
      assert.strictEqual(mode, 'vtt');
    });

    it('falls back to localStorage preference if no URL parameter is provided', () => {
      updateActiveFlags({ brawl_mode: true });
      const brawlMode = detectGameMode('', 'brawl');
      assert.strictEqual(brawlMode, 'brawl');

      const vttMode = detectGameMode('', 'vtt');
      assert.strictEqual(vttMode, 'vtt');
    });

    it('falls back to VITE_GAME_MODE environment variable', () => {
      updateActiveFlags({ brawl_mode: true });
      const mode = detectGameMode('', null, 'brawl');
      assert.strictEqual(mode, 'brawl');
    });

    it('defaults to vtt mode when no parameters or preferences are found', () => {
      updateActiveFlags({ brawl_mode: true });
      const mode = detectGameMode('', null, undefined);
      assert.strictEqual(mode, 'vtt');
    });

    it('strictly enforces single-mode brawl when GAME_MODE=brawl regardless of URL query', () => {
      updateActiveFlags({ brawl_mode: true });
      const mode = detectGameMode('?mode=vtt', 'vtt', 'brawl');
      assert.strictEqual(mode, 'brawl');
    });

    it('strictly enforces single-mode vtt when GAME_MODE=vtt regardless of URL query', () => {
      updateActiveFlags({ brawl_mode: true });
      const mode = detectGameMode('?mode=brawl', 'brawl', 'vtt');
      assert.strictEqual(mode, 'vtt');
    });

    it('supports comma-separated GAME_MODES=vtt,brawl multi-mode deployment', () => {
      updateActiveFlags({ brawl_mode: true });
      const brawlMode = detectGameMode('?mode=brawl', null, undefined, 'vtt,brawl');
      assert.strictEqual(brawlMode, 'brawl');

      const vttMode = detectGameMode('?mode=vtt', null, undefined, 'vtt,brawl');
      assert.strictEqual(vttMode, 'vtt');
    });

    it('rejects disallowed modes when GAME_MODES restricts available modes', () => {
      updateActiveFlags({ brawl_mode: true });
      const mode = detectGameMode('?mode=vtt', null, undefined, 'brawl');
      assert.strictEqual(mode, 'brawl');
    });

    it('persists mode to localStorage when explicitly requested via URL query (OB-197)', () => {
      updateActiveFlags({ brawl_mode: true });
      const storage: Record<string, string> = { oldbear_mode: 'brawl' };
      const originalLocalStorage = globalThis.localStorage;
      (globalThis as any).localStorage = {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => { storage[k] = v; },
        removeItem: (k: string) => { delete storage[k]; },
      };

      try {
        const mode = detectGameMode('?mode=vtt');
        assert.strictEqual(mode, 'vtt');
        assert.strictEqual(storage['oldbear_mode'], 'vtt');

        // Subsequent call without URL query now resolves to persisted 'vtt'
        const nextMode = detectGameMode('', storage['oldbear_mode']);
        assert.strictEqual(nextMode, 'vtt');
      } finally {
        (globalThis as any).localStorage = originalLocalStorage;
        updateActiveFlags({ brawl_mode: false });
      }
    });
  });
});


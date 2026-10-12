import crypto from 'node:crypto';
import { GameSession, GameMap, Token, FogState, parseFeatureFlags, isFeatureFlagActive } from '@oldbear/shared';
import {
  saveSessionToDb,
  loadSessionFromDb,
  loadAllSessionsFromDb,
  deleteSessionFromDb,
  isDbConnected,
} from './db.js';

// In-memory store for sessions (high-speed cache for real-time WebSocket sync)
const sessions = new Map<string, { session: GameSession; gmKey: string }>();

// Debounce timer map for database updates
const dbSyncTimers = new Map<string, NodeJS.Timeout>();

function scheduleDbSync(id: string, delayMs = 500) {
  if (!isDbConnected()) return;
  const existingTimer = dbSyncTimers.get(id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  const timer = setTimeout(() => {
    dbSyncTimers.delete(id);
    const entry = sessions.get(id);
    if (entry) {
      saveSessionToDb(entry.session, entry.gmKey);
    }
  }, delayMs);
  dbSyncTimers.set(id, timer);
}

// Simple readable room slug generator (e.g., owl-bear-42)
const ADJECTIVES = ['daring', 'brave', 'mystic', 'ancient', 'wild', 'shadow', 'golden', 'frost', 'ember', 'arcane'];
const NOUNS = ['owlbear', 'dragon', 'beholder', 'griffin', 'goblin', 'ranger', 'wizard', 'dungeon', 'cavern', 'tavern'];

export function generateRoomId(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${adj}-${noun}-${num}`;
}

export function createDefaultVttMap(mapId = 'map-default'): GameMap {
  return {
    id: mapId,
    name: 'Ancient Stone Ruins',
    imageUrl: '', // Blank or SVG background
    gridSize: 50,
    gridType: 'square',
    gridColor: 'rgba(255, 255, 255, 0.25)',
    gridOpacity: 0.25,
    width: 2000,
    height: 1500,
    scaleFtPerCell: 5,
  };
}

export function createDefaultBrawlMap(mapId = 'map-default'): GameMap {
  return {
    id: mapId,
    name: 'Tactical Battlefield',
    imageUrl: '',
    gridSize: 50,
    gridType: 'square',
    gridColor: 'rgba(255, 255, 255, 0.25)',
    gridOpacity: 0.25,
    width: 2200,
    height: 1500,
    scaleFtPerCell: 1, // 1 inch per grid square
    showGrid: true,
  };
}

export function createDefaultMap(mapId = 'map-default', mode: 'vtt' | 'brawl' = 'vtt'): GameMap {
  return mode === 'brawl' ? createDefaultBrawlMap(mapId) : createDefaultVttMap(mapId);
}

export function createDefaultVttTokens(mapId: string): Record<string, Token> {
  const t1Id = 'token-fighter';
  const t2Id = 'token-goblin';

  return {
    [t1Id]: {
      id: t1Id,
      mapId,
      name: 'Valeros the Fighter',
      imageUrl: '',
      x: 350,
      y: 350,
      size: 1,
      rotation: 0,
      ringColor: '#3b82f6', // blue ring
      fillColor: '#1e3a8a',
      clipCircle: true,
      currentHp: 28,
      maxHp: 28,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
    },
    [t2Id]: {
      id: t2Id,
      mapId,
      name: 'Goblin Scout',
      imageUrl: '',
      x: 650,
      y: 450,
      size: 1,
      rotation: 0,
      ringColor: '#ef4444', // red ring
      fillColor: '#7f1d1d',
      clipCircle: true,
      currentHp: 7,
      maxHp: 7,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
    },
  };
}

export function createDefaultBrawlTokens(mapId: string): Record<string, Token> {
  const t1Id = 'token-brawl-unit-1';
  const t2Id = 'token-brawl-unit-2';

  return {
    [t1Id]: {
      id: t1Id,
      mapId,
      name: 'Strike Squad Sergeant',
      imageUrl: '',
      x: 350,
      y: 350,
      size: 1,
      rotation: 0,
      ringColor: '#38bdf8',
      fillColor: '#0369a1',
      clipCircle: true,
      currentHp: 4,
      maxHp: 4,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
      unitHaloColor: '#38bdf8',
    },
    [t2Id]: {
      id: t2Id,
      mapId,
      name: 'Enemy Assault Specialist',
      imageUrl: '',
      x: 650,
      y: 450,
      size: 1,
      rotation: 0,
      ringColor: '#f43f5e',
      fillColor: '#be123c',
      clipCircle: true,
      currentHp: 4,
      maxHp: 4,
      tempHp: 0,
      speed: 30,
      conditions: [],
      isProp: false,
      layer: 'token',
      unitHaloColor: '#f43f5e',
    },
  };
}

export function createDefaultTokens(
  mapId: string,
  mode: 'vtt' | 'brawl' = 'vtt',
  flags: Record<string, boolean> = parseFeatureFlags(process.env),
): Record<string, Token> {
  if (mode === 'brawl') {
    return isFeatureFlagActive(flags, 'default_brawl_tokens')
      ? createDefaultBrawlTokens(mapId)
      : {};
  }
  return isFeatureFlagActive(flags, 'default_vtt_tokens')
    ? createDefaultVttTokens(mapId)
    : {};
}

export function createSession(
  name?: string,
  requestedId?: string,
  mode: 'vtt' | 'brawl' = 'vtt',
  customFlags?: Record<string, boolean>,
): { session: GameSession; gmKey: string } {
  const id = requestedId || generateRoomId();
  const gmKey = crypto.randomUUID();
  const flags = customFlags || parseFeatureFlags(process.env);
  const defaultMap = createDefaultMap(undefined, mode);

  const initialFog: FogState = {
    mapId: defaultMap.id,
    globalCovered: false,
    shapes: [],
  };

  const tokens = createDefaultTokens(defaultMap.id, mode, flags);

  // RPG initiative items only populated when default tokens exist in VTT mode
  const hasTokens = Object.keys(tokens).length > 0;
  const initiativeItems =
    mode === 'vtt' && hasTokens && tokens['token-fighter']
      ? [
          {
            id: 'init-1',
            tokenId: 'token-fighter',
            name: 'Valeros the Fighter',
            initiative: 16,
            hp: 28,
            maxHp: 28,
            color: '#3b82f6',
          },
          {
            id: 'init-2',
            tokenId: 'token-goblin',
            name: 'Goblin Scout',
            initiative: 12,
            hp: 7,
            maxHp: 7,
            color: '#ef4444',
          },
        ]
      : [];

  const session: GameSession = {
    id,
    name: name || `Session ${id}`,
    createdAt: Date.now(),
    gmId: '',
    activeMapId: defaultMap.id,
    maps: [defaultMap],
    tokens,
    fog: { [defaultMap.id]: initialFog },
    players: {},
    initiative: {
      round: 1,
      currentTurnIndex: 0,
      items: initiativeItems,
    },
    markers: [],
    diceHistory: [],
    soundtracks: [],
    clocks: [],
  };

  sessions.set(id, { session, gmKey });

  // Asynchronously persist to database if available
  if (isDbConnected()) {
    saveSessionToDb(session, gmKey);
  }

  return { session, gmKey };
}

export async function initSessionsFromDb(): Promise<void> {
  if (!isDbConnected()) return;
  const dbSessions = await loadAllSessionsFromDb();
  for (const [id, entry] of dbSessions) {
    if (!sessions.has(id)) {
      sessions.set(id, entry);
    }
  }
}

export function getSession(id: string): GameSession | null {
  const entry = sessions.get(id);
  return entry ? entry.session : null;
}

export async function getOrLoadSession(id: string): Promise<GameSession | null> {
  const existing = getSession(id);
  if (existing) return existing;

  if (isDbConnected()) {
    const loaded = await loadSessionFromDb(id);
    if (loaded) {
      sessions.set(id, loaded);
      return loaded.session;
    }
  }

  return null;
}

export function getSessionGmKey(id: string): string | null {
  const entry = sessions.get(id);
  return entry ? entry.gmKey : null;
}

export function updateSession(id: string, updates: Partial<GameSession>): GameSession | null {
  const entry = sessions.get(id);
  if (!entry) return null;

  Object.assign(entry.session, updates);
  scheduleDbSync(id);
  return entry.session;
}

export function removeSession(id: string): boolean {
  const timer = dbSyncTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    dbSyncTimers.delete(id);
  }

  if (isDbConnected()) {
    deleteSessionFromDb(id);
  }

  return sessions.delete(id);
}

export function getAllSessions(): { id: string; name: string; createdAt: number }[] {
  return Array.from(sessions.values()).map((s) => ({
    id: s.session.id,
    name: s.session.name,
    createdAt: s.session.createdAt,
  }));
}

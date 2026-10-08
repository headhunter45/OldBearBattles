import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { Token, Player, EntityStatBlock } from '@oldbear/shared';

// Helper matching the token creation logic in AppVtt.tsx
function createSpawnedTokenFromStatBlock(
  statBlock: EntityStatBlock,
  mapId: string,
  localPlayer: Player | null,
  isGm: boolean
): Token {
  const hpParsed = typeof statBlock.hp === 'number'
    ? statBlock.hp
    : parseInt(String(statBlock.hp || '10'), 10) || 10;

  const isLocalPlayerNonGm = !isGm && Boolean(localPlayer);

  return {
    id: `token-${crypto.randomUUID()}`,
    name: statBlock.name,
    x: 300,
    y: 300,
    size: 1,
    imageUrl: statBlock.imageUrl,
    mapId,
    rotation: 0,
    ringColor: isLocalPlayerNonGm && localPlayer?.color ? localPlayer.color : '#10b981',
    fillColor: '#1e293b',
    clipCircle: true,
    clipShape: 'circle',
    currentHp: hpParsed,
    maxHp: hpParsed,
    tempHp: 0,
    speed: 30,
    ownerId: isGm ? undefined : localPlayer?.id,
    isPlayerToken: isLocalPlayerNonGm,
    locked: false,
    conditions: [],
    isProp: false,
    layer: 'token',
  };
}

function prepareTokenForPlayerAddition(
  rawToken: Token,
  localPlayer: Player | null,
  isGm: boolean
): Token {
  const isPropOrTile = Boolean(rawToken.isProp || rawToken.layer === 'map' || rawToken.layer === 'prop');
  return {
    ...rawToken,
    ownerId: !isGm && !isPropOrTile && !rawToken.ownerId ? localPlayer?.id : rawToken.ownerId,
    isPlayerToken: !isGm && !isPropOrTile ? true : rawToken.isPlayerToken,
    ringColor: !isGm && !isPropOrTile && localPlayer?.color ? localPlayer.color : rawToken.ringColor,
  };
}

describe('Player Token Spawning & Automatic Control (OB-201, OB-143)', () => {
  const mockPlayer: Player = {
    id: 'player-alice',
    name: 'Alice',
    role: 'player',
    color: '#ec4899',
    connected: true,
    assignedTokenIds: [],
  };

  const sampleStatBlock: EntityStatBlock = {
    id: 'sb-orc',
    name: 'Orc Warrior',
    type: 'monster',
    hp: 15,
    armorClass: 13,
    speed: '30 ft.',
  };

  it('assigns ownerId and isPlayerToken to player when spawning token from statblock', () => {
    const token = createSpawnedTokenFromStatBlock(sampleStatBlock, 'map-1', mockPlayer, false);

    assert.strictEqual(token.ownerId, 'player-alice', 'Spawned token is owned by the spawning player');
    assert.strictEqual(token.isPlayerToken, true, 'Spawned token is marked as a player token');
    assert.strictEqual(token.ringColor, '#ec4899', 'Spawned token uses player ring color');
  });

  it('does not assign player ownership when GM spawns token from statblock', () => {
    const gmPlayer: Player = {
      id: 'player-gm',
      name: 'Dungeon Master',
      role: 'gm',
      color: '#3b82f6',
      connected: true,
      assignedTokenIds: [],
    };

    const token = createSpawnedTokenFromStatBlock(sampleStatBlock, 'map-1', gmPlayer, true);

    assert.strictEqual(token.ownerId, undefined, 'GM-spawned tokens remain unassigned/controlled by GM');
    assert.strictEqual(token.isPlayerToken, false, 'GM-spawned token is not marked as player token');
    assert.strictEqual(token.ringColor, '#10b981', 'GM-spawned token retains default monster ring color');
  });

  it('assigns player control when non-GM player deploys an asset token', () => {
    const rawAssetToken: Token = {
      id: 'tok-1',
      mapId: 'map-1',
      name: 'Summoned Wolf',
      x: 100,
      y: 100,
      size: 1,
      rotation: 0,
      ringColor: '#ef4444',
      fillColor: '#1e3a8a',
      clipCircle: true,
      currentHp: 11,
      maxHp: 11,
      tempHp: 0,
      speed: 40,
      conditions: [],
      isProp: false,
      layer: 'token',
    };

    const finalToken = prepareTokenForPlayerAddition(rawAssetToken, mockPlayer, false);

    assert.strictEqual(finalToken.ownerId, 'player-alice');
    assert.strictEqual(finalToken.isPlayerToken, true);
    assert.strictEqual(finalToken.ringColor, '#ec4899');
  });

  it('preserves existing ownership and props/tiles without claiming them as player tokens', () => {
    const rawProp: Token = {
      id: 'prop-1',
      mapId: 'map-1',
      name: 'Wooden Chest',
      x: 100,
      y: 100,
      size: 1,
      rotation: 0,
      ringColor: '#94a3b8',
      fillColor: '#1e293b',
      clipCircle: false,
      currentHp: 10,
      maxHp: 10,
      tempHp: 0,
      speed: 0,
      conditions: [],
      isProp: true,
      layer: 'prop',
    };

    const finalProp = prepareTokenForPlayerAddition(rawProp, mockPlayer, false);

    assert.strictEqual(finalProp.ownerId, undefined);
    assert.strictEqual(finalProp.isPlayerToken, undefined);
    assert.strictEqual(finalProp.ringColor, '#94a3b8');
  });
});

import { canPlayerDuplicateToken } from './utils/tokenPermissions.js';

describe('Token Duplication Permissions (OB-201 Update)', () => {
  const alice: Player = {
    id: 'player-alice',
    name: 'Alice',
    role: 'player',
    color: '#ec4899',
    connected: true,
    assignedTokenIds: ['tok-alice-secondary'],
  };

  const bob: Player = {
    id: 'player-bob',
    name: 'Bob',
    role: 'player',
    color: '#3b82f6',
    connected: true,
    assignedTokenIds: [],
  };

  const gm: Player = {
    id: 'player-gm',
    name: 'Dungeon Master',
    role: 'gm',
    color: '#10b981',
    connected: true,
    assignedTokenIds: [],
  };

  const aliceToken: Token = {
    id: 'tok-alice',
    mapId: 'map-1',
    name: 'Alice Character',
    x: 100,
    y: 100,
    size: 1,
    rotation: 0,
    ringColor: '#ec4899',
    fillColor: '#1e3a8a',
    clipCircle: true,
    currentHp: 20,
    maxHp: 20,
    tempHp: 0,
    speed: 30,
    ownerId: 'player-alice',
    isPlayerToken: true,
    conditions: [],
    isProp: false,
    layer: 'token',
  };

  const bobToken: Token = {
    id: 'tok-bob',
    mapId: 'map-1',
    name: 'Bob Character',
    x: 150,
    y: 150,
    size: 1,
    rotation: 0,
    ringColor: '#3b82f6',
    fillColor: '#1e3a8a',
    clipCircle: true,
    currentHp: 25,
    maxHp: 25,
    tempHp: 0,
    speed: 30,
    ownerId: 'player-bob',
    isPlayerToken: true,
    conditions: [],
    isProp: false,
    layer: 'token',
  };

  const bossToken: Token = {
    id: 'tok-boss',
    mapId: 'map-1',
    name: 'Ancient Red Dragon',
    x: 500,
    y: 500,
    size: 4,
    rotation: 0,
    ringColor: '#ef4444',
    fillColor: '#1e293b',
    clipCircle: true,
    currentHp: 500,
    maxHp: 500,
    tempHp: 0,
    speed: 40,
    ownerId: undefined, // GM-only
    isPlayerToken: false,
    conditions: [],
    isProp: false,
    layer: 'token',
    character: {
      id: 'char-dragon',
      name: 'Ancient Red Dragon',
      level: 20,
      classes: 'Monster',
      race: 'Dragon',
      currentHp: 500,
      maxHp: 500,
      tempHp: 0,
      speed: 40,
      armorClass: 22,
      stats: { str: 30, dex: 10, con: 29, int: 18, wis: 15, cha: 23 },
      actions: [
        { name: 'Fire Breath', type: 'ranged', damageDice: '26d6', activationType: 'action' },
        { name: 'Bite', type: 'melee', damageDice: '2d10+10', activationType: 'action' },
      ],
    },
  };

  const unclaimedPlayerToken: Token = {
    id: 'tok-unclaimed',
    mapId: 'map-1',
    name: 'Unclaimed Fighter',
    x: 200,
    y: 200,
    size: 1,
    rotation: 0,
    ringColor: '#64748b',
    fillColor: '#1e293b',
    clipCircle: true,
    currentHp: 20,
    maxHp: 20,
    tempHp: 0,
    speed: 30,
    ownerId: 'unassigned',
    isPlayerToken: true,
    conditions: [],
    isProp: false,
    layer: 'token',
  };

  const propToken: Token = {
    id: 'prop-barrel',
    mapId: 'map-1',
    name: 'Wooden Barrel',
    x: 300,
    y: 300,
    size: 1,
    rotation: 0,
    ringColor: '#94a3b8',
    fillColor: '#1e293b',
    clipCircle: false,
    currentHp: 10,
    maxHp: 10,
    tempHp: 0,
    speed: 0,
    ownerId: undefined,
    conditions: [],
    isProp: true,
    layer: 'prop',
  };

  it('allows player to duplicate their own token and assigned token', () => {
    assert.strictEqual(canPlayerDuplicateToken(aliceToken, alice, false), true);

    const assignedToken: Token = { ...aliceToken, id: 'tok-alice-secondary', ownerId: undefined };
    assert.strictEqual(canPlayerDuplicateToken(assignedToken, alice, false), true);
  });

  it('PREVENTS player from duplicating a boss or GM monster (preventing seeing attacks)', () => {
    // Alice trying to duplicate the boss
    assert.strictEqual(canPlayerDuplicateToken(bossToken, alice, false), false, 'Player cannot duplicate boss');
    // Bob trying to duplicate the boss
    assert.strictEqual(canPlayerDuplicateToken(bossToken, bob, false), false, 'Player cannot duplicate boss');
  });

  it('PREVENTS player from duplicating another player token', () => {
    assert.strictEqual(canPlayerDuplicateToken(bobToken, alice, false), false, 'Alice cannot duplicate Bob token');
    assert.strictEqual(canPlayerDuplicateToken(aliceToken, bob, false), false, 'Bob cannot duplicate Alice token');
  });

  it('allows player to duplicate unowned tokens (unclaimed player tokens and props)', () => {
    assert.strictEqual(canPlayerDuplicateToken(unclaimedPlayerToken, alice, false), true, 'Can duplicate unclaimed player token');
    assert.strictEqual(canPlayerDuplicateToken(propToken, alice, false), true, 'Can duplicate unowned prop');
  });

  it('allows GM to duplicate any token including bosses and players', () => {
    assert.strictEqual(canPlayerDuplicateToken(bossToken, gm, true), true, 'GM can duplicate boss');
    assert.strictEqual(canPlayerDuplicateToken(aliceToken, gm, true), true, 'GM can duplicate player token');
    assert.strictEqual(canPlayerDuplicateToken(propToken, gm, true), true, 'GM can duplicate prop');
  });
});


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

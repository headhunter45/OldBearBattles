import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Token, Player, DnDAction, EntityAction } from '@oldbear/shared';
import { CharacterFlyout } from './components/CharacterFlyout.js';
import { TokenControls } from '../common/components/TokenControls.js';
import { addBlockToTokenOrCharacter } from '../common/components/ChatPanel.js';

describe('Standalone Token Attacks & Actions (OB-200)', () => {
  const mockPlayer: Player = {
    id: 'player-test-1',
    name: 'Dungeon Master',
    color: '#3b82f6',
    role: 'gm',
    connected: true,
    assignedTokenIds: [],
  };

  const sampleAttack1: DnDAction = {
    name: 'Longsword Slash',
    type: 'melee',
    toHitModifier: 5,
    damageDice: '1d8+3',
    range: '5 ft',
    description: 'Versatile (1d10+3)',
  };

  const sampleAttack2: DnDAction = {
    name: 'Fire Bolt',
    type: 'spell',
    toHitModifier: 6,
    damageDice: '1d10',
    range: '120 ft',
  };

  const unsyncedTokenWithAttacks: Token = {
    id: 'token-goblin-1',
    mapId: 'map-main',
    name: 'Goblin Scout',
    x: 100,
    y: 150,
    size: 1,
    rotation: 0,
    ringColor: '#ef4444',
    fillColor: '#1e293b',
    clipCircle: true,
    currentHp: 7,
    maxHp: 7,
    tempHp: 0,
    speed: 30,
    conditions: [],
    isProp: false,
    layer: 'token',
    // Deliberately no character synced (OB-200)
    character: undefined,
    actions: [sampleAttack1, sampleAttack2],
  };

  const unsyncedTokenWithoutAttacks: Token = {
    id: 'token-guard-1',
    mapId: 'map-main',
    name: 'Town Guard',
    x: 200,
    y: 250,
    size: 1,
    rotation: 0,
    ringColor: '#3b82f6',
    fillColor: '#1e293b',
    clipCircle: true,
    currentHp: 12,
    maxHp: 12,
    tempHp: 0,
    speed: 30,
    conditions: [],
    isProp: false,
    layer: 'token',
    character: undefined,
  };

  it('allows token to carry standalone attacks without character property', () => {
    assert.strictEqual(unsyncedTokenWithAttacks.character, undefined);
    assert.ok(Array.isArray(unsyncedTokenWithAttacks.actions));
    assert.strictEqual(unsyncedTokenWithAttacks.actions.length, 2);
    assert.strictEqual(unsyncedTokenWithAttacks.actions[0].name, 'Longsword Slash');
    assert.strictEqual(unsyncedTokenWithAttacks.actions[0].toHitModifier, 5);
    assert.strictEqual(unsyncedTokenWithAttacks.actions[0].damageDice, '1d8+3');
  });

  it('renders token attacks in CharacterFlyout for an unsynced token', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unsyncedTokenWithAttacks,
        onClose: () => {},
        isGm: true,
      })
    );

    // Should render the token attacks section header
    assert.ok(markup.includes('Token Attacks (2)'), 'Renders Token Attacks header with count 2');
    assert.ok(markup.includes('Longsword Slash'), 'Renders first attack name');
    assert.ok(markup.includes('+5 to hit'), 'Renders attack to-hit bonus');
    assert.ok(markup.includes('1d8+3 dmg'), 'Renders damage dice');
    assert.ok(markup.includes('Fire Bolt'), 'Renders second attack name');
    assert.ok(markup.includes('+6 to hit'), 'Renders second attack to-hit bonus');
    assert.ok(markup.includes('1d10 dmg'), 'Renders second attack damage');
    // Still shows the unlinked notice because character sheet is not synced
    assert.ok(
      markup.includes('No D&amp;D Beyond character linked') ||
        markup.includes('No D&D Beyond character linked') ||
        markup.includes('No character sheet linked.'),
      'Retains unsynced notice while providing attacks'
    );
  });

  it('renders empty attacks state with Add Attack button when token has no attacks', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unsyncedTokenWithoutAttacks,
        onClose: () => {},
        isGm: true,
      })
    );

    assert.ok(markup.includes('Token Attacks (0)'), 'Renders Token Attacks header with count 0');
    assert.ok(markup.includes('Add Attack'), 'Renders Add Attack button');
    assert.ok(
      markup.includes('No attacks added to Town Guard'),
      'Renders empty notice prompting user to add attacks directly'
    );
  });

  it('renders attacks button and count in TokenControls floating HUD', () => {
    const markup = renderToStaticMarkup(
      React.createElement(TokenControls, {
        token: unsyncedTokenWithAttacks,
        onUpdateToken: () => {},
        onDeleteToken: () => {},
        onTransferToken: () => {},
        onOpenFullEditor: () => {},
        canControl: true,
        isGm: true,
        maps: [],
      })
    );

    assert.ok(markup.includes('Token Attacks (2)'), 'Swords button tooltip indicates 2 attacks');
    assert.ok(markup.includes('>2<'), 'Badge shows 2 attacks on the Swords icon');
  });

  it('adds an attack directly to token without syncing a character in addBlockToTokenOrCharacter', () => {
    let syncedTokenId: string | null = null;
    let syncedUpdates: Partial<Token> | null = null;

    const actionEntity: EntityAction = {
      id: 'action-bite-1',
      name: 'Wolf Bite',
      type: 'attack',
      cost: 'action',
      damageFormula: '2d4+2',
      range: '5 ft',
      description: 'Target must succeed on a DC 11 Strength saving throw or be knocked prone.',
    };

    const targetToken: Token = {
      id: 'token-wolf-1',
      mapId: 'map-main',
      name: 'Dire Wolf',
      x: 50,
      y: 50,
      size: 2,
      rotation: 0,
      ringColor: '#10b981',
      fillColor: '#1e293b',
      clipCircle: true,
      currentHp: 37,
      maxHp: 37,
      tempHp: 0,
      speed: 50,
      conditions: [],
      isProp: false,
      layer: 'token',
      // No character bound
      character: undefined,
    };

    const result = addBlockToTokenOrCharacter({
      block: actionEntity,
      targetToken,
      player: mockPlayer,
      onSyncToken: (id, updates) => {
        syncedTokenId = id;
        syncedUpdates = updates;
      },
    });

    assert.ok(result, 'Returns result from addBlockToTokenOrCharacter');
    assert.strictEqual(result.targetType, 'token');
    assert.strictEqual(result.targetId, 'token-wolf-1');
    assert.strictEqual(syncedTokenId, 'token-wolf-1');

    // Crucial check: actions is updated on token, but token.character is NOT set!
    assert.ok(syncedUpdates);
    const updates = syncedUpdates as Partial<Token>;
    assert.ok(Array.isArray(updates.actions));
    assert.strictEqual(updates.actions?.length, 1);
    assert.strictEqual(updates.actions?.[0].name, 'Wolf Bite');
    assert.strictEqual(updates.actions?.[0].damageDice, '2d4+2');
    assert.strictEqual(updates.character, undefined, 'Does not sync or forge a character sheet');
  });
});

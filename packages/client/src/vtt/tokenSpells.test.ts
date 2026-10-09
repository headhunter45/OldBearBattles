import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Token, Player, DnDCharacter, DnDSpell, EntityStatBlock } from '@oldbear/shared';
import { CharacterFlyout } from './components/CharacterFlyout.js';
import { TokenEditorModal } from '../common/components/TokenEditorModal.js';
import { addBlockToTokenOrCharacter } from '../common/components/ChatPanel.js';

describe('Standalone Token Spells & Chat Spell Integration', () => {
  const mockPlayer: Player = {
    id: 'player-test-1',
    name: 'Mage User',
    color: '#8b5cf6',
    role: 'player',
    connected: true,
    assignedTokenIds: ['token-mage-1'],
  };

  const sampleSpell1: DnDSpell = {
    id: 'spell-fb-1',
    name: 'Fireball',
    level: 3,
    school: 'Evocation',
    castingTime: '1 action',
    range: '150 ft',
    duration: 'Instantaneous',
    description: 'A bright streak flashes to a point you choose within range.',
    dndBeyondUrl: '',
  };

  const sampleSpell2: DnDSpell = {
    id: 'spell-shield-1',
    name: 'Shield',
    level: 1,
    school: 'Abjuration',
    castingTime: '1 reaction',
    range: 'Self',
    duration: '1 round',
    description: 'An invisible barrier of magical force appears.',
    dndBeyondUrl: '',
  };

  const unsyncedTokenWithSpells: Token = {
    id: 'token-mage-1',
    mapId: 'map-main',
    name: 'Mage Apprentice',
    ownerId: 'player-test-1',
    x: 100,
    y: 150,
    size: 1,
    rotation: 0,
    ringColor: '#a855f7',
    fillColor: '#1e293b',
    clipCircle: true,
    currentHp: 20,
    maxHp: 20,
    tempHp: 0,
    speed: 30,
    conditions: [],
    isProp: false,
    layer: 'token',
    character: undefined,
    spells: [sampleSpell1, sampleSpell2],
  };

  const unsyncedTokenWithoutSpells: Token = {
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

  it('allows token to carry standalone spells directly on token object', () => {
    assert.strictEqual(unsyncedTokenWithSpells.character, undefined);
    assert.ok(Array.isArray(unsyncedTokenWithSpells.spells));
    assert.strictEqual(unsyncedTokenWithSpells.spells.length, 2);
    assert.strictEqual(unsyncedTokenWithSpells.spells[0].name, 'Fireball');
    assert.strictEqual(unsyncedTokenWithSpells.spells[0].level, 3);
    assert.strictEqual(unsyncedTokenWithSpells.spells[1].name, 'Shield');
  });

  it('renders token spells in CharacterFlyout for an unsynced token', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unsyncedTokenWithSpells,
        onClose: () => {},
        onRollAction: () => {},
        isGm: false,
      })
    );

    // Should render the token spells section header
    assert.ok(markup.includes('Token Spells (2)'), 'Renders Token Spells count badge');
    // Should render spell names
    assert.ok(markup.includes('Fireball'), 'Renders Fireball spell name');
    assert.ok(markup.includes('Shield'), 'Renders Shield spell name');
    // Should render Level badges
    assert.ok(markup.includes('Level 3'), 'Renders Level 3 badge');
    assert.ok(markup.includes('Level 1'), 'Renders Level 1 badge');
    // Should render Cast buttons
    assert.ok(markup.includes('Cast'), 'Renders Cast button');
  });

  it('renders empty spells state with Add Spell button when token has no spells in CharacterFlyout', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unsyncedTokenWithoutSpells,
        onClose: () => {},
        isGm: false,
      })
    );

    assert.ok(markup.includes('Token Spells (0)'), 'Renders Token Spells (0)');
    assert.ok(markup.includes('Add Spell'), 'Renders Add Spell button');
    assert.ok(markup.includes('No spells added to Town Guard'), 'Renders empty state message');
  });

  it('renders Spells & Magic section in TokenEditorModal with existing spells', () => {
    const markup = renderToStaticMarkup(
      React.createElement(TokenEditorModal, {
        token: unsyncedTokenWithSpells,
        onClose: () => {},
        onSave: () => {},
        players: [mockPlayer],
        isGm: true,
      })
    );

    assert.ok(
      markup.includes('Spells &amp; Magic (2)') || markup.includes('Spells & Magic (2)'),
      'Renders Spells & Magic header in TokenEditorModal'
    );
    assert.ok(markup.includes('Fireball'), 'Renders Fireball in TokenEditorModal');
    assert.ok(markup.includes('Shield'), 'Renders Shield in TokenEditorModal');
    assert.ok(markup.includes('Level 3'), 'Renders Level 3 badge in TokenEditorModal');
    assert.ok(markup.includes('Add Spell'), 'Renders Add Spell button in TokenEditorModal');
  });

  it('adds a spell from chat to both token and character sheet when user has an active character', () => {
    const playerChar: DnDCharacter = {
      id: 'char-mage-1',
      name: 'Mage User',
      level: 5,
      classes: 'Wizard',
      race: 'Elf',
      currentHp: 28,
      maxHp: 28,
      tempHp: 0,
      speed: 30,
      armorClass: 12,
      passivePerception: 13,
      initiativeBonus: 2,
      stats: { str: 8, dex: 14, con: 12, int: 18, wis: 12, cha: 10 },
      spells: [sampleSpell2], // initially only has Shield
      actions: [],
    };

    const spellBlock: EntityStatBlock = {
      id: 'spell-fireball',
      name: 'Fireball',
      type: 'spell',
      cost: 'action',
      level: 3,
      school: 'Evocation',
      castingTime: '1 action',
      range: '150 ft',
      duration: 'Instantaneous',
      description: 'A bright streak flashes from your pointing finger.',
    };

    let syncedTokenId: string | null = null;
    let syncedTokenUpdates: any = null;
    let updatedPlayerChar: DnDCharacter | null = null;
    const sentMessages: any[] = [];

    const res = addBlockToTokenOrCharacter({
      block: spellBlock,
      targetToken: unsyncedTokenWithSpells,
      character: playerChar,
      player: mockPlayer,
      onSyncToken: (id, updates) => {
        syncedTokenId = id;
        syncedTokenUpdates = updates;
      },
      onUpdatePlayerChar: (char) => {
        updatedPlayerChar = char;
      },
      onSendMessage: (msg) => sentMessages.push(msg),
    });

    assert.ok(res, 'Returns result from addBlockToTokenOrCharacter');
    assert.strictEqual(res.targetType, 'token');
    assert.strictEqual(syncedTokenId, 'token-mage-1');

    // 1. Token spells property is updated with the new spell
    assert.ok(syncedTokenUpdates.spells, 'Updates token.spells');
    assert.ok(syncedTokenUpdates.spells.some((s: DnDSpell) => s.name === 'Fireball'));

    // 2. Player character sheet IS updated with the new spell
    assert.ok(updatedPlayerChar, 'Player character sheet was updated');
    const finalPlayerChar = updatedPlayerChar as DnDCharacter;
    assert.strictEqual(finalPlayerChar.spells.length, 2);
    assert.ok(finalPlayerChar.spells.some((s: DnDSpell) => s.name === 'Fireball'));
    assert.ok(finalPlayerChar.spells.some((s: DnDSpell) => s.name === 'Shield'));

    // 3. Confirmation message sent
    assert.strictEqual(sentMessages.length, 1);
    assert.ok(sentMessages[0].text.includes('Fireball'));
  });

  it('adds a spell from chat directly to character sheet when no token is targeted', () => {
    const playerChar: DnDCharacter = {
      id: 'char-sorcerer-1',
      name: 'Sorcerer',
      level: 3,
      classes: 'Sorcerer',
      race: 'Human',
      currentHp: 20,
      maxHp: 20,
      tempHp: 0,
      speed: 30,
      armorClass: 11,
      passivePerception: 11,
      initiativeBonus: 1,
      stats: { str: 10, dex: 12, con: 14, int: 10, wis: 10, cha: 16 },
      spells: [],
      actions: [],
    };

    const spellBlock: EntityStatBlock = {
      id: 'spell-magic-missile',
      name: 'Magic Missile',
      type: 'spell',
      cost: 'action',
      level: 1,
      school: 'Evocation',
      castingTime: '1 action',
      range: '120 ft',
      duration: 'Instantaneous',
      description: 'You create three glowing darts of magical force.',
    };

    let updatedPlayerChar: DnDCharacter | null = null;
    const sentMessages: any[] = [];

    const res = addBlockToTokenOrCharacter({
      block: spellBlock,
      targetToken: null,
      character: playerChar,
      player: mockPlayer,
      onUpdatePlayerChar: (char) => {
        updatedPlayerChar = char;
      },
      onSendMessage: (msg) => sentMessages.push(msg),
    });

    assert.ok(res, 'Returns result');
    assert.ok(updatedPlayerChar, 'Player character sheet received update');
    const finalPlayerChar = updatedPlayerChar as DnDCharacter;
    assert.strictEqual(finalPlayerChar.spells.length, 1);
    assert.strictEqual(finalPlayerChar.spells[0].name, 'Magic Missile');
  });
});

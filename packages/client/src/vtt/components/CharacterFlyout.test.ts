import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CharacterFlyout } from './CharacterFlyout.js';
import type { Player, Token, DnDCharacter } from '@oldbear/shared';
import { updateActiveFlags } from '../../common/config/featureFlags.js';

describe('CharacterFlyout Unbound Token Reset (OB-207)', () => {
  let mockStore: Record<string, string> = {};
  let originalLocalStorage: any;

  beforeEach(() => {
    mockStore = {};
    originalLocalStorage = (globalThis as any).localStorage;
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStore[key] = String(val);
      },
      removeItem: (key: string) => {
        delete mockStore[key];
      },
      clear: () => {
        mockStore = {};
      },
    };
  });

  afterEach(() => {
    (globalThis as any).localStorage = originalLocalStorage;
  });

  const mockPlayer: Player = {
    id: 'player-1',
    name: 'Player One',
    color: '#ff0000',
    role: 'player',
    connected: true,
    assignedTokenIds: [],
  };

  const boundCharacter: DnDCharacter = {
    id: 'char-12345',
    name: 'Gandalf the Grey',
    level: 5,
    classes: 'Wizard 5',
    race: 'Human',
    currentHp: 38,
    maxHp: 38,
    tempHp: 0,
    speed: 30,
    armorClass: 15,
    passivePerception: 14,
    initiativeBonus: 2,
    stats: {
      str: 10,
      dex: 14,
      con: 14,
      int: 18,
      wis: 16,
      cha: 12,
    },
    actions: [],
    spells: [],
  };

  const tokenWithCharacter: Token = {
    id: 'tok-bound-1',
    mapId: 'map-1',
    name: 'Gandalf Token',
    x: 100,
    y: 100,
    size: 1,
    rotation: 0,
    ringColor: '#ff0000',
    fillColor: '#000000',
    clipCircle: true,
    tempHp: 0,
    speed: 30,
    conditions: [],
    isProp: false,
    layer: 'token',
    currentHp: 38,
    maxHp: 38,
    character: boundCharacter,
  };

  const unboundToken: Token = {
    id: 'tok-unbound-1',
    mapId: 'map-1',
    name: 'Hero',
    x: 200,
    y: 200,
    size: 1,
    rotation: 0,
    ringColor: '#ff0000',
    fillColor: '#000000',
    clipCircle: true,
    tempHp: 0,
    speed: 30,
    conditions: [],
    isProp: false,
    layer: 'token',
    currentHp: 20,
    maxHp: 20,
    // No character bound
  };

  it('renders default state for token without bound character sheet (OB-207)', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unboundToken,
        onClose: () => {},
      })
    );

    // Title bar should show default 'Character Sheet', not a character name
    assert.ok(markup.includes('Character Sheet'), 'Header title displays generic Character Sheet');
    assert.ok(!markup.includes('Gandalf the Grey'), 'Does not display unbound character');

    // Should indicate no character linked and offer manual token HP
    assert.ok(
      markup.includes('No D&amp;D Beyond character linked') || markup.includes('No D&D Beyond character linked'),
      'Displays no character linked notice'
    );
    assert.ok(markup.includes('Sync with Token (Hero)'), 'Offers sync button with the unbound token name');

    // Token HP should match the unbound token (20 HP)
    assert.ok(markup.includes('20'), 'Displays token HP (20)');
  });

  it('renders character details when target token has a bound character sheet', () => {
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: tokenWithCharacter,
        onClose: () => {},
      })
    );

    assert.ok(markup.includes('Gandalf the Grey'), 'Header or profile displays Gandalf the Grey');
    assert.ok(markup.includes('Lv 5') || markup.includes('(Lv 5)'), 'Displays character level');
    assert.ok(!markup.includes('No D&D Beyond character linked'), 'Does not display unlinked state');
  });

  it('does not leak player dndBeyondCharacter to an unbound target token', () => {
    const playerWithChar: Player = {
      ...mockPlayer,
      dndBeyondCharacter: boundCharacter,
      dndBeyondCharacterId: 'char-12345',
    };

    // When an unbound token is targeted, it should not inherit playerWithChar.dndBeyondCharacter
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: playerWithChar,
        targetToken: unboundToken,
        onClose: () => {},
      })
    );

    // Target token has no character, so it should reset to default state for this token
    assert.ok(markup.includes('Character Sheet'), 'Header shows Character Sheet');
    assert.ok(
      markup.includes('No D&amp;D Beyond character linked') || markup.includes('No D&D Beyond character linked'),
      'Does not bind player character automatically to unlinked token'
    );
    assert.ok(markup.includes('Sync with Token (Hero)'), 'Sync button targets the selected Hero token');
  });

  it('keeps D&D Beyond URL input empty for tokens with non-D&D Beyond IDs (OB-213)', () => {
    // When a token has a character with internal ID 'char-12345', it should NOT prefill the input with that ID
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: tokenWithCharacter,
        onClose: () => {},
      })
    );

    // The input should have value="" and not value="char-12345"
    assert.ok(!markup.includes('value="char-12345"'), 'Does not display internal character ID in D&D Beyond input');

    // For a token with an authentic numeric D&D Beyond ID:
    const dndBeyondToken: Token = {
      ...tokenWithCharacter,
      character: {
        ...boundCharacter,
        id: '47804290',
      },
    };

    const dndBeyondMarkup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: dndBeyondToken,
        onClose: () => {},
      })
    );

    assert.ok(
      dndBeyondMarkup.includes('value="https://www.dndbeyond.com/characters/47804290"'),
      'Displays full D&D Beyond URL for genuine numeric D&D Beyond ID'
    );
  });

  it('renders Save to Database button when character is loaded and Save as Custom Character when unbound (OB-214)', () => {
    // When character is loaded
    const withCharMarkup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: tokenWithCharacter,
        onClose: () => {},
      })
    );

    assert.ok(
      withCharMarkup.includes('Save to Database'),
      'Renders Save to Database button when character is loaded'
    );

    // When unbound token
    const unboundMarkup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unboundToken,
        onClose: () => {},
      })
    );

    assert.ok(
      unboundMarkup.includes('Save as Custom Character'),
      'Renders Save as Custom Character button when viewing unbound token'
    );
  });

  it('does not favor D&D and defaults to Local Character ruleset tab (OB-219)', () => {
    updateActiveFlags({ dndbeyond: true, pathbuilder: true });
    const markup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unboundToken,
        onClose: () => {},
      })
    );

    // Should render all three options: Local Character, D&D Beyond (5e), and Pathbuilder 2e (PF2e)
    assert.ok(markup.includes('Local Character'), 'Renders Local Character tab');
    assert.ok(
      markup.includes('D&amp;D Beyond (5e)') || markup.includes('D&D Beyond (5e)'),
      'Renders D&D Beyond tab'
    );
    assert.ok(markup.includes('Pathbuilder 2e (PF2e)'), 'Renders Pathbuilder tab');

    // Local Character should be active by default
    assert.ok(
      markup.includes('LOCAL SYSTEM-AGNOSTIC CHARACTER'),
      'Displays Local System-Agnostic Character header by default'
    );
    assert.ok(
      markup.includes('Create Blank Sheet') || markup.includes('New Local Sheet'),
      'Displays Local Character action button'
    );
    assert.ok(
      markup.includes('Import JSON'),
      'Displays Local Character Import JSON button'
    );
  });

  it('respects dndbeyond and pathbuilder feature flags (OB-232)', () => {
    // Both enabled
    updateActiveFlags({ dndbeyond: true, pathbuilder: true });
    const allEnabledMarkup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unboundToken,
        onClose: () => {},
      })
    );
    assert.ok(allEnabledMarkup.includes('Local Character'), 'Shows Local tab');
    assert.ok(allEnabledMarkup.includes('D&amp;D Beyond (5e)') || allEnabledMarkup.includes('D&D Beyond (5e)'), 'Shows D&D Beyond tab when enabled');
    assert.ok(allEnabledMarkup.includes('Pathbuilder 2e (PF2e)'), 'Shows Pathbuilder tab when enabled');

    // Both disabled
    updateActiveFlags({ dndbeyond: false, pathbuilder: false });
    const disabledMarkup = renderToStaticMarkup(
      React.createElement(CharacterFlyout, {
        player: mockPlayer,
        targetToken: unboundToken,
        onClose: () => {},
      })
    );
    assert.ok(disabledMarkup.includes('Local Character'), 'Shows Local tab');
    assert.ok(!disabledMarkup.includes('D&amp;D Beyond (5e)') && !disabledMarkup.includes('D&D Beyond (5e)'), 'Hides D&D Beyond tab when disabled');
    assert.ok(!disabledMarkup.includes('Pathbuilder 2e (PF2e)'), 'Hides Pathbuilder tab when disabled');
    assert.ok(disabledMarkup.includes('No character sheet linked.'), 'Displays generic unlinked character notice when dndbeyond is disabled');
    assert.ok(!disabledMarkup.includes('No D&amp;D Beyond character linked') && !disabledMarkup.includes('No D&D Beyond character linked'), 'Hides D&D Beyond reference from unlinked notice');
    assert.ok(disabledMarkup.includes('Sync with Token (Hero)'), 'Player can still sync data to a token even when dndbeyond is disabled');

    // Reset back to defaults
    updateActiveFlags({ dndbeyond: true, pathbuilder: true });
  });
});


import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrawlTopBar } from './BrawlTopBar.js';

describe('BrawlTopBar Active Scene Settings (OB-209)', () => {
  it('renders Scene label and settings button for Organizer in BrawlTopBar', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BrawlTopBar, {
        roomName: 'Test Room',
        activeMapName: 'Wargame Ruins',
        isOrganizer: true,
        players: [],
        localPlayer: null,
        activePlayerIndex: 1,
        currentRound: 1,
        currentPhase: 'Command',
        p1ClockSeconds: 300,
        p2ClockSeconds: 300,
        isClockRunning: false,
        onToggleClock: () => {},
        onNextPhase: () => {},
        onSwitchActivePlayer: () => {},
        onOpenArmyRoster: () => {},
        onOpenDice: () => {},
        onOpenMaps: () => {},
        onOpenSceneSettings: () => {},
        onOpenSoundboard: () => {},
        onOpenBackup: () => {},
        onAddNewModel: () => {},
        onToggleMobileDrawer: () => {},
      })
    );

    assert.ok(markup.includes('Scene:'), 'Displays Scene label in Brawl');
    assert.ok(markup.includes('Wargame Ruins'), 'Displays active scene name in Brawl');
    assert.ok(markup.includes('title="Scene Settings"'), 'Renders Scene Settings button in Brawl');
  });

  it('does not render settings button for non-organizer player in BrawlTopBar', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BrawlTopBar, {
        roomName: 'Test Room',
        activeMapName: 'Wargame Ruins',
        isOrganizer: false,
        players: [],
        localPlayer: null,
        activePlayerIndex: 1,
        currentRound: 1,
        currentPhase: 'Command',
        p1ClockSeconds: 300,
        p2ClockSeconds: 300,
        isClockRunning: false,
        onToggleClock: () => {},
        onNextPhase: () => {},
        onSwitchActivePlayer: () => {},
        onOpenArmyRoster: () => {},
        onOpenDice: () => {},
        onOpenMaps: () => {},
        onOpenSceneSettings: () => {},
        onOpenSoundboard: () => {},
        onOpenBackup: () => {},
        onAddNewModel: () => {},
        onToggleMobileDrawer: () => {},
      })
    );

    assert.ok(markup.includes('Scene:'), 'Displays Scene label in Brawl');
    assert.ok(markup.includes('Wargame Ruins'), 'Displays active scene name in Brawl');
    assert.ok(!markup.includes('title="Scene Settings"'), 'Does not render settings button for non-organizer');
  });

  it('renders hamburger menu button with accent-primary background matching VTT (OB-223)', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BrawlTopBar, {
        roomName: 'Test Room',
        activeMapName: 'Wargame Ruins',
        isOrganizer: true,
        players: [],
        localPlayer: null,
        activePlayerIndex: 1,
        currentRound: 1,
        currentPhase: 'Command',
        p1ClockSeconds: 300,
        p2ClockSeconds: 300,
        isClockRunning: false,
        onToggleClock: () => {},
        onNextPhase: () => {},
        onSwitchActivePlayer: () => {},
        onOpenArmyRoster: () => {},
        onOpenDice: () => {},
        onOpenMaps: () => {},
        onOpenSceneSettings: () => {},
        onOpenSoundboard: () => {},
        onOpenBackup: () => {},
        onAddNewModel: () => {},
        onToggleMobileDrawer: () => {},
      })
    );

    assert.ok(markup.includes('background-color:var(--accent-primary)'), 'Hamburger menu has accent-primary background');
  });

  it('renders wrapping layout to accommodate extensive wargame toolbar controls', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BrawlTopBar, {
        roomName: 'Test Room',
        activeMapName: 'Wargame Ruins',
        isOrganizer: true,
        players: [],
        localPlayer: null,
        activePlayerIndex: 1,
        currentRound: 1,
        currentPhase: 'Command',
        p1ClockSeconds: 300,
        p2ClockSeconds: 300,
        isClockRunning: false,
        onToggleClock: () => {},
        onNextPhase: () => {},
        onSwitchActivePlayer: () => {},
        onOpenArmyRoster: () => {},
        onOpenDice: () => {},
        onOpenMaps: () => {},
        onOpenSceneSettings: () => {},
        onOpenSoundboard: () => {},
        onOpenBackup: () => {},
        onAddNewModel: () => {},
        onToggleMobileDrawer: () => {},
      })
    );

    assert.ok(markup.includes('flex-wrap:wrap'), 'TopBar elements intentionally use flex-wrap:wrap');
  });
});


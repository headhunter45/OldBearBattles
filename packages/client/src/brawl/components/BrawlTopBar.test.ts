import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrawlTopBar } from './BrawlTopBar.js';
import { updateActiveFlags } from '../../common/config/featureFlags.js';

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

  it('renders dedicated Next Phase button and phase quick-jump trigger (OB-157)', () => {
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

    assert.ok(markup.includes('title="Next Phase (Spacebar)"'), 'Renders dedicated Next Phase button');
    assert.ok(markup.includes('title="Click to open phase quick-jump menu"'), 'Renders phase quick-jump trigger');
    assert.ok(markup.includes('Command Phase'), 'Displays current phase');
    assert.ok(markup.includes('Round 1 - Player 1'), 'Displays round and active player');
  });

  it('hides chess clocks when disabled', () => {
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
        isChessClockEnabled: false,
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
        onToggleChessClockHUD: () => {},
        onToggleChessClockEnabled: () => {},
      })
    );

    assert.ok(!markup.includes('Pass Turn'), 'Does not render inline clock Pass Turn button when disabled');
  });

  it('renders Scoreboard trophy button in BrawlTopBar (OB-159)', () => {
    updateActiveFlags({ scoreboard: true });
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
        p1TotalVp: 4,
        p2TotalVp: 2,
        onToggleClock: () => {},
        onNextPhase: () => {},
        onSwitchActivePlayer: () => {},
        onOpenScoreboard: () => {},
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

    assert.ok(markup.includes('title="Open Match Scoreboard (VP, CP, Casualties)"'), 'Renders Scoreboard trophy button');
    assert.ok(markup.includes('VP: 4 - 2'), 'Displays VP values in Scoreboard button');
  });

  it('renders inline chess clock bar when isChessClockEnabled is true', () => {
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
        p1ClockSeconds: 5400,
        p2ClockSeconds: 5400,
        isClockRunning: false,
        isChessClockEnabled: true,
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
        onToggleChessClockHUD: () => {},
        onToggleChessClockEnabled: () => {},
      })
    );

    assert.ok(markup.includes('Pass Turn'), 'Renders inline clock Pass Turn button when enabled');
    assert.ok(markup.includes('title="Start Clock"'), 'Renders Start Clock button when enabled');
    assert.ok(markup.includes('title="Hide / Disable Chess Clocks"'), 'Renders Disable Chess Clocks button');
  });

  it('respects feature flags for topbar buttons (OB-232)', () => {
    const baseProps = {
      roomName: 'Test Room',
      activeMapName: 'Wargame Ruins',
      isOrganizer: true,
      players: [],
      localPlayer: null,
      activePlayerIndex: 1 as const,
      currentRound: 1,
      currentPhase: 'Command' as const,
      p1ClockSeconds: 300,
      p2ClockSeconds: 300,
      isClockRunning: false,
      onToggleClock: () => {},
      onNextPhase: () => {},
      onSwitchActivePlayer: () => {},
      onOpenArmyRoster: () => {},
      onOpenDice: () => {},
      onOpenScoreboard: () => {},
      onOpenObjectives: () => {},
      onOpenToModal: () => {},
      onOpenMaps: () => {},
      onOpenSceneSettings: () => {},
      onOpenSoundboard: () => {},
      onOpenBackup: () => {},
      onAddNewModel: () => {},
      onToggleMobileDrawer: () => {},
      onToggleChessClockHUD: () => {},
      onToggleChessClockEnabled: () => {},
    };

    // When flags are enabled
    updateActiveFlags({
      chess_clock: true,
      scoreboard: true,
      objectives: true,
      army_roster: true,
      to_mode: true,
      dice_roller: true,
    });
    const enabledMarkup = renderToStaticMarkup(
      React.createElement(BrawlTopBar, baseProps)
    );
    assert.ok(enabledMarkup.includes('title="Open Army Roster"'), 'Shows Army button when flag enabled');
    assert.ok(enabledMarkup.includes('title="Open Dice Roller"'), 'Shows Dice button when flag enabled');
    assert.ok(enabledMarkup.includes('title="Open Match Scoreboard (VP, CP, Casualties)"'), 'Shows Scoreboard button when flag enabled');
    assert.ok(enabledMarkup.includes('title="Open Objective Markers &amp; Control Zones"') || enabledMarkup.includes('title="Open Objective Markers & Control Zones"'), 'Shows Objectives button when flag enabled');
    assert.ok(enabledMarkup.includes('title="Tournament Organizer &amp; Spectator Settings"') || enabledMarkup.includes('title="Tournament Organizer & Spectator Settings"'), 'Shows TO button when flag enabled');
    assert.ok(enabledMarkup.includes('title="Enable Match Chess Clocks"'), 'Shows Clock button when flag enabled');

    // When flags are disabled
    updateActiveFlags({
      chess_clock: false,
      scoreboard: false,
      objectives: false,
      army_roster: false,
      to_mode: false,
      dice_roller: false,
    });
    const disabledMarkup = renderToStaticMarkup(
      React.createElement(BrawlTopBar, baseProps)
    );
    assert.ok(!disabledMarkup.includes('title="Open Army Roster"'), 'Hides Army button when flag disabled');
    assert.ok(!disabledMarkup.includes('title="Open Dice Roller"'), 'Hides Dice button when flag disabled');
    assert.ok(!disabledMarkup.includes('title="Open Match Scoreboard (VP, CP, Casualties)"'), 'Hides Scoreboard button when flag disabled');
    assert.ok(!disabledMarkup.includes('title="Open Objective Markers & Control Zones"'), 'Hides Objectives button when flag disabled');
    assert.ok(!disabledMarkup.includes('title="Tournament Organizer & Spectator Settings"'), 'Hides TO button when flag disabled');
    assert.ok(!disabledMarkup.includes('title="Enable Match Chess Clocks"'), 'Hides Clock button when flag disabled');

    // Reset flags to defaults
    updateActiveFlags({
      chess_clock: false,
      scoreboard: true,
      objectives: true,
      army_roster: true,
      to_mode: true,
      dice_roller: true,
    });
  });
});




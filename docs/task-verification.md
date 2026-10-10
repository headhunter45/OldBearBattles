# Manual Task Verification Guide

This document provides step-by-step instructions for manually verifying all features currently in **Testing** status in [tasks.md](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md). Each entry includes the task ID, feature title, prerequisites/UI location, execution steps, and pass/fail criteria.

> [!NOTE]
> **Workflow**: As tasks finish implementation, agents transition their status to `testing` and add their verification instructions here. Once a human tester verifies that the feature works as intended, the tester updates the task status to `done`, commits the change, and migrates the verification instructions into [docs/human-tests.md](file:///Users/tom/Projects/OldBearBattles/docs/human-tests.md) for permanent regression testing.

---

## Tasks Awaiting Verification

| Task ID | Feature Title | Domain | Status |
| :--- | :--- | :--- | :--- |
| **[OB-200](#ob-200---standalone-token-attacks-without-character-sync)** | Standalone Token Attacks Without Character Sync | VTT / Tokens | Testing |
| **[OB-198](#ob-198---reveal-fog-shortcut-key-shift-f)** | Reveal Fog Shortcut Key (`Shift+F`) | VTT / Fog of War | Testing |
| **[OB-211](#ob-211---remove-excess-display-from-info-commands)** | Remove Excess Display from Info Commands | Common / Chat | Testing |
| **[OB-207](#ob-207---unbound-token-resets-character-sheet-form-state)** | Unbound Token Resets Character Sheet Form State | VTT / Character Sheet | Testing |
| **[OB-182](#ob-182---associate-controllable-token-with-chat-panel)** | Associate Controllable Token with Chat Panel | VTT / Chat | Testing |
| **[OB-197](#ob-197---brawl-mode-top-bar-and-bidirectional-mode-switching)** | Brawl Mode Top Bar & Bidirectional Mode Switching | Platform / Brawl | Testing |
| **[OB-154](#ob-154---game_mode-environment-configuration--deployment-toggles)** | `GAME_MODE` Environment Configuration & Deployment Toggles | Platform / Brawl | Testing |
| **[OB-155](#ob-155---army-unit-and-model-domain-hierarchy--disambiguation)** | Army, Unit, and Model Domain Hierarchy & Disambiguation | Wargaming / Brawl | Testing |
| **[OB-156](#ob-156---unit-coherency-graph-engine--real-time-warning-halos)** | Unit Coherency Graph Engine & Real-Time Warning Halos | Wargaming / Brawl | Testing |
| **[OB-157](#ob-157---battle-round-stepper--wargaming-phase-engine)** | Battle Round Stepper & Wargaming Phase Engine | Wargaming / Brawl | Testing |
| **[OB-158](#ob-158---dual-player-chess-clocks-with-turn-countdown--active-switching)** | Dual-Player Chess Clocks with Turn Countdown & Active Switching | Wargaming / Brawl | Testing |
| **[OB-159](#ob-159---scoreboard--resource-tracker-vp-cp-casualties-with-audit-trail)** | Scoreboard & Resource Tracker (VP, CP, Casualties) with Audit Trail | Wargaming / Brawl | Testing |
| **[OB-160](#ob-160---objective-marker-control-zone-calculation--auto-scoring)** | Objective Marker Control Zone Calculation & Auto-Scoring | Wargaming / Brawl | Testing |
| **[OB-161](#ob-161---roster-ingestion-pipeline-newrecruit-json--battlescribe-rosz)** | Roster Ingestion Pipeline: NewRecruit JSON & BattleScribe `.rosz` | Wargaming / Brawl | Testing |
| **[OB-162](#ob-162---deployment-zones-casualty-trays--staging-submap-templates)** | Deployment Zones, Casualty Trays & Staging Submap Templates | Wargaming / Brawl | Testing |
| **[OB-163](#ob-163---tournament-organizer-to-mode-match-privacy--spectator-controls)** | Tournament Organizer (TO) Mode, Match Privacy & Spectator Controls | Wargaming / Brawl | Testing |
| **[OB-183](#ob-183---codebase-simplification--refactoring-plan-docsrefactor-1md)** | Codebase Simplification & Refactoring Plan (`docs/refactor-1.md`) | Architecture / Plan | Testing |
| **[OB-184](#ob-184---helptip-component--placement-guide-docshelptip-locationsmd)** | HelpTip Component & Placement Guide (`docs/helptip-locations.md`) | UI / UX Guide | Testing |
| **[OB-185](#ob-185---backlog-research--implementation-guide-docsbacklog-implementation-guidemd)** | Backlog Research & Implementation Guide (`docs/backlog-implementation-guide.md`) | Architecture / Guide | Testing |
| **[OB-187](#ob-187---submap--deployment-zone-customization-ui)** | Submap & Deployment Zone Customization UI | VTT & Brawl / Scenes | Testing |
| **[OB-188](#ob-188---relative-dragging-for-tokens-modular-tiles-and-props)** | Relative Dragging for Tokens, Modular Tiles, and Props | VTT & Brawl / Canvas | Testing |
| **[OB-189](#ob-189---edit-modular-tiles-and-center-on-random-draw)** | Edit Modular Tiles & Center on Random Draw | Common / Assets | Testing |
| **[OB-191](#ob-191---no-ring-color-default-for-props-and-tiles)** | No Ring Color as Default for Props & Tiles | Common / Canvas | Testing |
| **[OB-192](#ob-192---custom-status-creation-editing-and-token-controls-integration)** | Custom Status Creation, Editing, & Token Controls Integration | Common / Statuses | Testing |
| **[OB-193](#ob-193---choose-existing-and-preset-images-in-token-editor)** | Choose Existing & Preset Images in Token Editor | Common / Tokens | Testing |

---

## VTT & Chat

### OB-200 - Standalone Token Attacks Without Character Sync

- **Reference in tasks.md:** [tasks.md: OB-200](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-200)
- **Primary Source Code:** [TokenEditorModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenEditorModal.tsx), [TokenControls.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenControls.tsx), [CharacterFlyout.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/components/CharacterFlyout.tsx), [ChatPanel.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ChatPanel.tsx), [types.ts](file:///Users/tom/Projects/OldBearBattles/packages/shared/src/types.ts)
- **Where to find it:** Full Token Settings (`Settings` gear), Floating Token HUD (`Swords` button), Character Flyout (unbound token view), and Chat Panel (`/attack`, `/attack?`, and statblock action cards).

#### Step-by-Step Instructions:

1. **Add Attacks via Full Token Editor:**
   - Select any token on the battlemap that does **not** have a synced character sheet (or spawn a fresh token).
   - In the floating token HUD at the bottom, click the **Settings** gear icon (`Full Token Settings`).
   - Scroll down to the **Attacks & Actions** section.
   - Click **+ Add Attack**.
   - Fill in:
     - Attack Name: `Longsword`
     - Type: `Melee Attack`
     - To-Hit Modifier: `5`
     - Damage Formula: `1d8+3`
     - Reach / Range: `5 ft`
     - Notes: `Versatile (1d10+3)`
   - Click **Save Attack**. Verify the attack appears in the list with `Longsword`, `+5 to hit`, and `1d8+3 dmg`.
   - Click **Save Changes** in the modal.

2. **Quick Attacks & Rolling from Floating Token HUD:**
   - With the token selected, look at the floating token HUD.
   - Notice the **Swords** icon with badge `1`.
   - Click the **Swords** icon: verify the quick attacks popup opens above the HUD showing `Longsword (+5 to hit • 1d8+3)`.
   - Click **Roll**: verify the attack roll and damage roll execute, broadcasting to chat and triggering roll announcement banners.

3. **View & Add Attacks in Character Flyout for Unsynced Token:**
   - Select the unsynced token and open the Character Sheet flyout (via left sidebar or top bar Character button).
   - Notice the character sheet is not bound to a D&D Beyond / Pathbuilder sheet.
   - Verify the **Token Attacks** section is displayed showing the `Longsword` attack with a **Roll** button.
   - Click **+ Add Attack** in the flyout.
   - Add a second attack: Name `Dagger`, To-Hit `5`, Damage `1d4+3`, Range `20/60 ft`.
   - Click **Save Attack**: verify `Dagger` is immediately saved directly to the token.
   - Click **Roll** on `Dagger`: verify the attack rolls into chat.
   - Verify the token still has no character bound (no artificial D&D Beyond sheet was forged).

4. **Roll Attacks via Chat Commands Without Character Sync:**
   - In chat, run `/token Goblin Scout` (or the name of your unsynced token).
   - Run `/attack?`: verify the available attacks (`Longsword`, `Dagger`) are listed.
   - Run `/attack Longsword`: verify the attack rolls directly using the token's standalone attack stats.

5. **Add Attack Directly from Chat Statblock Card:**
   - In chat, inspect an attack or monster (e.g. `/attack? Shortbow` or `/monster? Goblin`).
   - On an action or attack card, click **Add to Token Actions** / **Add to Token**.
   - Verify the attack is added directly to the token without syncing a character sheet.

6. **Add Spells from Chat Statblock Card & Edit Token Modal:**
   - In chat, inspect a spell (e.g. `/spell? Fireball` or `/spell? Cure Wounds`).
   - Click **+ Add to Sheet** on the spell card.
   - Verify:
     - If you have an active character sheet (e.g. in `CharacterFlyout` or player profile), the spell is immediately added to your character sheet and visible under SPELLS.
     - If a token is targeted or selected, the spell is attached to the token's standalone spells (`token.spells`).
     - Open the **Full Token Editor** (`TokenEditorModal` via Settings gear) on the token: verify the **Spells & Magic** section displays the added spell with its level badge, school, casting time, and description, and allows editing, deleting, and adding new spells directly.
     - In `CharacterFlyout` for an unsynced token: verify the **Token Spells** section displays the spell with a **Cast** button that rolls the spell directly into chat.

#### Expected Result (Pass Criteria):

- Attacks and Spells can be added, edited, and deleted directly on tokens in `TokenEditorModal`.
- Floating token HUD provides a quick `Swords` popup to view and roll token attacks.
- `CharacterFlyout` allows viewing, rolling, casting, and adding attacks and spells for unsynced tokens without requiring character sync.
- Chat commands `/attack` and `/attack?` recognize and roll standalone token attacks.
- Adding a spell from chat (`+ Add to Sheet`) updates the active character sheet, target token spells, and appears immediately in both `CharacterFlyout` and `TokenEditorModal`.
- Tokens retain their standalone attacks and spells without creating or forging unnecessary `DnDCharacter` sheets.

---

### OB-198 - Reveal Fog Shortcut Key (`Shift+F`)

- **Reference in tasks.md:** [tasks.md: OB-198](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-198)
- **Primary Source Code:** [AppVtt.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/AppVtt.tsx), [ToolBar.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ToolBar.tsx), [HotkeyCheatSheetModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/HotkeyCheatSheetModal.tsx)
- **Where to find it:** VTT Canvas Toolbar, Fog menu, and Keyboard Shortcuts Cheat Sheet modal (`?`).

#### Step-by-Step Instructions:

1. Open the VTT room in your browser as a GM player.
2. Ensure you are on a map with Fog of War active (or toggle Fog on).
3. Press `f` on your keyboard (without Shift):
   - Verify that the active tool changes to **Hide Fog** (`fog-hide`).
4. Press `Shift + F` on your keyboard:
   - Verify that the active tool changes to **Reveal Fog** (`fog-reveal`).
5. Press `r` on your keyboard:
   - Verify that pressing `r` no longer switches to the Reveal Fog tool.
6. Open the Toolbar Fog submenu:
   - Verify the tooltip and menu item for Reveal Fog display `Reveal Fog (Shift+F)`.
7. Press `?` (or `Shift + /`) to open the Keyboard Shortcuts Cheat Sheet:
   - Verify that under **Fog of War**, the shortcut for *Reveal Fog of War* is listed as `Shift + F`.
   - Verify that *Hide / Cover Fog of War* remains `F`.

#### Expected Result (Pass Criteria):

- Pressing `Shift+F` activates the Reveal Fog tool.
- Pressing `F` activates the Hide/Cover Fog tool.
- Pressing `R` no longer triggers the Reveal Fog tool.
- Toolbar tooltips, menu labels, and the hotkey cheat sheet accurately show `Shift+F` for Reveal Fog.

---

### OB-211 - Remove Excess Display from Info Commands

- **Reference in tasks.md:** [tasks.md: OB-211](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-211)
- **Primary Source Code:** [ChatPanel.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ChatPanel.tsx)
- **Where to find it:** Chat Panel (`/spell?`, `/monster?`, `/attack?`, `/item?`, `/ability?`).

#### Step-by-Step Instructions:

1. Open the VTT room in two browser tabs or windows (Player 1 and Player 2).
2. In Player 1's chat input, run an info inspection command, e.g.:
   - `/spell? Magic Missile` (or `/spell? Fireball`)
   - `/monster? Goblin`
   - `/attack? Longsword`
   - `/item? Potion of Healing`
   - `/ability? Second Wind`
3. Inspect Player 1's chat window:
   - Verify the `StatBlockCard` displays cleanly and directly.
   - Verify there is **no** wrapping player speech container (no player name banner, no player color border, no timestamp header, and no redundant `inspects spell: **Magic Missile**` text).
4. Inspect Player 2's chat window:
   - Verify that **nothing** appeared in Player 2's chat window (the info response is completely ephemeral and private to Player 1).
5. On Player 1's displayed card, test interaction buttons:
   - For spells/attacks/items, click "Roll" or "Add to Character" to ensure card functionality remains intact.
   - For monsters, click "Spawn Token" to ensure canvas spawning works as expected.

#### Expected Result (Pass Criteria):

- Info command responses (`/spell?`, `/monster?`, `/attack?`, `/item?`, `/ability?`) are only displayed to the user who ran them (`isEphemeral: true`).
- Other players in the room do not receive or see the inspection cards.
- The cards render directly in the chat feed without being wrapped in the executing player's chat speech bubble or accompanied by redundant `inspects ...` text.

---

### OB-207 - Unbound Token Resets Character Sheet Form State

- **Reference in tasks.md:** [tasks.md: OB-207](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-207)
- **Primary Source Code:** [CharacterFlyout.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/components/CharacterFlyout.tsx)
- **Where to find it:** The Character Sheet floating window (Character button in top bar or sidebar) and battlemap canvas tokens.

#### Step-by-Step Instructions:

1. Open the VTT room in your browser.
2. Select or create a token with a linked character (or open Character Sheet and select a saved character to bind to the token).
3. Confirm that the open Character Sheet floating window displays all details for that token's character (name in title bar, level, stats, HP).
4. Add a new token via Token Picker "Create without image" (default name "Hero" with no bound character).
5. While the Character Sheet floating window remains open, click the newly created "Hero" token on the board to select it.
6. Verify that the Character Sheet resets to its default unbound state:
   - Header title displays generic **Character Sheet** (not the previously selected character's name).
   - "Load Saved Character" dropdown shows `-- Choose from saved characters --`.
   - "Board Token Assignment" targets the selected Hero token.
   - Body displays the saved character selection cards and the unlinked manual HP tracker matching the token's HP.
7. Select a character from the saved characters dropdown (or click "Select" on a saved character card).
8. Verify that the selected token on the board is immediately synchronized with the chosen character (name, stats, and avatar updated).

#### Expected Result (Pass Criteria):

- Switching selection from a bound character token to an unbound token immediately clears stale character data and resets the sheet to the default token state.
- Selecting a saved character from the dropdown while targeting the unbound token synchronizes that character directly to the active token.

---

### OB-182 - Associate Controllable Token with Chat Panel

- **Reference in tasks.md:** [tasks.md: OB-182](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-182)
- **Primary Source Code:** [ChatPanel.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ChatPanel.tsx)
- **Where to find it:** The Chat Panel message input bar and active canvas tokens.

#### Step-by-Step Instructions:

1. Open the VTT room in your browser.
2. Open the Chat Panel. Observe the **Speaking as:** selector bar above the message input box.
3. Select a token on the battlemap that your user owns or controls.
4. Click **`[Bind Selected]`** (or use the slash command `/token <name|index>`).
5. Send a chat message or roll an action (`/attack`, `/spell?`, or `/roll d20+init`).
6. Notice that the message and roll display `PlayerName (TokenName)` along with the token's avatar icon.
7. Run `/token clear` or select your player name from the dropdown to restore standard player identity.

#### Expected Result (Pass Criteria):

- "Speaking as" bar allows binding controllable tokens.
- Chat messages and rolls reflect the bound token identity and avatar.
- `/token clear` restores standard player speaking identity.

---

## Old Bear Brawl (Tabletop Wargaming Platform)

### OB-154 - `GAME_MODE` Environment Configuration & Deployment Toggles

- **Reference in tasks.md:** [tasks.md: OB-154](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-154)
- **Primary Source Code:** [App.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/App.tsx), [gameMode.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/config/gameMode.ts), [BrawlTopBar.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/BrawlTopBar.tsx)
- **Where to find it:** The application TopBar and URL search parameters (`?mode=`).

#### Step-by-Step Instructions:

1. In your browser, navigate to: `http://localhost:3000/?mode=brawl`.
   - Verify Old Bear Brawl loads with wargaming top bar, round stepper, chess clocks, and army roster tools.
2. In your browser, navigate to: `http://localhost:3000/?mode=vtt`.
   - Verify Old Bear VTT loads with tabletop RPG top bar, character sheet button, and initiative tracker.
3. Test TopBar Mode Switching:
   - While in VTT mode, locate the mode toggle pill next to the scene name: click **`⚔️ Brawl`**.
   - Notice the application transitions into Brawl mode and persists the preference in `localStorage`.
   - In Brawl mode, locate the top bar mode button: click **`🐻 VTT`**.
   - Notice the application transitions back into VTT mode.

#### Expected Result (Pass Criteria):

- URL query parameter `?mode=` correctly sets and persists active game mode.
- Top bar pill switches cleanly between VTT and Brawl in multi-mode deployment.

---

### OB-155 - Army, Unit, and Model Domain Hierarchy & Disambiguation

- **Reference in tasks.md:** [tasks.md: OB-155](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-155)
- **Primary Source Code:** [types.ts](file:///Users/tom/Projects/OldBearBattles/packages/shared/src/brawl/types.ts), [ArmyRosterFlyout.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/ArmyRosterFlyout.tsx), [rosterIngestion.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/utils/rosterIngestion.ts)
- **Where to find it:** The **Army Roster Flyout** in Brawl mode (`?mode=brawl` -> Shield icon in top bar).

#### Step-by-Step Instructions:

1. Navigate to `http://localhost:3000/?mode=brawl`.
2. Click the **Shield** icon in the top bar to open the Army Roster Flyout.
3. Observe the army summary header: points limit, points spent (e.g. `80 / 2000 pts`), faction, and detachment.
4. Click on a unit (e.g. `Terminator Squad`) to expand its model roster.
5. Notice model disambiguation: individual models have unique IDs and specific wargear (e.g. `Terminator Sergeant [Power Weapon, Storm Bolter]`, `Terminator 1 [Chainfist, Heavy Flamer]`).
6. Click **Deploy Unit to Table**:
   - Verify tokens spawn grouped together on the canvas with matching `unitId`.
   - Verify token rings share the unit's coherency color.

#### Expected Result (Pass Criteria):

- Hierarchy correctly reflects Army -> Unit -> Model.
- Individual models maintain unique IDs, base sizes, and wargear.
- Models deploy to the canvas linked by `unitId` with matching ring colors.

---

### OB-156 - Unit Coherency Graph Engine & Real-Time Warning Halos

- **Reference in tasks.md:** [tasks.md: OB-156](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-156)
- **Primary Source Code:** [coherencyEngine.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/domain/coherencyEngine.ts), [TokenRenderer.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/TokenRenderer.ts)
- **Where to find it:** Canvas tokens deployed as a unit in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:

1. In Brawl mode, deploy a multi-model unit (e.g. 5 models) to the canvas.
2. Arrange models within 2 inches of at least one other model (or two models for units of 7+).
   - Verify tokens have clean, normal rings without warning indicators.
3. Drag one model farther away (> 2 inches base-to-base):
   - Notice the out-of-coherency model immediately renders a pulsing **Orange/Red warning halo**.
   - Notice a dotted line indicates the distance to the nearest unit member.
4. Drag the model back within 2 inches:
   - Notice the warning halo disappears immediately.

#### Expected Result (Pass Criteria):

- Coherency graph calculates real-time base-to-base distances.
- Out-of-coherency models immediately display warning halos.
- Moving models back into range clears warnings seamlessly.

---

### OB-157 - Battle Round Stepper & Wargaming Phase Engine

- **Reference in tasks.md:** [tasks.md: OB-157](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-157)
- **Primary Source Code:** [phaseEngine.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/domain/phaseEngine.ts), [BrawlTopBar.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/BrawlTopBar.tsx)
- **Where to find it:** Top navigation bar in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:

1. In Brawl mode, observe the center phase stepper in the top bar: `Round 1 - Player 1 - Command Phase`.
2. Click **Next Phase (`>`)** or press Spacebar.
   - Verify the phase advances: `Movement` -> `Shooting` -> `Charge` -> `Fight`.
3. After the Fight phase, click **Next Phase**:
   - Verify turn transitions to `Player 2 - Command Phase`.
4. Cycle through Player 2's turn:
   - Verify battle advances to `Round 2 - Player 1 - Command Phase`.
5. Click the phase name to open the phase quick-jump menu and jump directly to any round/phase.

#### Expected Result (Pass Criteria):

- Stepper advances sequentially through standard wargaming phases.
- Round, active player, and phase transition accurately.
- Phase transitions broadcast announcements to table chat.

---

### OB-158 - Dual-Player Chess Clocks with Turn Countdown & Active Switching

- **Reference in tasks.md:** [tasks.md: OB-158](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-158)
- **Primary Source Code:** [chessClock.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/domain/chessClock.ts), [ChessClockWidget.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/ChessClockWidget.tsx)
- **Where to find it:** The floating Chess Clock widget in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:

1. In Brawl mode, click the Clock icon in the top bar to open the **Dual Chess Clock** widget.
2. Select time control: e.g. `1h 30m` per player.
3. Click **Start Clock**:
   - Player 1's timer begins counting down in real time.
4. Click **Switch Player (Pass Turn)**:
   - Player 1's timer pauses; Player 2's timer begins counting down immediately.
5. Click **Pause**:
   - Both timers pause cleanly.
6. Verify synchronization across two browser windows connected to the same room.

#### Expected Result (Pass Criteria):

- Dual clocks count down accurately with smooth sub-second precision.
- Passing turn switches active countdown instantaneously.
- Clocks synchronize across all connected peers in real time.

---

### OB-159 - Scoreboard & Resource Tracker (VP, CP, Casualties) with Audit Trail

- **Reference in tasks.md:** [tasks.md: OB-159](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-159)
- **Primary Source Code:** [scoreboardEngine.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/domain/scoreboardEngine.ts), [ScoreboardModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/ScoreboardModal.tsx)
- **Where to find it:** Top bar Scoreboard button (Trophy icon) in Brawl mode.

#### Step-by-Step Instructions:

1. Click the **Trophy** icon to open the Scoreboard modal.
2. Adjust Primary Victory Points (VP) for Player 1 (`+4 VP`).
3. Adjust Secondary VP and Command Points (CP) (`-1 CP for Stratagem`).
4. Switch to the **Audit Log** tab.
   - Verify every score modification is logged with a timestamp, delta, and modifier name.
5. Close the modal; verify the top bar displays current score: `P1: 4 VP | P2: 0 VP`.

#### Expected Result (Pass Criteria):

- VP and CP track cleanly with upper and lower bounds.
- Audit log records all adjustments with timestamps and player attributions.
- Top bar score displays update instantaneously.

---

### OB-160 - Objective Marker Control Zone Calculation & Auto-Scoring

- **Reference in tasks.md:** [tasks.md: OB-160](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-160)
- **Primary Source Code:** [objectiveEngine.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/domain/objectiveEngine.ts)
- **Where to find it:** Objective markers placed on the canvas in Brawl mode.

#### Step-by-Step Instructions:

1. Place an Objective Marker token on the canvas (e.g. `Objective 1`).
2. Move Player 1 models within the control zone (3 inches).
   - Observe Objective status indicator updates to: `Controlled by Player 1` (Total OC: 4).
3. Move higher OC Player 2 models into the same 3-inch zone (Total OC: 6).
   - Objective status flips to: `Controlled by Player 2`.
4. Trigger phase scoring: verify Scoreboard automatically awards control VP.

#### Expected Result (Pass Criteria):

- Control zone calculates 3-inch perimeter-to-perimeter distances.
- Objective Control (OC) correctly determines controlling player.
- Automatic scoring integrates cleanly with Scoreboard state.

---

### OB-161 - Roster Ingestion Pipeline: NewRecruit JSON & BattleScribe `.rosz`

- **Reference in tasks.md:** [tasks.md: OB-161](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-161)
- **Primary Source Code:** [rosterParser.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/domain/rosterParser.ts), [ArmyRosterFlyout.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/ArmyRosterFlyout.tsx)
- **Where to find it:** Army Roster Flyout -> **Import Roster** button.

#### Step-by-Step Instructions:

1. Open Army Roster Flyout and click **Import Roster**.
2. Drag and drop a NewRecruit JSON export or BattleScribe `.rosz` archive file.
3. Observe roster breakdown: Army Name, Faction, Detachment, Points Total, and Units.
4. Click **Confirm Import**:
   - Verify units appear populated in the roster with full model counts and wargear.

#### Expected Result (Pass Criteria):

- NewRecruit JSON and BattleScribe `.rosz` archives parse without errors.
- Extracted units, models, stats, and wargear populate the Army Roster accurately.

---

### OB-162 - Deployment Zones, Casualty Trays & Staging Submap Templates

- **Reference in tasks.md:** [tasks.md: OB-162](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-162)
- **Primary Source Code:** [stagingManager.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/domain/stagingManager.ts)
- **Where to find it:** Brawl Map Settings and Staging Tray panels.

#### Step-by-Step Instructions:

1. In Map Settings, enable **Deployment Zones & Casualty Trays**.
2. Select a deployment template (e.g., `Dawn of War` or `Search and Destroy`).
   - Verify colored deployment zone overlays render on opposite table edges.
3. During play, right-click a slain model and choose **Send to Casualty Tray**:
   - Model moves off the main battle grid into the Player's Casualty Tray submap.
4. Test **Deep Strike / Reserves**: models in staging deploy directly onto the board when reserves arrive.

#### Expected Result (Pass Criteria):

- Deployment templates render accurate zone overlays.
- Casualty trays store slain models cleanly without cluttering the main map.

---

### OB-163 - Tournament Organizer (TO) Mode, Match Privacy & Spectator Controls

- **Reference in tasks.md:** [tasks.md: OB-163](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-163)
- **Primary Source Code:** [TournamentOrganizerModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/TournamentOrganizerModal.tsx), [AppBrawl.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/AppBrawl.tsx)
- **Where to find it:** Top bar **TO / Admin** button (Gavel icon) in Brawl mode (`?mode=brawl`).

#### Step-by-Step Instructions:

1. In Brawl mode, click the **TO / Admin** button in the top bar.
2. Test Role Switching:
   - Switch role to **TO (Referee)**; enter TO Handle (e.g. `Head Judge Dave`).
   - Notice the top bar badge turns gold: `TO Mode`.
3. Test Admin Overrides:
   - Adjust Player 1 VP by `+2` with reason: `Fixed battle tactic card scoring error`.
   - Add 5 minutes to Player 1's chess clock (`+5m`).
4. Test Official Rulings:
   - Enter context and ruling text; click **Broadcast Official Ruling to Table Chat**.
5. Test Match Report Export:
   - Click **Download Match Report (JSON)** to download structured tournament summary.
   - Click **Copy Printable Match Card** to inspect formatted text summary.

#### Expected Result (Pass Criteria):

- Role switching toggles permissions and updates the header badge appropriately.
- TO score and clock overrides update match state immediately with judge announcements in chat.
- Official rulings broadcast and log permanently.
- Match export produces valid JSON and clean plaintext cards.

---

## Architectural & Documentation Deliverables

### OB-183 - Codebase Simplification & Refactoring Plan (`docs/refactor-1.md`)

- **Reference in tasks.md:** [tasks.md: OB-183](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-183)
- **Document Path:** [docs/refactor-1.md](file:///Users/tom/Projects/OldBearBattles/docs/refactor-1.md)

#### Step-by-Step Instructions:

1. Open [docs/refactor-1.md](file:///Users/tom/Projects/OldBearBattles/docs/refactor-1.md).
2. Verify that all 8 architectural refactoring tasks (REF-001 through REF-008) are cataloged with schemas, migration plans, and affected files.

#### Expected Result (Pass Criteria):

- Document exists, is syntactically valid markdown, and provides comprehensive plans for all 8 refactorings.

---

### OB-184 - HelpTip Component & Placement Guide (`docs/helptip-locations.md`)

- **Reference in tasks.md:** [tasks.md: OB-184](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-184)
- **Document Path:** [docs/helptip-locations.md](file:///Users/tom/Projects/OldBearBattles/docs/helptip-locations.md)
- **Component Path:** [HelpTip.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/HelpTip.tsx)

#### Step-by-Step Instructions:

1. Open [docs/helptip-locations.md](file:///Users/tom/Projects/OldBearBattles/docs/helptip-locations.md).
2. Verify that 9 core application surfaces are audited with exact `title`, `placement`, `shortcut`, and `copy`.

#### Expected Result (Pass Criteria):

- Document exists, provides complete copy and placement guidance, and aligns with `<HelpTip />`.

---

### OB-185 - Backlog Research & Implementation Guide (`docs/backlog-implementation-guide.md`)

- **Reference in tasks.md:** [tasks.md: OB-185](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-185)
- **Document Path:** [docs/backlog-implementation-guide.md](file:///Users/tom/Projects/OldBearBattles/docs/backlog-implementation-guide.md)

#### Step-by-Step Instructions:

1. Open [docs/backlog-implementation-guide.md](file:///Users/tom/Projects/OldBearBattles/docs/backlog-implementation-guide.md).
2. Verify technical architecture coverage for all key backlog tracks (WebRTC video mesh, Discord integrations, D&D Beyond auth, system-agnostic manifests, PF2e mechanics, and mobile ergonomics).

#### Expected Result (Pass Criteria):

- Document exists and provides complete architectural blueprints, code snippets, schemas, and risk analyses for all 7 major technical research tracks.

---

### OB-197 - Brawl Mode Top Bar and Bidirectional Mode Switching

- **Reference in tasks.md:** [tasks.md: OB-197](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-197)
- **Primary Source Code:** [App.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/App.tsx), [AppBrawl.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/AppBrawl.tsx), [BrawlTopBar.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/BrawlTopBar.tsx), [MobileDrawer.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/MobileDrawer.tsx), [index.css](file:///Users/tom/Projects/OldBearBattles/packages/client/src/index.css)
- **Where to find it:** Top navigation bar in both VTT and Brawl modes, mobile drawer navigation menu, and URL query parameters (`?mode=vtt` / `?mode=brawl`).

#### Step-by-Step Instructions:

1. **Verify Switching to Brawl Mode:**
   - Open the web application (e.g. `http://localhost:3101` or `http://localhost:5173`).
   - In VTT mode, look at the top navigation bar.
   - Click the **Brawl** switch button (with swords icon).
   - Observe that the page transitions into Brawl mode (`?mode=brawl`).

2. **Verify Brawl Top Bar Visibility & Controls:**
   - Verify that the **Old Bear Brawl** top bar is clearly visible, floating cleanly at the top of the screen (`floating-hud glass-panel`).
   - Verify that the top bar displays:
     - Hamburger menu button.
     - Brand title: `Old Bear Brawl` with `WARGAME` badge.
     - Switch button: **🐻 VTT**.
     - Scene info: `Scene: Default Table` (or current map name).
     - Round & Phase Stepper (e.g. `Round 1 | Command >`).
     - Chess Clock Indicator (e.g. `P1: 90:00 / P2: 90:00`).
     - Right-side action buttons: `VP: 0 - 0`, `Objectives`, `Deployment`, `TO / Admin`, `Army`, and player avatars.

3. **Verify Switching Back to VTT Mode via Top Bar:**
   - While in Brawl mode, click the **🐻 VTT** button in the top bar.
   - Verify that the page reloads back into VTT mode.
   - Reload the page without any query parameter (`http://localhost:3101/`).
   - Verify that it stays in VTT mode because `localStorage.getItem('oldbear_mode')` was properly updated to `'vtt'`.

4. **Verify Manual URL Query Mode Persistence:**
   - In the browser URL bar, type `?mode=brawl` and hit enter.
   - Verify Brawl mode loads and the top bar is displayed.
   - In the URL bar, remove the query parameter (or change to `?mode=vtt`) and hit enter.
   - Verify VTT mode loads and stays persisted in `localStorage`.

5. **Verify Mobile Drawer Mode Switch:**
   - Click the menu / hamburger button in either mode to open the drawer.
   - Verify there is a full-width switch mode button (`Switch to Brawl Mode ⚔️` / `Switch to VTT Mode 🐻`) near the bottom of the drawer.
   - Click it and verify seamless mode switching.

#### Expected Result (Pass Criteria):
- The Brawl mode top bar is prominently visible and completely styled as a floating HUD above the canvas.
- Mode switching works bidirectionally (VTT to Brawl and Brawl to VTT).
- The selected mode correctly persists in `localStorage` so users are never trapped in a mode.

---

### OB-187 - Submap & Deployment Zone Customization UI

- **Reference in tasks.md:** [tasks.md: OB-187](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-187)
- **Primary Source Code:** [SubmapEditorDrawer.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/SubmapEditorDrawer.tsx), [MapSettingsModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/MapSettingsModal.tsx), [SubmapManager.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/SubmapManager.ts)
- **Where to find it:** Scene Settings Modal (`MapSettingsModal` via Top Bar Scene Settings or Map Manager) -> "Secondary Submaps & Regions" section.

#### Step-by-Step Instructions:

1. **Open Scene Settings:**
   - In either VTT or Brawl mode, click the gear/settings icon for the active scene (or open Map Manager and click the edit settings icon for any map).
   - Scroll down to the **Secondary Submaps & Regions** section.

2. **Add a Submap Preset:**
   - Click one of the preset buttons: `+ Floor`, `+ Dungeon`, `+ Deployment Zone`, `+ Casualty Tray`, or `+ Staging Area`.
   - Observe that the submap is added and its property editor drawer automatically expands.

3. **Verify Header Summary & Expand / Collapse:**
   - Verify the header row displays the color dot indicator, submap name, type badge (e.g. `Deployment Zone`), dimensions in px & cells, and expand/collapse chevron button.
   - Click the header row or chevron button to collapse the editor, then click again to expand.

4. **Edit Submap Identity:**
   - Change the **Submap Name** (e.g., `Red Attacker Front`).
   - Change the **Badge Label (On Canvas)** (e.g., `Red Front`).
   - Change the **Area Type** dropdown (e.g., `Wargaming Deployment Zone`).
   - Verify the header summary updates in real time.

5. **Adjust Position & Canvas Offsets:**
   - Try the quick alignment buttons:
     - Click **Right of Map**: verify X offset shifts to the right of parent map (`parentWidth + 80`), Y becomes 0.
     - Click **Left of Map**: verify X offset shifts to the left (`-(width + 80)`).
     - Click **Below Map**: verify Y offset shifts below parent map (`parentHeight + 80`).
     - Click **Top Edge**: verify X = 0, Y = 0.
     - Click **Bottom Edge**: verify X = 0, Y = parentHeight - height.
   - Manually type custom values in **Offset X** and **Offset Y** number inputs.

6. **Adjust Dimensions in Pixels and Grid Cells:**
   - Enter a new **Width (px)** or **Width (cells)**: verify that editing cells recalculates pixels and vice-versa based on the scene grid size.
   - Enter a new **Height (px)** or **Height (cells)**.
   - Click **Snap to Grid**: verify dimensions snap to clean multiples of the grid cell size.
   - Click **Full Width**: verify submap width matches parent map width.

7. **Customize Color & Border Styling:**
   - In **Border Outline / Badge Color**, click different preset swatches (e.g. Red `#ef4444`, Green `#10b981`, Purple `#8b5cf6`).
   - Verify the border swatch, dot indicator, and custom hex input update.
   - Use the native color picker to select a custom color.
   - In **Background Fill / Tint**, click preset swatches (e.g. Transparent, Dark Slate, Red Tint `rgba(239, 68, 68, 0.18)`).
   - Enter a custom hex or rgba value in the background input.

8. **Attach Background Battlemap / Floor Plan Image:**
   - Enter a valid image URL in the **Image URL** field (or click **Upload File** to choose an image file from disk).
   - Verify a thumbnail preview appears with the image name/URL and a **Clear** button.
   - Click **Clear** to remove the image.
   - If previous map assets exist in IndexedDB, test selecting an asset from the **Choose from Saved Assets...** dropdown.

9. **Verify Grid Overlay Toggle:**
   - Toggle the **Show Grid Overlay** checkbox on/off.
   - Adjust the custom **Grid Size** (e.g. change 50 to 70px).

10. **Save and Canvas Verification:**
    - Click **Save Changes** in the modal.
    - Inspect the 2D canvas: verify the submap appears at the configured position (X, Y) with the specified dimensions, border color, background tint or floor plan image, and canvas identification badge.
    - Re-open Scene Settings: verify all edited submap properties were preserved.

#### Expected Result (Pass Criteria):
- Submap property editor provides expandable drawers with controls for position, dimensions (px & cells), border/badge colors, background fill/tint, custom battlemap images, and grid settings.
- All properties update smoothly and persist across scene saves and template duplications.

---

### OB-188 - Relative Dragging for Tokens, Modular Tiles, and Props

- **Reference in tasks.md:** [tasks.md: OB-188](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-188)
- **Primary Source Code:** [CanvasEngine.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/CanvasEngine.ts), [CanvasEngine.test.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/CanvasEngine.test.ts)
- **Where to find it:** Main Battlemap Canvas (dragging any token, modular room tile, or prop).

#### Step-by-Step Instructions:

1. **Standard 1x1 Token Off-Center Drag:**
   - Select and click on an edge or off-center portion of a standard 1x1 token (e.g. upper-left corner).
   - Begin dragging the cursor slowly across the canvas.
   - Verify the token does **not** abruptly jump or snap its center directly under the cursor; it moves smoothly relative to the exact point grabbed.
   - When grid snapping is active, verify the token snaps cleanly to grid cells as you drag across cell boundaries.

2. **Large Multi-Tile Prop / Modular Room Drag:**
   - Deploy or select a large modular tile or prop (e.g. an 8x8 chamber or 4x2 corridor from the Tile/Prop picker).
   - Click and hold near the bottom-right corner of the large tile.
   - Move the mouse cursor.
   - Verify the large room tile stays relative to the cursor grab point and does **not** violently jump hundreds of pixels to center itself under your mouse.

3. **Multi-Token Group Drag Relative Offsets:**
   - Use the box select tool (`B` hotkey) or shift-click to select multiple tokens spread across the battlefield.
   - Grab one of the selected tokens and drag it across the map.
   - Verify that all tokens in the group move together, preserving their exact relative spatial distances and offsets from each other.

4. **Magnetic Edge-to-Edge Snapping:**
   - Drag a modular tile close to another existing tile.
   - Verify magnetic edge snapping engages cleanly when edges come within snapping distance.

#### Expected Result (Pass Criteria):
- Dragging tokens, modular tiles, and props is relative to the initial cursor grab point without sudden pivot or center jumps.
- Multi-token group dragging maintains exact relative positions for all selected entities.

---

### OB-189 - Modular Tiles Custom Size Editing, Quick Dimension Chips, & Viewport Centering on Random Draw

- **Reference in tasks.md:** [tasks.md: OB-189](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-189)
- **Primary Source Code:** [DataBackupModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/DataBackupModal.tsx), [CanvasEngine.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/CanvasEngine.ts), [TokenEditorModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenEditorModal.tsx)
- **Where to find it:** Main Menu > **Saved Props & Tiles** modal (Tiles tab) and Canvas Modular Tile Drawer / Random Draw.

#### Step-by-Step Instructions:

1. **Open Saved Props & Tiles Modal:**
   - Click the hamburger menu in the top left and select **Saved Props & Tiles** (or click the Tiles icon in the toolbar).
   - Switch to the **Tiles** tab.

2. **Verify Custom Size Controls on Uploaded Modular Tiles:**
   - Locate an uploaded or preset modular tile card.
   - Verify that width and height numerical inputs (in grid units) are displayed on the tile card.
   - Verify quick dimension chips are present: **1×1**, **2×2**, **4×2**, **4×4**, **8×8**.
   - Click the **4×2** chip or manually enter `6` for width and `3` for height.
   - Verify the tile preview card dimensions and metadata immediately update and save.

3. **Verify Canvas Placement with Custom Dimensions:**
   - Click the tile or drag/deploy it onto the battlemap canvas.
   - Verify the tile renders at the custom width/height (e.g. 6×3 grid cells) rather than a default size.
   - Right-click / edit the placed tile: verify the Token/Tile Editor modal allows editing map-layer tile properties without restrictions.

4. **Verify Viewport Auto-Centering on Random Tile Draw:**
   - In the Tiles drawer / picker, click the **Draw Random Tile** button (or deploy a random tile).
   - Verify the canvas viewport smoothly centers directly on the coordinates where the new random tile spawned, ensuring it is immediately visible even on large scenes.

#### Expected Result (Pass Criteria):
- Uploaded modular tiles support custom width/height editing with quick dimension preset chips (`1×1`, `2×2`, `4×2`, `4×4`, `8×8`).
- Placed tiles respect edited dimensions, and random tile generation automatically centers the camera viewport on the newly spawned tile.

---

### OB-191 - No Ring Color Default for Props and Tiles

- **Reference in tasks.md:** [tasks.md: OB-191](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-191)
- **Primary Source Code:** [ModularTileManager.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/ModularTileManager.ts), [TokenRenderer.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/TokenRenderer.ts), [TokenEditorModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenEditorModal.tsx), [DataBackupModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/DataBackupModal.tsx), [GlobalDropOverlay.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/GlobalDropOverlay.tsx)
- **Where to find it:** Main Battlemap Canvas (props and modular room tiles) and Token/Tile Editor modal.

#### Step-by-Step Instructions:

1. **Deploy Modular Tile or Prop from Asset Drawer / Presets:**
   - Open the **Saved Props & Tiles** modal or drawer.
   - Deploy or drop any modular tile or prop onto the canvas.
   - Inspect the placed tile/prop on the canvas: verify that it renders without an artificial colored border/ring outline (e.g. no blue or cyan ring around the borders).
   - Verify the image seamlessly blends directly into the canvas.

2. **Verify Token/Tile Editor Modal Ring Color:**
   - Select the placed tile or prop and click the **Settings** gear to open the Token/Tile Editor modal.
   - Inspect the **Ring Color** palette: verify the selected swatch is **Transparent (No Ring)** by default.
   - Select a colored ring swatch (e.g. Red or Green) and click **Save Changes**: verify the tile/prop now renders with the chosen colored border.
   - Re-open the editor, click **Transparent (No Ring)**, and save: verify the colored ring outline is cleanly removed.

3. **Verify Convert Token to Prop:**
   - Create a standard creature token (which defaults to a colored player/creature ring).
   - Open its Token Editor modal and check **Treat as Map Prop (no health bar)**.
   - Verify the ring color automatically switches to **Transparent (No Ring)** unless the user explicitly selected a custom ring color.

#### Expected Result (Pass Criteria):
- Newly spawned modular tiles, room tiles, and props default to `transparent` (no ring outline).
- Existing custom rings remain configurable in the Token/Tile Editor modal with full toggle support.

---

### OB-192 - Custom Status Creation, Editing, & Token Controls Integration

- **Reference in tasks.md:** [tasks.md: OB-192](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-192)
- **Primary Source Code:** [StatusManager.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/status/StatusManager.ts), [CustomStatusModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/CustomStatusModal.tsx), [TokenControls.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenControls.tsx), [TokenEditorModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenEditorModal.tsx), [MapSettingsModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/MapSettingsModal.tsx)
- **Where to find it:** Floating Token HUD (`+ Add Status...` dropdown & Sparkles icon), Full Token Settings (`Conditions & Statuses` section), and Scene Settings (`Custom Statuses & Conditions` section).

#### Step-by-Step Instructions:

1. **Verify Complete Built-in Status List:**
   - Select any token on the canvas to open the floating Token Controls HUD.
   - Click the **+ Add Status...** dropdown.
   - Verify all standard conditions (Blinded, Charmed, Deafened, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious, Concentrating, Exhaustion, Dying, Bleeding) are present and sorted alphabetically.
   - Select **Bleeding** or **Dying**: verify the condition is added to the token with its initial counter value (e.g. `Bleeding:3` or `Dying:1`) and rendered in its designated status color badge.

2. **Open Custom Status Manager via Token HUD:**
   - Click the **Sparkles** icon button next to the `+ Add Status...` dropdown (or select `✨ Create / Manage Custom Statuses...` from the dropdown).
   - Verify the **Status & Condition Definitions** modal opens.
   - Verify it shows the list of all active statuses with color badges, descriptions, counters, and scope tags ("Built-in", "Global Custom", "Scene Overrides").

3. **Create a Global Custom Status:**
   - In the modal, click **+ New Status**.
   - Enter:
     - Label: `Blessed`
     - Color: Pick yellow / gold swatch (`#eab308`)
     - Description: `Grants +1d4 to attack rolls and saves`
     - Storage Scope: `Global (All scenes)`
   - Click **Save Status Definition**.
   - Verify `Blessed` now appears in the status list with a "Global Custom" tag and a delete button.
   - Close the modal and inspect the Token HUD `+ Add Status...` dropdown: verify `Blessed` is now available in the dropdown!
   - Apply `Blessed` to the token: verify it renders a gold badge on the token controls and on the canvas token badge.

4. **Create a Scene-Specific Custom Status:**
   - Open the **Status & Condition Definitions** modal again.
   - Click **+ New Status**.
   - Enter:
     - Label: `Burning`
     - Color: Orange / Red (`#f97316`)
     - Check **Has Numeric Counter / Stacks**: Start `3`, Step per Turn `-1`, Min `0`
     - Turn Triggers: Auto-Clear `Start of Turn`, Counter Update `Start of Turn`
     - Storage Scope: `Scene Specific (<Scene Name>)`
   - Click **Save Status Definition**.
   - Verify `Burning` displays with a "Scene: <Scene Name>" tag.
   - Apply to token: verify it applies as `Burning:3`.

5. **Verify Scene Settings Modal Integration:**
   - Open Scene Settings (via Map Manager or scene controls).
   - Verify the **Custom Statuses & Conditions** section is present with a **Manage Statuses (<count> overrides)** button.
   - Click the button: verify the same manager modal opens scoped to the current scene.

6. **Delete a Custom Status:**
   - In the modal, locate `Blessed` or `Burning` and click the red trash can icon.
   - Verify the custom status is cleanly deleted and removed from the active status list and token dropdowns.

#### Expected Result (Pass Criteria):
- Token controls and token editor dynamically load all built-in, global, and scene-level custom statuses.
- Users can create, customize, and delete custom statuses with custom colors, descriptions, numeric counters, and turn lifecycle triggers.
- Custom statuses are cleanly persisted and immediately usable on tokens across the canvas.

---

### OB-193 - Choose Existing and Preset Images in Token Editor

- **Reference in tasks.md:** [tasks.md: OB-193](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-193)
- **Primary Source Code:** [TokenEditorModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenEditorModal.tsx), [TokenImageBrowserModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenImageBrowserModal.tsx), [TokenPickerModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenPickerModal.tsx)
- **Where to find it:** Full Token Settings (`Settings` gear icon) > **Token Preview & Crop** image controls.

#### Step-by-Step Instructions:

1. **Open Token Editor on Existing Token:**
   - Select any existing token on the canvas (whether with an image or initials avatar).
   - In the floating token controls, click the **Settings** gear icon (`Full Token Settings`).
   - Locate the **Token Preview & Crop** area.

2. **Verify "Choose Existing..." Action:**
   - Verify that next to the **Upload Image** button, a new **Choose Existing...** button with a sparkles icon is displayed.
   - Click **Choose Existing...**.
   - Verify the **Choose Token Image** modal opens with two tabs: **Preset Tokens** and **Saved Library**.

3. **Browse and Select a Preset Token:**
   - On the **Preset Tokens** tab, type a search query in the search box (e.g. `Anime` or `Mask`).
   - Verify the preset gallery filters in real-time.
   - Click on any preset token card.
   - Verify the modal closes and the Token Editor crop canvas immediately displays the selected preset portrait.
   - Drag to pan or use mouse wheel to zoom: verify crop positioning works flawlessly with the newly selected image.

4. **Browse and Select a Saved Library Token/Prop:**
   - Click **Choose Existing...** again.
   - Switch to the **Saved Library** tab.
   - Verify previously uploaded tokens, props, and assets from IndexedDB are displayed in the gallery.
   - Click on any saved asset: verify it loads into the editor crop preview immediately.

5. **Verify "Remove Image" Action:**
   - While an image is loaded, verify the red **Remove** trash can button appears next to "Choose Existing...".
   - Click the **Remove** button.
   - Verify the image is cleared and the crop canvas falls back to rendering the clean initials avatar.
   - Click **Save Changes** and verify the token on the canvas updates accordingly.

#### Expected Result (Pass Criteria):
- Users can switch an existing token's image to any preset token or previously saved asset from their IndexedDB library without re-uploading.
- Interactive cropping, zoom, pan, and removal are fully supported.

---

### OB-195 - Preset Token Zoom and Offset Framing in TokenPickerModal

- **Reference in tasks.md:** [tasks.md: OB-195](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-195)
- **Primary Source Code:** [TokenPickerModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenPickerModal.tsx), [AppVtt.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/AppVtt.tsx)
- **Where to find it:** Left dock **Add Token or Prop** button (`+` user icon).

#### Step-by-Step Instructions:

1. **Open Token Picker Modal:**
   - In VTT mode, click the **Add Token or Prop** button on the bottom left dock toolbar.
   - Verify the **Add Token or Prop** modal opens showing the **Tokens** tab.

2. **Inspect Preset Portraits Framing:**
   - Scroll through the **Preset Portraits** gallery (e.g. `Knight Warrior`, `Elven Wizard`, `Orc Berserker`, `Dragon Wyrmling`, `Mask of human face...`).
   - Notice how portraits are framed inside their round preview thumbnails: faces and masks are scaled up and centered without awkward neck cutoffs or excessive background headroom.

3. **Verify Selected Preview Zoom & Offset:**
   - Click on `Knight Warrior`.
   - Verify the top preview circle displays the knight portrait with zoomed and centered framing matching the preset's calibrated zoom and offset.
   - Click on other presets (e.g., `Orc Berserker`, `Elven Wizard`) and verify the preview dynamically reflects their calibrated framing.

4. **Verify Spawned Token on Canvas:**
   - With a framed preset selected (such as `Knight Warrior`), click **Create & Add to Map** (or double-click the preset portrait).
   - Once spawned onto the map, inspect the token circular portrait on the HTML5 canvas:
     - Verify it renders with the calibrated `clipZoom`, `clipPanX`, and `clipPanY` offsets instead of defaulting to unscaled/unframed bounds.
   - Select the token and click the **Settings** gear icon:
     - Verify the Token Editor crop canvas opens with the zoom slider and pan position pre-set to the preset's zoom and offset values.

#### Expected Result (Pass Criteria):
- Preset tokens retain calibrated zoom and vertical/horizontal offset framing in thumbnail chips, the selection preview box, and when placed onto the active game map.

---

### OB-196 - Move Chat Button to Left Sidebar Below Measuring Tape

- **Reference in tasks.md:** [tasks.md: OB-196](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-196)
- **Primary Source Code:** [ToolBar.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ToolBar.tsx), [AppVtt.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/AppVtt.tsx), [AppBrawl.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/AppBrawl.tsx)
- **Where to find it:** Left floating toolbar (sidebar).

#### Step-by-Step Instructions:

1. **Locate Left Sidebar Floating Toolbar:**
   - In both VTT mode and Brawl mode, observe the vertical floating toolbar on the left side of the screen.
   - Locate the **Measuring Tape** icon (`Ruler`, shortcut `M`).

2. **Verify Chat Icon Position:**
   - Verify that directly below the **Measuring Tape** icon, a **Chat** icon button (`MessageSquare`) is rendered.

3. **Verify Chat Toggle Action:**
   - Click the Chat button on the left sidebar:
     - Verify the Chat window opens (floating draggable window).
     - Verify the Chat button shows an active highlight state.
   - Click the Chat button again:
     - Verify the Chat window closes.

4. **Verify Unread Chat Notification Badge:**
   - Have another player send a message or simulate an incoming message while the Chat window is closed:
     - Verify an unread badge counter appears at the top-right corner of the Chat button in the left sidebar.
   - Click the Chat button to open chat:
     - Verify the unread badge is cleared.

#### Expected Result (Pass Criteria):
- The chat toggle button is positioned on the left sidebar floating toolbar directly below the measuring tape icon.
- Clicking the button toggles chat visibility and reflects active state and unread message count.

---

### OB-199 - Single-Layer Sequential Fog of War and Interactive Brush

- **Reference in tasks.md:** [tasks.md: OB-199](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-199)
- **Primary Source Code:** [FogRenderer.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/FogRenderer.ts), [CanvasEngine.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/CanvasEngine.ts), [ToolBar.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ToolBar.tsx), [AppVtt.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/AppVtt.tsx)
- **Where to find it:** Left floating toolbar > **Fog of War Controls** button (Cloud/Eye icon) and bottom toolbar Brush Size widget.

#### Step-by-Step Instructions:

1. **Verify Fog Sub-Menu Controls:**
   - As GM in VTT mode, click the **Fog of War Controls** button on the left sidebar.
   - Verify the flyout menu lists:
     - **Rect Reveal (Shift+F)**
     - **Rect Hide (F)**
     - **Brush Reveal** (circular brush icon)
     - **Brush Hide** (circular brush icon)
     - **Brush Size** slider and indicator
     - **Cover All Fog**
     - **Clear All Fog**

2. **Verify Single-Layer Sequential Reveal & Hide:**
   - Click **Cover All Fog** so the map is shrouded in darkness.
   - Select **Rect Reveal** and drag a rectangular region over the center of the map: verify the region becomes clear.
   - Select **Rect Hide** and drag a smaller rectangle covering half of the revealed region: verify fog is painted back over that half.
   - Now select **Rect Reveal** and drag a small box inside the newly re-hidden area:
     - Verify the small box is immediately revealed and visible! (Previously, reveal operations were evaluated before hide operations in separate passes, making it impossible to re-reveal previously hidden areas).
   - Verify that sequential reveal and hide operations layer cleanly without ghost fog layers.

3. **Verify Circular Brush Reveal and Hide:**
   - Open the Fog menu and select **Brush Reveal**.
   - Hover your mouse over the canvas: verify a circular dashed ring outlines the current brush diameter under your cursor.
   - Click and drag across the fogged map:
     - Verify a smooth, continuous circular stroke reveals the map along the cursor path.
   - Open the Fog menu and select **Brush Hide**:
     - Drag across a revealed area: verify smooth fog is painted back on along the circular stroke path.

4. **Verify Dynamic Brush Resizing via Toolbar Drag and Slider:**
   - Locate the circular brush size widget positioned directly above the user color circle on the left toolbar.
   - Click and drag upward on the widget: verify the brush radius increases (e.g. from 40px to 80px), the inner dot expands, and the pixel readout updates.
   - Drag downward: verify the radius smoothly decreases.
   - Also test adjusting the slider inside the Fog menu.

5. **Verify Hotkey Resizing:**
   - Move mouse cursor over the canvas while in Fog Brush mode.
   - Press `[` or `-` or `,`: verify brush radius decreases by 5px and the cursor ring contracts.
   - Press `]` or `=` or `.`: verify brush radius increases by 5px and the cursor ring expands.

#### Expected Result (Pass Criteria):
- Fog of War operates on a single unified raster layer where reveal and hide shapes are evaluated in chronological order, allowing infinite alternating reveals and hides.
- Circular brush reveal and hide tools are available alongside rectangular tools.
- Brush size is easily adjustable via hotkeys, the flyout slider, and the draggable left toolbar widget.

---

### OB-203 - Make Draggable Windows Resizable on Desktop (Chat Panel & Floating Windows)

#### Pre-requisites:
- Run `npm run dev` and open the VTT client in a desktop browser window (viewport width > 768px).

#### Steps:
1. **Open Table Chat:**
   - Click the chat icon on the left floating toolbar (or press \` if enabled).
   - Verify the chat window opens at its initial size (380px wide by 440px high).

2. **Verify Desktop Corner Resize Handle:**
   - Look at the bottom-right corner of the Chat & Dice window.
   - Confirm a subtle 3-stripe diagonal grip handle is visible.
   - Hover over the corner handle: verify the cursor changes to `nwse-resize` and the handle brightens.

3. **Drag-to-Resize Chat Window:**
   - Click and drag the corner resize handle diagonally outward.
   - Verify the window width and height expand fluidly without lag.
   - Verify minimum size clamping: drag inward to the minimum (width 280px, height 220px) and verify the window does not collapse smaller than the minimum dimensions.
   - Verify maximum boundary clamping: drag outward beyond the browser viewport and verify it stays bounded within the viewport.

4. **Verify Native CSS Resize & Persistence:**
   - Drag to resize the chat window to a distinctive custom dimension (e.g., ~500px wide, 550px high).
   - Refresh the browser tab or close and reopen the chat panel.
   - Verify the chat panel remembers and restores the custom width and height from localStorage.

5. **Verify Minimize Behavior:**
   - Click the minimize chevron in the title bar.
   - Verify the window collapses cleanly to the title bar height without overflowing or breaking layout.
   - Re-expand: verify it restores to the previously resized dimensions.

#### Expected Result (Pass Criteria):
- Floating draggable windows, especially chat, can be resized via the bottom-right handle and desktop CSS resize.
- Window size constraints (min/max) are respected and persisted in localStorage across page reloads.

---

### OB-208 - Update Open5EFetcher to Use v2 API

#### Pre-requisites:
- Run `npm run dev` and open the VTT client in a browser tab.

#### Steps:
1. **Open Table Chat:**
   - Click the chat icon on the left floating toolbar.

2. **Query 5e Spell Reference Card (Open5e v2):**
   - In the chat text box, type `/spell? fireball` and press Enter.
   - Verify an ephemeral reference card appears in chat for **Fireball**.
   - Check that Level 3, School (Evocation), range, and casting time are correctly displayed.

3. **Query 5e Creature / Monster Statblock (Open5e v2 creatures):**
   - In chat, type `/monster? goblin` and press Enter.
   - Verify an ephemeral reference card appears with AC 15, HP 7, 30 ft. speed, ability scores, Scimitar/Shortbow attacks, and Nimble Escape.

4. **Query 5e Magic Item Reference Card (Open5e v2 magicitems):**
   - In chat, type `/item? potion of healing` and press Enter.
   - Verify the reference card appears with Common Potion traits and recovery details.

#### Expected Result (Pass Criteria):
- Open5EFetcher queries `https://api.open5e.com/v2/` endpoints (`spells`, `creatures`, `magicitems`, `items`, `weapons`, `armor`) with graceful v1 fallback.
- Reference statblocks parse nested v2 object shapes correctly.

---

### OB-212 - Compendium Source Filter & System Variants (2014 vs 2024, PF2, SF2, PF1, SF1)

#### Pre-requisites:
- Run `npm run dev` and open the VTT client in a browser tab.

#### Steps:
1. **Open Table Chat:**
   - Click the chat icon on the left floating toolbar.

2. **Query 2024 vs 2014 Ruleset Variants:**
   - In chat, type `/spell? 2024 magic missile` and press Enter.
   - Verify the spell card appears with the `• 2024 Rules` tag or description.
   - In chat, type `/spell? 2014 magic missile` (or `/spell? [2014] magic missile`).
   - Verify the card appears with the `• 2014 Rules` tag or description.

3. **Query Pathfinder 2e Variant:**
   - In chat, type `/spell? pf2 heal` (or `/spell? [pf2] heal`).
   - Verify the spell card loads from the PF2e compendium with 3-action economy glyphs (`[1A]`, `[2A]`, `[3A]`).

4. **Verify Stubbed Backends Graceful Notice (PF1, SF1, SF2):**
   - In chat, type `/spell? pf1 magic missile`.
   - Verify an informational notice appears: `ℹ️ Pathfinder 1e (OGL 3.5) backend compendium API is currently in development...` without throwing errors or crashing.
   - In chat, type `/item? sf1 laser rifle`.
   - Verify an informational notice appears explaining Starfinder 1e compendium is in development.
   - In chat, type `/attack? sf2 plasma cannon`.
   - Verify an informational notice appears explaining Starfinder 2e compendium is in development.

5. **Verify Default Resolution (No System Specified):**
   - In chat, type `/spell? fireball`.
   - Verify it checks the active character sheet first, then queries the general compendium database (5e), with PF2e fallback.

#### Expected Result (Pass Criteria):
- Info commands (`/spell?`, `/item?`, `/monster?`, `/attack?`) support prefix tags (`[2024]`, `pf2:`, `-s 2024`, `2024 fireball`).
- 2014 vs 2024 SRD documents are correctly targeted.
- Stubbed backends (PF1, SF1, SF2) fail gracefully with informative notifications.

---

### OB-213 - D&D Beyond URL Input Left Empty for Newly Created / Unbound Tokens

#### Pre-requisites:
- Run `npm run dev` and open the VTT client in a browser tab.

#### Steps:
1. **Spawn a New Token:**
   - Click the Token Picker icon (the pawn icon) on the left floating toolbar.
   - Choose a preset avatar or upload a token image, enter a name (e.g. "Goblin Scout"), and click **Add Token to Map**.
   - Verify the token appears on the canvas and is currently selected.

2. **Open Character Sheet Window:**
   - Press `c` on your keyboard (or click the Character Sheet icon).
   - In the Character Sheet drawer, look at the **Link Online Character** / D&D Beyond input box (`Character ID or URL (or 'demo')`).

3. **Verify D&D Beyond Input is Empty:**
   - Confirm the input text box is completely blank (shows placeholder `Character ID or URL (or 'demo')`).
   - Confirm that no internal token ID, monster ID, or UUID (e.g. `token-...`, `char-...`) is erroneously pre-populated in the input box.

4. **Verify Authentic D&D Beyond URL Prefilling:**
   - In the input box, type `47804290` and click the sync/fetch button (or select a saved character synced with D&D Beyond).
   - Verify that authentic numeric IDs or D&D Beyond URLs properly format to `https://www.dndbeyond.com/characters/47804290`.

#### Expected Result (Pass Criteria):
- Creating a token and inspecting its character sheet leaves the D&D Beyond URL input field clean and empty.
- Internal token IDs and non-D&D Beyond identifiers never leak into the online character URL field.

---

### OB-214 - Save Custom Characters and Tokens to Local Database

- **Reference in tasks.md:** [tasks.md: OB-214](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-214)
- **Primary Source Code:** [CharacterFlyout.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/components/CharacterFlyout.tsx), [characterStorage.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/storage/characterStorage.ts)
- **Where to find it:** Character Sheet Flyout / Draggable Window (`c` key or Character icon on toolbar).

#### Step-by-Step Instructions:

1. **Save Loaded Character to Database:**
   - Open the Character Sheet (`c` key or Character icon on the toolbar).
   - Load or import a character (e.g. click "Click here to test with Demo Character").
   - In the Profile Overview header (next to the character name and class), verify the **Save to Database** button is present with a disk/save icon.
   - Click **Save to Database**: verify a green feedback badge appears reading `Saved [Character Name] to database!`.
   - Also check the bottom footer of the Character Sheet window: verify a **Save** button is present next to the **Sync with Token** button.
   - Close and re-open the character sheet with no token selected: verify the saved character appears in the **SELECT FROM SAVED CHARACTERS** list.

2. **Save Unbound / Custom Token as Custom Character:**
   - On the battlemap, spawn or select an unbound token that does not have a linked character sheet (e.g. a placed monster or generic fighter token).
   - Open the Character Sheet (`c` key).
   - In the manual HP tracking card, verify the **Save as Custom Character** button is present.
   - Click **Save as Custom Character**: verify a success alert appears, the token's HP, AC, speed, and any standalone attacks are saved into a new `DnDCharacter` in the local database.
   - Verify the Character Sheet immediately switches to the full character view displaying the newly saved character.

#### Expected Result (Pass Criteria):
- Characters currently opened in the character sheet can be saved directly to the database via explicit **Save to Database** buttons in both the header and footer.
- Unbound tokens with HP and actions can be converted and saved directly as custom characters in the database via **Save as Custom Character**.

---

### OB-216 - Add to Character on Item Cards Adds Action/Attack & Inventory to Character Sheet

- **Reference in tasks.md:** [tasks.md: OB-216](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-216)
- **Primary Source Code:** [ChatPanel.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ChatPanel.tsx), [StatBlockCard.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/StatBlockCard.tsx), [CharacterFlyout.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/components/CharacterFlyout.tsx)
- **Where to find it:** Chat Panel (`Enter` or `~` or chat icon), compendium search cards (`/item?`), and Character Sheet Flyout (`c` key).

#### Step-by-Step Instructions:

1. **Query an Item in Chat:**
   - Open Chat (`Enter` or click the chat bubble icon on toolbar).
   - In the input prompt, type `/item? longsword` or `/item? flame tongue` and send.
   - Verify the compendium result card renders in chat with item details, damage, and action buttons: `+ Add to Sheet` and `Attack / Roll`.

2. **Add Item to Character Sheet:**
   - With an active character loaded (e.g. Demo Character) or target token selected, click **+ Add to Sheet**.
   - Verify an ephemeral confirmation message appears: `✅ Added item Longsword and attack to [Character Name]'s character sheet.`
   - Open the Character Sheet (`c` key).
   - Inspect the **ACTIONS** section: verify a new attack action for the item (e.g. `Longsword` or `Flame Tongue`) appears with damage formula and type.
   - Inspect the **INVENTORY & ITEMS** section: verify the item appears in the inventory list with description and quantity.

3. **Add Item to Unbound Token:**
   - Select an unbound token on the canvas (without a bound sheet).
   - Query `/item? dagger` in chat and click **+ Add to Sheet**.
   - Verify confirmation: `✅ Added Dagger attack to [Token Name]'s token attacks and inventory.`
   - Open token attacks or Character Sheet for the token: verify the dagger attack appears in the token's attacks.

#### Expected Result (Pass Criteria):
- Clicking `+ Add to Sheet` on an item card reliably adds both the attack/ability to the character's actions and the item record to inventory.
- Character sheet displays the new action under ACTIONS and item under INVENTORY & ITEMS.





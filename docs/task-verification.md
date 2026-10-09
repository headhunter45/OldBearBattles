# Manual Task Verification Guide

This document provides step-by-step instructions for manually verifying all features currently in **Testing** status in [tasks.md](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md). Each entry includes the task ID, feature title, prerequisites/UI location, execution steps, and pass/fail criteria.

> [!NOTE]
> **Workflow**: As tasks finish implementation, agents transition their status to `testing` and add their verification instructions here. Once a human tester verifies that the feature works as intended, the tester updates the task status to `done`, commits the change, and migrates the verification instructions into [docs/human-tests.md](file:///Users/tom/Projects/OldBearBattles/docs/human-tests.md) for permanent regression testing.

---

## Tasks Awaiting Verification

| Task ID | Feature Title | Domain | Status |
| :--- | :--- | :--- | :--- |
| **[OB-207](#ob-207---unbound-token-resets-character-sheet-form-state)** | Unbound Token Resets Character Sheet Form State | VTT / Character Sheet | Testing |
| **[OB-182](#ob-182---associate-controllable-token-with-chat-panel)** | Associate Controllable Token with Chat Panel | VTT / Chat | Testing |
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

---

## VTT & Chat

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

# Manual Task Verification Guide

This document provides step-by-step instructions for manually verifying all features currently in **Testing** status in [tasks.md](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md). Each entry includes the task ID, feature title, prerequisites/UI location, execution steps, and pass/fail criteria.

> [!NOTE]
> **Workflow**: As tasks finish implementation, agents transition their status to `testing` and add their verification instructions here. Once a human tester verifies that the feature works as intended, the tester updates the task status to `done`, commits the change, and migrates the verification instructions into [docs/human-tests.md](file:///Users/tom/Projects/OldBearBattles/docs/human-tests.md) for permanent regression testing.

---

## Tasks Awaiting Verification

| Task ID                                                                                           | Feature Title                                                                    | Domain                | Status  |
| :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------- | :-------------------- | :------ |
| **[OB-160](#ob-160---objective-marker-control-zone-calculation--auto-scoring)**                   | Objective Marker Control Zone Calculation & Auto-Scoring                         | Wargaming / Brawl     | Testing |
| **[OB-162](#ob-162---deployment-zones-casualty-trays--staging-submap-templates)**                 | Deployment Zones, Casualty Trays & Staging Submap Templates                      | Wargaming / Brawl     | Testing |
| **[OB-163](#ob-163---tournament-organizer-to-mode-match-privacy--spectator-controls)**            | Tournament Organizer (TO) Mode, Match Privacy & Spectator Controls               | Wargaming / Brawl     | Testing |
| **[OB-182](#ob-182---associate-controllable-token-with-chat-panel)**                              | Associate Controllable Token with Chat Panel                                     | VTT / Chat            | Testing |
| **[OB-183](#ob-183---codebase-simplification--refactoring-plan-docsrefactor-1md)**                | Codebase Simplification & Refactoring Plan (`docs/refactor-1.md`)                | Architecture / Plan   | Testing |
| **[OB-184](#ob-184---helptip-component--placement-guide-docshelptip-locationsmd)**                | HelpTip Component & Placement Guide (`docs/helptip-locations.md`)                | UI / UX Guide         | Testing |
| **[OB-185](#ob-185---backlog-research--implementation-guide-docsbacklog-implementation-guidemd)** | Backlog Research & Implementation Guide (`docs/backlog-implementation-guide.md`) | Architecture / Guide  | Testing |
| **[OB-187](#ob-187---submap--deployment-zone-customization-ui)**                                  | Submap & Deployment Zone Customization UI                                        | VTT & Brawl / Scenes  | Testing |
| **[OB-188](#ob-188---relative-dragging-for-tokens-modular-tiles-and-props)**                      | Relative Dragging for Tokens, Modular Tiles, and Props                           | VTT & Brawl / Canvas  | Testing |
| **[OB-189](#ob-189---edit-modular-tiles-and-center-on-random-draw)**                              | Edit Modular Tiles & Center on Random Draw                                       | Common / Assets       | Testing |
| **[OB-191](#ob-191---no-ring-color-default-for-props-and-tiles)**                                 | No Ring Color as Default for Props & Tiles                                       | Common / Canvas       | Testing |
| **[OB-192](#ob-192---custom-status-creation-editing-and-token-controls-integration)**             | Custom Status Creation, Editing, & Token Controls Integration                    | Common / Statuses     | Testing |
| **[OB-193](#ob-193---choose-existing-and-preset-images-in-token-editor)**                         | Choose Existing & Preset Images in Token Editor                                  | Common / Tokens       | Testing |
| **[OB-197](#ob-197---brawl-mode-top-bar-and-bidirectional-mode-switching)**                       | Brawl Mode Top Bar & Bidirectional Mode Switching                                | Platform / Brawl      | Testing |
| **[OB-198](#ob-198---reveal-fog-shortcut-key-shift-f)**                                           | Reveal Fog Shortcut Key (`Shift+F`)                                              | VTT / Fog of War      | Testing |
| **[OB-200](#ob-200---standalone-token-attacks-without-character-sync)**                           | Standalone Token Attacks Without Character Sync                                  | VTT / Tokens          | Testing |
| **[OB-207](#ob-207---unbound-token-resets-character-sheet-form-state)**                           | Unbound Token Resets Character Sheet Form State                                  | VTT / Character Sheet | Testing |
| **[OB-211](#ob-211---remove-excess-display-from-info-commands)**                                  | Remove Excess Display from Info Commands                                         | Common / Chat         | Testing |
| **[OB-232](#ob-232---system-feature-flags-environment-toggles--runtime-configuration)**           | System Feature Flags: Environment Toggles & Runtime Configuration                | Common / Config       | Testing |
| **[OB-233](#ob-233---create-scene-from-map-asset-uses-natural-image-dimensions)**                | Create Scene from Map Asset Uses Natural Image Dimensions                        | Common / Maps         | Testing |

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
   - Verify that under **Fog of War**, the shortcut for _Reveal Fog of War_ is listed as `Shift + F`.
   - Verify that _Hide / Cover Fog of War_ remains `F`.

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

### OB-232 - System Feature Flags: Environment Toggles & Runtime Configuration

- **Reference in tasks.md:** [tasks.md: OB-232](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-232)
- **Primary Source Code:** [featureFlags.ts](file:///Users/tom/Projects/OldBearBattles/packages/shared/src/featureFlags.ts), [featureFlags.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/config/featureFlags.ts), [index.ts](file:///Users/tom/Projects/OldBearBattles/packages/server/src/index.ts)
- **Where to find it:** Environment variables (`.env` in dev, container environment in prod), `/api/features` endpoint, and browser console (`window.__oldbear_features`). Controls:
  1. `chess_clock`: Brawl topbar button & floating Chess Clock HUD widget.
  2. `voice_chat`: Voice section in Mobile Drawer, Voice Settings modal, and floating PTT button.
  3. `soundboard`: Soundboard button in Mobile Drawer and Soundboard modal in VTT/Brawl.
  4. `dice_roller`: Dice button in Mobile Drawer, Brawl topbar, and draggable Dice Roller window.
  5. `scoreboard`: Scoreboard VP button in Brawl topbar and Scoreboard modal.
  6. `objectives`: Objectives button in Brawl topbar and Objectives modal.
  7. `to_mode`: TO / Spectator button in Brawl topbar and TO Controls modal.
  8. `dndbeyond`: D&D Beyond 5e tab and importer in Character Sheet flyout.
  9. `pathbuilder`: Pathbuilder 2e PF2e tab and importer in Character Sheet flyout.
  10. `army_roster`: Army button in Brawl topbar and Army Roster flyout.
  11. `fog_of_war`: GM Fog of War tool and submenus in the canvas toolbar.
  12. `brawl_mode`: Tactical tabletop wargaming mode platform (`AppBrawl`), top bar and mobile drawer mode switchers (defaults to `false` until releasable).

#### Step-by-Step Instructions:

1. **Verify Default Feature States**:
   - Navigate to `http://localhost:3000`.
   - By default, `FEATURE_BRAWL_MODE=false`. Observe that all buttons and links to switch to Brawl mode (in TopBar and MobileDrawer) are hidden.
   - Attempting to navigate directly to `http://localhost:3000/?mode=brawl` automatically routes to VTT mode.
   - By default, `FEATURE_CHESS_CLOCK=false`. Core features like Army Roster, Objectives, Scoreboard, and TO mode are enabled by default for when Brawl mode is active.
2. **Verify Server Endpoint (`/api/features`)**:
   - In your browser or via curl, navigate to `http://localhost:3000/api/features`.
   - Verify the response JSON returns all 12 flags including `brawl_mode: false`: `{ features: { brawl_mode: false, chess_clock: false, voice_chat: true, soundboard: true, dice_roller: true, scoreboard: true, objectives: true, to_mode: true, dndbeyond: true, pathbuilder: true, army_roster: true, fog_of_war: true } }`.
3. **Verify Runtime / Post-Deployment Toggling**:
   - Open browser developer console on the VTT page.
   - Type `__oldbear_features.set('brawl_mode', true)`.
   - Verify the top bar immediately updates and displays the "Brawl" mode switcher button, and Mobile Drawer displays the "Switch to Brawl Mode" toggle.
   - Click "Brawl" to switch into Brawl mode.
   - Type `__oldbear_features.set('chess_clock', true)`. Verify the top bar displays the "Clock" button.
   - Type `__oldbear_features.set('brawl_mode', false)`.
   - Verify that attempts to access brawl mode switch back to VTT mode, and all Brawl references disappear.
4. **Verify Component-Level Toggling for Flags**:
   - **Character Imports**: Open the Character Sheet in VTT. In console run `__oldbear_features.set('dndbeyond', false)` and `__oldbear_features.set('pathbuilder', false)`. Observe that the D&D Beyond and Pathbuilder tabs hide, leaving only Local Character. Reset them with `__oldbear_features.reset()`.
   - **Brawl Modules**: In console with `brawl_mode` enabled, run `__oldbear_features.set('scoreboard', false)` or `__oldbear_features.set('army_roster', false)`. Observe that the corresponding top bar buttons hide and their modals cannot be opened.
   - **Fog of War**: As GM in VTT, run `__oldbear_features.set('fog_of_war', false)` in console. Observe that the Fog of War button in the toolbar disappears.
   - **Dice Roller / Soundboard / Voice**: Run `__oldbear_features.set('dice_roller', false)`. Observe that the Dice buttons disappear from the top bar and mobile drawer.
   - **Compound Flags**: Verify `submaps_and_regions` evaluates to true only when at least one submap flag is enabled (`multiple_floors`, `connected_dungeons`, or `brawl_mode` + brawl submaps), defaults to false, and cannot be set directly via environment variables.
5. **Verify URL Query Override**:
   - Navigate to `http://localhost:3000/?enable_feature=brawl_mode&mode=brawl`.
   - Verify that Brawl mode opens cleanly with URL feature flag activation.
6. **Verify Development `.env` Support**:
   - Check `.env.example` and `.env` under section `9. Feature Flags (OB-232)`.
   - Setting `FEATURE_BRAWL_MODE=true` in `.env` activates Brawl mode upon server restart or Vite reload.

#### Expected Result (Pass Criteria):

- All supported feature flags have explicit defaults documented in `.env.example`.
- When `brawl_mode` is false (default), Brawl mode is unavailable, all links/references to Brawl mode are hidden, and attempts to set Brawl mode route to VTT.
- In production, flags can be toggled via host/container environment variables without rebuilding the static frontend bundle.
- In development, flags can be set in `.env` using standard naming (`FEATURE_<NAME>=true|false`).
- Compound flags (e.g. `submaps_and_regions`) are strictly computed from dependent flags, protected against direct env overrides, and typed via `isCompoundFlagEnabled`.
- Frontend components reactively update when flags change without full page reloads.

---

### OB-233 - Create Scene from Map Asset Uses Natural Image Dimensions

- **Reference in tasks.md:** [tasks.md: OB-233](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-233)
- **Primary Source Code:** [imageUtils.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/utils/imageUtils.ts), [DataBackupModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/DataBackupModal.tsx), [MapManagerModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/MapManagerModal.tsx), [BinderPipeline.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/storage/BinderPipeline.ts)
- **Where to find it:** Asset Manager / Storage (`DataBackupModal` -> Maps tab) and Map Manager modal.

#### Step-by-Step Instructions:

1. **Verify Scene Creation from Existing / Legacy Map Asset**:
   - Open Asset Manager / Storage (`DataBackupModal`) from the top bar or menu.
   - Switch to the **Maps** tab.
   - Locate any imported map asset (e.g. `sunderstone_canyon` or any non-square/custom resolution map).
   - Click the **Make Scene** button on the map card (or select the map and click **Make Scene from Selected**).
   - Verify that the notification states: `Created new scene "<Map Name> Scene" (<width>x<height>) from map asset!`.
   - Open **Scene Settings** (`MapSettingsModal`) for the newly created scene.
   - Verify that the map dimensions match the actual image resolution (e.g., `1024x1536`), not the previous fallback default of `2000x1500`.
   - Verify that the grid columns and rows (`tilesX` and `tilesY`) and `gridSize` were calculated proportionally based on the true resolution.

2. **Verify Scene Creation from Map Manager Modal**:
   - Open the **Map Manager** (`MapManagerModal`).
   - Under "Create Scene from Map", select the map asset from the library dropdown.
   - Enter a scene name (or leave default) and click create.
   - Switch to that newly created scene and open Scene Settings.
   - Verify the width and height match the map image's natural dimensions.

3. **Verify Map File Upload Dimension Persistence**:
   - In Asset Manager -> Maps tab, upload or drag-and-drop a new map image (e.g. 1024x1536).
   - Click "Make Scene" from this newly uploaded map.
   - Verify the scene is created with the image's dimensions.

#### Expected Result (Pass Criteria):

- Scenes created from map assets (imported via binder, backup, or manual upload) automatically inspect the image data and use its natural resolution (e.g. 1024x1536).
- The default `2000x1500` fallback is only used if image loading completely fails or no image data exists.
- The detected width and height are backfilled and saved to IndexedDB for the asset so subsequent scene creations are instantaneous.

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

---

### OB-217 - Allow /attack? to Query Compendium Weapons and Attacks

- **Reference in tasks.md:** [tasks.md: OB-217](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-217)
- **Primary Source Code:** [ChatPanel.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ChatPanel.tsx), [open5eFetcher.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/utils/open5eFetcher.ts), [compendiumResolver.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/utils/compendiumResolver.ts), [StatBlockCard.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/StatBlockCard.tsx)
- **Where to find it:** Chat Panel (`Enter` or `~` or chat bubble icon on toolbar).

#### Step-by-Step Instructions:

1. **Query Unlisted Weapon via /attack?:**
   - Open Chat (`Enter` or click the chat bubble on toolbar).
   - In chat, type `/attack? greatsword` (a weapon not listed on the default sheet) and send.
   - Verify that rather than saying "could not find attack", the system queries Open5e SRD weapons.
   - Verify an EntityStatBlock card renders with name `Greatsword`, subtitle `Martial Melee Weapons`, damage formula `2d6 slashing`, range `5 ft`, and button `+ Add to Attacks` (or `+ Add to Sheet`).

2. **Query Multi-System Weapon / Attack:**
   - In chat, type `/attack? [pf2] shortsword` or `/attack? pf2:shortsword`.
   - Verify it queries the PF2e database and returns the Pathfinder 2e shortsword weapon card with damage formula and `+ Add to Attacks` button.

3. **Verify Adding Found Weapon to Sheet:**
   - On the returned `Greatsword` or `Shortsword` card in chat, click **+ Add to Attacks** (or `+ Add to Sheet`).
   - Open Character Sheet (`c` key): verify the weapon attack is added to **ACTIONS** with its damage dice and reach.

#### Expected Result (Pass Criteria):

- Using `/attack? <weapon>` when the attack is not present on the character or token queries the Open5e and PF2e compendiums.
- Weapon stat block displays damage formula, damage type, reach/range, and allows adding to sheet/attacks.

---

### OB-218 - Chat Textbox Loses Focus on Outside Click / Canvas Selection

- **Reference in tasks.md:** [tasks.md: OB-218](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-218)
- **Primary Source Code:** [CanvasEngine.ts](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/engine/CanvasEngine.ts), [ChatPanel.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ChatPanel.tsx)
- **Where to find it:** Chat Panel message input and battlemap canvas.

#### Step-by-Step Instructions:

1. **Focus Chat Textbox:**
   - Open Chat Panel and click inside the text input box so the cursor is blinking in it.
2. **Click Canvas / Token:**
   - Click directly onto the battlemap canvas or click on any token on the board.
   - Verify that the chat text input immediately blurs (cursor disappears).
3. **Verify Canvas Focus and Hotkeys:**
   - Press canvas hotkeys such as `w`, `a`, `s`, `d` (or arrow keys) to pan, `[` / `]` to change fog brush size (if GM in fog tool), or token movement keys.
   - Verify hotkeys execute immediately without characters being typed into the chat input.
4. **Escape Key in Chat Input:**
   - Click back into the chat text input.
   - Press `Escape`.
   - Verify that pressing `Escape` blurs the chat input without needing mouse interaction.

#### Expected Result (Pass Criteria):

- Clicking any token or canvas area immediately blurs active text inputs and focuses the canvas.
- Canvas hotkeys work immediately upon clicking the board without requiring selecting text elsewhere.
- Pressing `Escape` in the chat input blurs the input.

---

### OB-219 - System-Agnostic Ruleset Options on Character Sheet (Local Character Default)

- **Reference in tasks.md:** [tasks.md: OB-219](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-219)
- **Primary Source Code:** [CharacterFlyout.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/components/CharacterFlyout.tsx)
- **Where to find it:** Character Sheet (`c` hotkey or Character button in top bar).

#### Step-by-Step Instructions:

1. **Verify Default Tab:**
   - Open Character Sheet (`c` key).
   - Verify that the ruleset tabs at the top of the sheet display three choices: **Local Character**, **D&D Beyond (5e)**, and **Pathbuilder 2e (PF2e)**.
   - Verify that for a fresh or unbound character, **Local Character** is selected by default (neither D&D nor Pathfinder is favored).
2. **Test Local Character Creation & Management:**
   - In the Local Character panel, verify the title reads `LOCAL SYSTEM-AGNOSTIC CHARACTER`.
   - Click **Create Blank Sheet** (or **New Local Sheet**).
   - Verify a clean local character sheet is created and can be edited, with abilities, attacks, spells, and HP.
   - Click **Export JSON** and confirm downloading the JSON representation.
   - Click **Import JSON** to load a saved character JSON file.
3. **Verify Third-Party Import Integration:**
   - Switch to **D&D Beyond (5e)** or **Pathbuilder 2e (PF2e)** tabs.
   - Import a character (or click the demo test character button).
   - Verify that the imported data populates into the unified local sheet and is stored locally in the database.

#### Expected Result (Pass Criteria):

- Character sheet has three options: Local Character, D&D Beyond (5e), and Pathbuilder 2e (PF2e).
- Sheet defaults to the system-agnostic Local Character option rather than favoring D&D Beyond.
- Third-party imports integrate directly into the unified local character data model.

---

### OB-220 - Touch Pinch-to-Zoom on Token Portrait Preview

- **Reference in tasks.md:** [tasks.md: OB-220](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-220)
- **Primary Source Code:** [TokenEditorModal.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TokenEditorModal.tsx)
- **Where to find it:** Token Editor modal portrait canvas preview (double click a token or click Edit Token).

#### Step-by-Step Instructions:

1. **Open Token Editor:**
   - Double click a token on the battlemap or click "Edit Token" in the token controls HUD.
   - Choose or upload an image portrait.
2. **Test Touch Pinch-to-Zoom (Touch Device / DevTools Touch Emulation):**
   - Open browser DevTools, switch to Device Mode / Touch Emulation (or open on a touch tablet/mobile).
   - Pinch with two fingers over the circular/square portrait preview canvas.
   - Verify that pinching zooms the portrait in/out smoothly between 0.5x and 4.0x.
   - Verify that the browser page itself does NOT zoom or pan.
3. **Test One-Finger Drag:**
   - Drag with one finger on the canvas.
   - Verify that the image pans smoothly inside the token frame without scrolling the modal or page.
4. **Test Mouse Interaction:**
   - On desktop, verify that mouse drag pans and mouse wheel zooms the portrait preview.

#### Expected Result (Pass Criteria):

- Two-finger pinch gestures zoom only the token portrait image, with browser page zoom gestures prevented.
- One-finger drags pan the token portrait.

---

### OB-221 - Toggle Chat Display with ` or ~ Hotkey and Escape Unfocus

- **Reference in tasks.md:** [tasks.md: OB-221](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-221)
- **Primary Source Code:** [AppVtt.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/vtt/AppVtt.tsx), [AppBrawl.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/AppBrawl.tsx), [ChatPanel.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/ChatPanel.tsx)
- **Where to find it:** Entire application keyboard shortcuts in both VTT and Brawl modes.

#### Step-by-Step Instructions:

1. **Toggle Chat Open/Closed via ` / ~:**
   - In either VTT or Brawl mode, ensure no input box is focused.
   - Press the \` key (or `~` / `Backquote`).
   - Verify the Chat Panel toggles open.
   - Press \` or `~` again.
   - Verify the Chat Panel toggles closed.
2. **Combine with Escape to Unfocus:**
   - Open the Chat Panel and click into the chat text input box.
   - Press `Escape`.
   - Verify the chat text input box loses focus (blurs).
   - Press \` (or `~` or `Escape` again).
   - Verify the Chat Panel closes.
3. **Verify Typing Backticks inside Input:**
   - Click into the chat input and type a backtick (\`):
   - Verify typing characters while focused inside the input types normally without toggling the window.

#### Expected Result (Pass Criteria):

- Pressing ` or ~ toggles the chat panel open or closed.
- Pressing Escape while in the chat textbox blurs the textbox, allowing subsequent hotkeys to close the chat.

---

### OB-222 - Fix Brawl Map Canvas Scaling and Blur (Same Zoom Ratio as VTT)

- **Reference in tasks.md:** [tasks.md: OB-222](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-222)
- **Primary Source Code:** [AppBrawl.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/AppBrawl.tsx)
- **Where to find it:** Old Bear Brawl game mode (`?mode=brawl`).

#### Step-by-Step Instructions:

1. **Open Brawl Mode:**
   - In browser, navigate to `http://localhost:3000/?mode=brawl`.
2. **Verify Canvas Sharpness and Pixel Density:**
   - Observe the battlemap grid and terrain lines.
   - Verify that the battlemap is crisp and high-resolution, not blurry or upscaled from 300x150.
3. **Verify Zoom Ratio Matching VTT:**
   - Switch back and forth between VTT mode (`?mode=vtt`) and Brawl mode (`?mode=brawl`).
   - Verify that the ratio of tiles to screen pixels is consistent, and the map camera frames the battlefield correctly on load.
4. **Resize Browser Window:**
   - Resize the browser window.
   - Verify the canvas buffer updates to match viewport dimensions immediately without stretching or distorting.

#### Expected Result (Pass Criteria):

- Brawl mode canvas matches full browser window resolution.
- Canvas rendering is razor-sharp with no blurriness or incorrect zoom stretch.
- Ratio of tiles to pixels matches VTT mode.

---

### OB-223 - Hamburger Menu Styling Consistency (Brawl vs VTT)

- **Reference in tasks.md:** [tasks.md: OB-223](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md#ob-223)
- **Primary Source Code:** [BrawlTopBar.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/brawl/components/BrawlTopBar.tsx), [TopBar.tsx](file:///Users/tom/Projects/OldBearBattles/packages/client/src/common/components/TopBar.tsx)
- **Where to find it:** Top navigation bar (far-left hamburger menu icon) in both VTT and Brawl modes.

#### Step-by-Step Instructions:

1. **Check Hamburger Menu Button in VTT Mode:**
   - Navigate to `http://localhost:3000/?mode=vtt`.
   - Inspect the hamburger menu button in the top left corner.
   - Note the styling: bright accent purple background (`var(--accent-primary)`) with a crisp white icon.
2. **Check Hamburger Menu Button in Brawl Mode:**
   - Navigate to `http://localhost:3000/?mode=brawl`.
   - Inspect the hamburger menu button in the top left corner.
   - Verify that it now shares the identical bright accent purple background (`var(--accent-primary)`) and crisp white icon instead of blending dark into the background.
3. **Verify Functionality:**
   - Click the hamburger button in Brawl mode: verify it opens the mobile drawer menu normally.

#### Expected Result (Pass Criteria):

- Hamburger menu button in Brawl mode has consistent primary accent background and white icon styling matching VTT mode.

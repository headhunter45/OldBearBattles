# Human Regression Testing Guide

This document catalogs manual regression test suites that are best suited for interactive human verification rather than automated scripts. Human verification is essential for verifying visual rendering quality, gesture responsiveness, real-time multi-client synchronization, audio quality, and end-to-end UX feel.

---

## Testing Principles

1. **Focus on Tactile & Visual UX**: Verify smoothness, layout responsiveness, visual polish, and touch/trackpad ergonomics that automated headless tests cannot assess.
2. **Multi-Window Verification**: When testing WebSockets, WebRTC, or token ownership, always use two browser windows (one GM, one Player, or two Players) side-by-side.
3. **Task Completion Migration**: When a task's feature is verified and transitioned from `testing` to `done` in `docs/tasks.md`, its verification steps are migrated from `docs/task-verification.md` into this guide as a permanent regression test.

---

## Regression Test Suites

### Suite 1: Battlemap, Navigation & Map Tools

#### 1.1 Canvas Gestures & Trackpad Navigation
- **Prerequisites**: Open `http://localhost:3000/` with a map loaded.
- **Steps**:
  1. Pan across the battlemap using standard two-finger trackpad swipe. Verify smooth 60 FPS panning with no stutter.
  2. Pinch-to-zoom on trackpad (or `Ctrl`/`Cmd` + mouse scroll). Verify zoom anchors directly to the mouse cursor position.
  3. Zoom out to minimum and in to maximum. Verify the grid and tokens scale smoothly without tearing.
- **Pass Criteria**: Panning and zooming are silky-smooth and anchor accurately.

#### 1.2 Settings Button in Top Bar (OB-209)
- **Prerequisites**: Open VTT room as GM.
- **Steps**:
  1. Observe the top bar navigation next to the active scene name.
  2. Click the gear icon (`Settings`) button adjacent to the active scene name.
- **Pass Criteria**: Immediately opens the Scene Settings modal directly without requiring menu dropdowns.

#### 1.3 Submaps & Secondary Logical Maps (OB-130)
- **Prerequisites**: Open Map Settings (`Scene Settings` modal).
- **Steps**:
  1. In the Submaps section, create a secondary submap (e.g., "Staging Area" or "Basement Level").
  2. Upload or assign a secondary map image, set its dimensions, and position offset.
  3. Drag tokens between the primary battlemap and the secondary submap.
- **Pass Criteria**: Submaps render seamlessly beside the main map; tokens maintain correct coordinate snapping and layer visibility across submaps.

#### 1.4 Modular & Tileable Maps (OB-128)
- **Prerequisites**: Open Map Settings or Asset Manager.
- **Steps**:
  1. Add modular map tiles to the scene.
  2. Test tile snapping to adjacent tile borders and grid intersections.
  3. Move and rotate tiles.
- **Pass Criteria**: Tiles snap cleanly edge-to-edge without subpixel gaps or misalignment.

---

### Suite 2: Token Management & Status Lifecycles

#### 2.1 Custom Configurable Statuses & Turn Lifecycles (OB-131)
- **Prerequisites**: Battlemap with active tokens and an active encounter in the Initiative Tracker.
- **Steps**:
  1. Right-click or inspect a token to open the Status Condition menu.
  2. Add a status with a numeric duration/counter (e.g. `Stunned: 2 rounds` or `Bleed: 3`).
  3. Advance the turn in the Initiative Tracker through a full round.
  4. Advance past the counter duration.
- **Pass Criteria**: Counter decrements on the configured turn boundary (start/end of turn) and automatically clears when reaching 0 with a chat notification.

#### 2.2 Token Movement Ruler & Speed Limits
- **Prerequisites**: Token with configured speed (e.g. 30 ft).
- **Steps**:
  1. Click and drag the token across the grid.
  2. Drag within the speed limit (<= 30 ft). Observe the ruler color (green/cyan).
  3. Drag beyond the speed limit (> 30 ft).
- **Pass Criteria**: Dynamic movement ruler measures distance accurately along grid cells and shifts to red warning state when exceeding token speed.

---

### Suite 3: Character Sheet & Importers

#### 3.1 D&D Beyond Character URL Ingestion (OB-143)
- **Prerequisites**: Have a public D&D Beyond character URL (or test ID).
- **Steps**:
  1. In chat, run `/import dndbeyond <url>` or paste the URL into the Character/Token picker.
  2. Verify imported stats: HP, AC, Speed, Ability Scores, Spells, and Actions.
  3. Spawn a canvas token from the imported character.
- **Pass Criteria**: Token is created with full stat block, correct avatar, and controllable status without errors.

#### 3.2 Pathfinder 2e Reference Data Import (OB-177)
- **Prerequisites**: Foundry PF2e pack repository or open raw JSON.
- **Steps**:
  1. Inspect a PF2e spell or item in chat (e.g., `/spell? heal` or `/item? strike`).
  2. Verify PF2e action economy glyphs render accurately (1 Action `◆`, 2 Actions `◆◆`, 3 Actions `◆◆◆`, Reaction `↺`, Free Action `◇`).
  3. Verify traits pills display correctly (`[Healing]`, `[Necromancy]`, `[Positive]`).
- **Pass Criteria**: PF2e actions parse cleanly and display proper glyphs and trait pills.

#### 3.3 System-Agnostic EntityAction & Statblock Card (OB-180)
- **Prerequisites**: Query any spell, attack, item, or monster via chat (`/spell? <name>`, `/monster? <name>`).
- **Steps**:
  1. Observe the rendered `<StatBlockCard />` in the chat feed.
  2. Verify that monster cards show only `Spawn Token` (no `Roll` or `+ Add to Sheet`).
  3. Verify that spell cards show `+ Add to Sheet` and `Cast` (no `Spawn Token`).
- **Pass Criteria**: StatBlockCards render compact, readable cards with accurate contextual action buttons based on entity type.

---

### Suite 4: Communications & Real-Time Sync

#### 4.1 Two-Window Sync & Token Permissions
- **Prerequisites**: Window A logged in as GM; Window B logged in as Player.
- **Steps**:
  1. GM spawns a monster token. Player verifies they cannot move GM tokens.
  2. Player spawns or claims their own player token. Player verifies they can move their token.
  3. Move token in Window B; verify Window A updates instantaneously over WebSocket.
- **Pass Criteria**: Token permissions strictly enforce control; canvas state synchronizes seamlessly in real time.

#### 4.2 WebRTC Audio & Voice Mesh
- **Prerequisites**: Two users in the same room with microphone access.
- **Steps**:
  1. Enable voice in Voice Settings modal.
  2. Speak into Window A; verify audio playback in Window B.
  3. Adjust individual peer volume slider and toggle mute.
- **Pass Criteria**: Clear audio transmission with functional peer volume controls and mute states.

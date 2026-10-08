# AGENTS.md — Old Bear Battles Operational & Architecture Guide

Welcome to **Old Bear Battles** (`OldBearBattles`). This document serves as the primary operational orientation, architectural reference, and workflow guide for all AI agents working in this repository.

---

## 1. Project Overview & Core Tenets

OldBearBattles is a lightweight, mobile-friendly, zero-install Virtual Tabletop (VTT) and tactical tabletop wargaming platform (`Brawl`).

### Core Design Tenets
1. **Local-First & Zero-Mandatory Auth**: All player and scene data (maps, tokens, audio, character sheets) is stored in local browser storage (`IndexedDB` / `localStorage`). Users can join a room by URL without account friction.
2. **Hybrid P2P & Relay Networking**: Fast WebRTC mesh audio and room synchronization over WebSocket signaling, with graceful server relay fallback.
3. **High-Performance 2D Canvas**: Custom 60 FPS HTML5 Canvas engine designed for seamless trackpad gestures (two-finger pan, pinch-to-zoom) and touch usability without heavy external canvas frameworks.
4. **System-Agnostic Entity Architecture**: Attacks, spells, items, and abilities share a unified `EntityAction` and `EntityStatBlock` schema, enabling flexible play across D&D 5e, Pathfinder 2e, and homebrew systems.
5. **Dual Game Modes (`VTT` & `Brawl`)**:
   - `vtt`: Traditional TTRPG mode (initiative tracker, D&D/PF2e character sheets, spellbooks, fog of war).
   - `brawl`: Tabletop wargaming mode (armies, units, coherency graph halos, chess clocks, round phase stepper, victory point scoreboard).
   - Configured via `GAME_MODE` environment variable (`vtt`, `brawl`, or multi-mode `vtt,brawl` with in-app toggle).

---

## 2. Monorepo Structure

```
OldBearBattles/
├── packages/
│   ├── client/               # React 18 + Vite frontend
│   │   └── src/
│   │       ├── common/       # Shared canvas engine, networking, dice, status, widgets
│   │       ├── vtt/          # TTRPG VTT application (AppVtt, character sheets, tokens)
│   │       └── brawl/        # Tabletop wargaming platform (AppBrawl, armies, coherency)
│   ├── server/               # Node.js + WebSocket signaling & relay server
│   └── shared/               # Shared TypeScript schemas, protocol payloads, entity types
├── docs/                     # Specifications, architecture guides, task tracking
├── scripts/                  # Python CLI tools for task management (get-tasks, update-task, etc.)
└── .agents/                  # Agent skills (execute-tasks, task-management)
```

---

## 3. Mandatory Development & Testing Commands

Before committing any code or declaring a task ready for testing:

- **Run Client Tests**:
  ```bash
  npm test -w @oldbear/client
  ```
- **Run Shared Tests**:
  ```bash
  npm test -w @oldbear/shared
  ```
- **Start Local Dev Server**:
  ```bash
  npm run dev
  ```
- **Build Production Bundle** (only when validating build cleanliness):
  ```bash
  npm run build
  ```

---

## 4. Task Management & Execution Workflow

All project tasks are tracked directly in [docs/tasks.md](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md). Always use the `execute-tasks` or `task-management` skills and CLI scripts.

### Task Status Lifecycles
- `triage` / `planning`: Under research or requirements definition.
- `ready`: Ready for implementation.
- `in_progress`: Actively being worked on by an agent or developer.
- `testing`: Feature implementation is complete and currently awaiting human verification.
- `done`: Human tester has verified the feature and committed the completion.
- `blocked` / `cancelled`: Paused or abandoned.

### Rules for Agent Task Execution
1. **Transition to `testing` (Not `done`)**:
   When an agent finishes implementing a task and all tests pass:
   ```bash
   ./scripts/update-task <ID> --status testing --check-all
   ```
   Do **NOT** transition tasks directly to `done`. The human user verifies the feature and commits the transition to `done`.
2. **Log Verification in [docs/task-verification.md](file:///Users/tom/Projects/OldBearBattles/docs/task-verification.md)**:
   Add step-by-step instructions to `docs/task-verification.md` for testing the feature.
3. **Permanent Human Regression Tests in [docs/human-tests.md](file:///Users/tom/Projects/OldBearBattles/docs/human-tests.md)**:
   When a feature is verified and moved from `testing` to `done`, its verification steps are migrated from `docs/task-verification.md` to `docs/human-tests.md` as an ongoing regression test suite.
4. **Always Stage `docs/tasks.md` and `docs/task-verification.md`**:
   Before committing, always check `git status`. Ensure that any changes to `docs/tasks.md` (including user edits or pre-staged items) and `docs/task-verification.md` are included:
   ```bash
   git add docs/tasks.md docs/task-verification.md <modified-files>
   git commit -m "<type>(<project>): <summary> (<ID>)"
   ```
5. **The 20-Commit Project Description Rule**:
   `docs/project-description.md` and `docs/project-description.json` are consumed by external repositories and catalog scanners.
   - Count commits since `docs/project-description.md` was last modified:
     ```bash
     LAST_COMMIT=$(git log -n 1 --pretty=format:"%H" -- docs/project-description.md)
     git rev-list --count ${LAST_COMMIT}..HEAD
     ```
   - If $\ge 20$ commits have elapsed (or if major features/technologies were added), update the `- Last Verified UTC: YYYY-MM-DDTHH:MM:SSZ` timestamp in `docs/project-description.md` and `"lastVerifiedUtc"` in `docs/project-description.json`, stage them, and commit. This resets the 20-commit counter.

---

## 5. Documentation Sitemap & Index

When working in specific functional areas, refer to these authoritative domain documents:

| Topic / Domain | Authoritative Documentation |
| :--- | :--- |
| **All Implemented VTT Features** | [Features.md](file:///Users/tom/Projects/OldBearBattles/Features.md) |
| **Wargaming Platform (Brawl)** | [docs/brawl-project-plan.md](file:///Users/tom/Projects/OldBearBattles/docs/brawl-project-plan.md) |
| **System-Agnostic Entity & Imports** | [docs/system-agnostic-import.md](file:///Users/tom/Projects/OldBearBattles/docs/system-agnostic-import.md) |
| **Active Task Backlog** | [docs/tasks.md](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md) |
| **Features Awaiting Verification** | [docs/task-verification.md](file:///Users/tom/Projects/OldBearBattles/docs/task-verification.md) |
| **Human Regression Testing Suites** | [docs/human-tests.md](file:///Users/tom/Projects/OldBearBattles/docs/human-tests.md) |
| **HelpTip Component & Copy Guide** | [docs/helptip-locations.md](file:///Users/tom/Projects/OldBearBattles/docs/helptip-locations.md) |
| **Codebase Refactoring Plan** | [docs/refactor-1.md](file:///Users/tom/Projects/OldBearBattles/docs/refactor-1.md) |
| **Backlog Research & Architecture** | [docs/backlog-implementation-guide.md](file:///Users/tom/Projects/OldBearBattles/docs/backlog-implementation-guide.md) |
| **Task CLI Tooling Guide** | [scripts/README.md](file:///Users/tom/Projects/OldBearBattles/scripts/README.md) |
| **Historical Vision & Kickstarter Plans** | [docs/archive/idea.md](file:///Users/tom/Projects/OldBearBattles/docs/archive/idea.md), [docs/archive/initial-project-plan.md](file:///Users/tom/Projects/OldBearBattles/docs/archive/initial-project-plan.md) |

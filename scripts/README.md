# Project Scripts

This directory contains repository maintenance, task management, and release automation scripts for **Old Bear Battles**.

---

## Active Task Management Tooling

All work items and backlog features are tracked directly in repository Markdown at [docs/tasks.md](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md). The Python CLI scripts below provide fast query, insertion, update, and normalization capabilities:

### `get-tasks`
Lists tasks from `docs/tasks.md` with sorting, column selection, and flexible predicate filtering:
```bash
./scripts/get-tasks                              # List all tasks sorted by ID (desc)
./scripts/get-tasks --accept 'Status:Testing'    # List tasks currently awaiting verification
./scripts/get-tasks -p                           # List tasks in Triage and Planning status
./scripts/get-tasks --all                        # Show all tasks including Done and Cancelled
./scripts/get-tasks --sort asc                   # Sort in ascending order
```

### `get-task <ID>`
Displays detailed information, metadata fields, and full description for a specific task ID:
```bash
./scripts/get-task OB-206
```

### `add-task <title>`
Appends a new task entry to `docs/tasks.md` with frontmatter and structured markdown anchor tags:
```bash
./scripts/add-task "Descriptive Title" -p cmn -t feature -s ready -d "Task description and criteria"
```
**Options**:
- `-p, --project`: Project code (`vtt`, `cmn`, `platform`, `shared`, `brawl`)
- `-t, --type`: Task type (`feature`, `bug`, `chore`)
- `-s, --status`: Initial status (`triage`, `planning`, `ready`, `in_progress`, `testing`, `done`, `blocked`, `cancelled`)
- `-d, --description`: Markdown description text

### `update-task <ID>`
Updates status, checks off checklist items, or appends notes to a task:
```bash
./scripts/update-task OB-206 --status testing
./scripts/update-task OB-206 --check-all
./scripts/update-task OB-206 --append-description "### Implementation Notes:\n- Added test coverage."
```

### `update-tasks`
Validates and normalizes `docs/tasks.md` tables, frontmatter, and anchor IDs:
```bash
./scripts/update-tasks
```

### `triage` / `research`
Interactive helpers for rapidly reviewing tasks in triage or conducting architectural research on backlog items.

---

## Release Tooling

- **`build-release`**: Automated release build pipeline (runs test suites, packages production build).
- **`package-release`**: Distribution packaging script for reproducible standalone releases.

---

## Note on `ot` (Open Tasks)

> [!NOTE]
> Any references to `ot` (Open Tasks) refer to an upcoming standalone task management tool that is currently under development and not yet released. In the meantime, all tasks in this repository are managed directly in [docs/tasks.md](file:///Users/tom/Projects/OldBearBattles/docs/tasks.md) using the scripts documented above.

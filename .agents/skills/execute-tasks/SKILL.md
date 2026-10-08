---
name: execute-tasks
description: >-
  Execute and complete a specific list of tasks one by one. Use this skill
  whenever the user asks to work on, implement, execute, or do a specific set
  or batch of task IDs (e.g. "Do tasks OT-001, OT-002", "Work on these tasks
  one at a time"). Validates task statuses, executes implementation
  sequentially, updates documentation, marks tasks done, records follow-up tasks,
  includes all tasks.md changes in git commits, and always provides verification
  instructions (with a docs/ report for larger task batches).
---

# Execute Tasks Workflow Skill

This skill defines the standardized procedure for executing a specific set of tasks sequentially with strict status validation, documentation updates, follow-up tracking, inclusion of `tasks.md` changes, per-task commits, and comprehensive verification instructions.

---

## 1. Task Status Validation & Confirmation

Before starting execution on any given task ID, inspect its status using `./scripts/get-task <ID>`:

- **Valid Statuses to Work On**:
  - `ready` / `pending` (Ready for implementation)
  - `in_progress` (Work currently active)

- **Invalid / Ambiguous Statuses**:
  - `planning`: Scoping incomplete; requirements still unknown.
  - `triage`: Requirements known, but prioritization or technical approach unconfirmed.
  - `research`: Technical investigation required before planning.
  - `done` / `fixed`: Task is already completed.
  - `cancelled`: Task was discarded or rejected.
  - `blocked`: Task is waiting on external dependencies or decisions.

> [!WARNING]
> **Status Check Rule**: If any requested task is in an invalid status (such as `planning`, `triage`, `research`, `done`, `cancelled`, or `blocked`), you **must stop, report the task ID and its current status to the user, explain why it is not ready for implementation, and ask for explicit confirmation** before proceeding with that task.

---

## 2. Step-by-Step Task Execution Loop

Process each validated task **strictly one at a time** in the requested order:

```mermaid
graph TD
    A[Inspect & Validate Task Status] --> B[Mark Task In Progress]
    B --> C[Implement Code & Fixes]
    C --> D[Run Build & Verification Tests]
    D --> E[Update Relevant Documentation]
    E --> F[Check Off Requirements & Mark Done]
    F --> G[Add Discovered Follow-Up Tasks as Planning]
    G --> H[Stage tasks.md & Create Git Commit per Task]
    H --> I[Prepare Verification Instructions]
    I --> J{More Tasks in Batch?}
    J -- Yes --> A
    J -- No --> K[Output Verification Summary / Report]
```

### Step A: Mark In Progress
Transition the task to active work:
```bash
./scripts/update-task <ID> --status in_progress
```

### Step B: Implement Requirements
1. Read the task requirements using `./scripts/get-task <ID>`.
2. Inspect the relevant source files and implement the requested changes adhering to project architecture and best practices.
3. If partial implementation is required or edge cases emerge, record notes directly in the task description.

### Step C: Verify & Test
Run build verification and automated tests to ensure no regressions:
```bash
npm test -w @oldbear/client
npm test -w @oldbear/shared
```

### Step D: Update Documentation
Check if the changes affect:
- [README.md](file:///Users/tom/Projects/OldBearBattles/README.md)
- `docs/` specifications or architecture guides
Update the corresponding documentation files accordingly.

### Step E: Mark Task Done
Check off completed checklist items and transition status to `done`:
```bash
./scripts/update-task <ID> --status done --check-all
```
If specific items remain uncompleted or need notes:
```bash
./scripts/update-task <ID> --status done --append-description "### Implementation Notes:\n- Completed core logic.\n- Follow-up logged in OB-XXX."
```

### Step F: Record Newly Discovered Tasks
If during the work any new bugs, edge cases, refactor opportunities, or follow-ups are discovered, log them immediately in `planning` status:
```bash
./scripts/add-task "Follow-up: <Descriptive Title>" --project=<proj> --type=<type> --status=planning -d "Discovered during work on <ID>:\n- [ ] Detail"
```

### Step G: Include tasks.md & Create Git Commit
When creating the commit for the task:
1. **Always include `docs/tasks.md`**: Check `git status`. If `docs/tasks.md` has any modifications (whether user edits, staged changes, or updates made by task scripts), always include `docs/tasks.md` in the staged changes.
2. Stage modified files and commit:
```bash
git add docs/tasks.md <other-modified-files>
git commit -m "<type>(<project>): <concise summary of task ID>"
```
*(At least one commit must be made per completed task before moving to the next task).*

### Step H: Verification Instructions & Batch Reports
Always provide clear verification instructions so the user can easily test the work:
1. **Single Task / Small Batch**: Include clear, actionable step-by-step verification instructions directly in your response to the user.
2. **Batch / Many Tasks**: If executing a batch of multiple tasks, create a dedicated verification report in `docs/` (e.g. `docs/verification-report.md`) detailing:
   - Summary of completed tasks and commits
   - Step-by-step verification instructions for each task
   - Any edge cases or configurations to observe
   Provide a clickable link to the generated report in your final response.

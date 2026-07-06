---
description: Show where each feature stands in the spec-driven workflow and what the next step is
argument-hint: [optional feature slug/name to focus on]
disable-model-invocation: true
---

You report the **status** of spec-driven work in this repo. Read-only — do not create, edit, or delete anything.

Focus (optional): $ARGUMENTS

1. Gather state:
   - Read `.claude/sdd/phase` if it exists (the active gate marker and its slug).
   - Scan `specs/` for the file artifacts per feature: `<slug>.spec.md` (spec), `<slug>.plan.md` (plan), `<slug>.tasks.md` (tasks). Ignore `specs/archive/` (already-retired scaffolding).
   - For the feature in focus (`$ARGUMENTS`), the active marker's slug, or each slug found among the spec/plan/tasks files, check whether `<slug>.spec.md` exists and is non-empty, and read its frontmatter `status:` if present.
2. For each feature, report a compact line:
   `<slug>:  [<status>]  spec ✓  plan ✓  tasks ✓  impl ▸ N/M  → next: <step>`
   - `[<status>]` = the spec's frontmatter `status:` (`draft`/`planned`/`in-progress`/`done`), or `[no status]` for a legacy spec without frontmatter.
   - `✓` if present, `–` if missing.
   - `impl N/M` = checked vs total checklist items in `<slug>.tasks.md` (omit if there is no tasks file).
   - `next` = the next command to run (`/spec`, `/techplan`, `/breakdown`, `/implement`, or "done").
3. If `.claude/sdd/phase` is set, call out the **active gate** (e.g. `spec:invoice-export`) and that writes are restricted to spec artifacts until `/implement` runs or the marker is deleted.
4. **Flag clutter.** Call out any features that look retire-able and suggest `/spec-cleanup`:
   - **shipped** — `status: done`, or all tasks checked — whose `plan`/`tasks` files still sit in `specs/` (scaffolding ready to archive).
   - **orphans** — a `plan`/`tasks` file with no matching `<slug>.spec.md`.
5. End with a one-line suggestion of the single most useful next action (which may be `/spec-cleanup` if clutter dominates).

---
description: Show where each feature stands in the spec-driven workflow and what the next step is
argument-hint: [optional feature slug/name to focus on]
disable-model-invocation: true
---

You report the **status** of spec-driven work in this repo. Read-only — do not create, edit, or delete anything (including any GitHub issue).

Focus (optional): $ARGUMENTS

1. Gather state:
   - Read `.claude/sdd/phase` if it exists (the active gate marker and its slug).
   - List every `Feature: *` GitHub issue, open and closed (`gh issue list --search "Feature: in:title" --state all --json number,title,state,body,url`, or a connected GitHub MCP issue-search/list tool). Filter to the slug in focus (`$ARGUMENTS`), the active marker's slug, or all of them.
   - **If GitHub access isn't available at all**, say so plainly and report only the active gate marker (if any) — there is no local artifact cache to fall back to.
   - For each matching issue, read its body and note which sections exist (`## Spec`, `## Plan`, `## Tasks`), the `## Tasks` checked/total checkbox count, and the issue's open/closed state.
2. For each feature, report a compact line:
   `<slug>:  spec ✓  plan ✓  tasks ✓  impl ▸ N/M (issue #<n>, open|closed)  → next: <step>`
   - `✓` if the section is present, `–` if missing.
   - `impl N/M` = checked vs total checklist items in `## Tasks` (omit if there is no `## Tasks` section yet).
   - `next` = the next command to run (`/spec`, `/techplan`, `/breakdown`, `/implement`, or "done").
3. If `.claude/sdd/phase` is set, call out the **active gate** (e.g. `spec:invoice-export`) and that writes are restricted until `/implement` runs or the marker is deleted.
4. End with a one-line suggestion of the single most useful next action.

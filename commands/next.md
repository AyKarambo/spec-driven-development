---
description: Run the single next step of the workflow for a feature — and stop at its gate
argument-hint: [feature slug/name]
disable-model-invocation: true
---

You advance the feature **$ARGUMENTS** by exactly **one** step — then stop at that step's gate. You never skip gates or run several steps at once.

**Preconditions:** `gh` installed + authenticated, GitHub remote present. If not, say so and stop.

1. Determine the current state (same source as `/status`). Resolve the slug from `$ARGUMENTS` (else the current branch), then find its spec issue (`gh issue list --label sdd --state all --limit 500 --json number,title,labels,state,url,body` → title starts with `[SDD] <slug>:`). Note: whether a spec issue exists, its `sdd:*` status label / closed state, whether the `## Technical Plan` section is filled, how many `## Tasks` checkboxes are checked vs total, and whether `.claude/sdd/phase` is set.
2. Decide the single next step and run it, following that command's own instructions exactly:
   - **no spec issue** → run **`/spec`**
   - spec exists, **Technical Plan section empty, no `## Tasks` checklist yet** → run **`/techplan`** (recommended; for a small feature you may instead run `/breakdown` to skip planning)
   - **plan present, no `## Tasks` checklist yet** → run **`/breakdown`**
   - **`## Tasks` checklist has unchecked items** → run **`/implement`** for the next single task
   - **all checked** (or `sdd:done` / issue closed) → report **done**, and if any stale/orphaned SDD issues remain, suggest `/spec-cleanup`
3. Handle the gate marker exactly as that step would (planning steps set `.claude/sdd/phase`; `/implement` clears it first).
4. Stop and present the result for approval. Do **not** continue to the following step — that's my decision.

(The autonomous counterpart is `/auto`: once the spec is approved, it runs all remaining steps through review and PR without stopping. `/next` deliberately stays single-step.)

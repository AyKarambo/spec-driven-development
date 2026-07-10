---
description: Update an existing spec / plan / tasks when requirements change, and flag stale downstream artifacts
argument-hint: [feature slug/name + what changed]
disable-model-invocation: true
---

You **revise** an existing artifact for the feature: $ARGUMENTS

The spec, plan, and tasks are living documents — this keeps them honest when things change.

1. Identify the feature slug (from `$ARGUMENTS`, else the current branch). Find the `Feature: <slug>` GitHub issue (search as in `/techplan`) and read its full body. **If no such issue exists, stop** and point to `/spec`. **If GitHub access isn't available at all, stop** and tell me to set up `gh` or a GitHub MCP server — there is no local fallback.
2. **Gate marker:** write `.claude/sdd/phase` with the line `revise:<slug>` and leave it in place (revisions only touch spec artifacts, never code).
3. Apply the requested change to the right section, preserving the others untouched and, for tasks, the `- [ ]` checkbox format:
   - **spec** → the `## Spec` section
   - **plan** → the `## Plan` section
   - **tasks** → the `## Tasks` section (add/reorder/reword tasks, keep existing checked boxes checked)
   Present the revision for review (**gate**) — then, **only after I approve**, push the updated issue body (`gh issue edit <number> --body-file -`).
4. **Flag downstream staleness.** Because the sections depend on each other (spec → plan → tasks), state clearly which downstream sections are now potentially out of date and should be regenerated:
   - spec changed → plan and tasks may be stale (`/techplan`, then `/breakdown`)
   - plan changed → tasks may be stale (`/breakdown`)
   Do **not** silently regenerate them — recommend the step and let me decide.

Do **not** write feature code. Present the revision and the staleness flags for review (gate).

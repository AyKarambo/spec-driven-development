---
description: Update an existing spec / plan / tasks when requirements change, and flag stale downstream artifacts
argument-hint: [feature slug/name + what changed]
disable-model-invocation: true
---

You **revise** an existing artifact for the feature: $ARGUMENTS

The spec, plan, and tasks are living documents — this keeps them honest when things change.

1. Identify the feature slug (from `$ARGUMENTS`, else the current branch). Read `specs/<slug>.spec.md` and any `specs/<slug>.plan.md` / `.tasks.md` that exist (whichever apply). If none of these exist, stop and point to `/spec`.
2. **Gate marker:** write `.claude/sdd/phase` with the line `revise:<slug>` and leave it in place (revisions only touch spec artifacts, never code).
3. Apply the requested change to the correct artifact, preserving its section structure:
   - **spec** → edit `specs/<slug>.spec.md`. Present the revision for review, then apply only after I approve.
   - **plan / tasks** → edit the `specs/<slug>.plan.md` / `.tasks.md` file.
4. **Flag downstream staleness.** Because the artifacts depend on each other (spec → plan → tasks), state clearly which downstream artifacts are now potentially out of date and should be regenerated:
   - spec changed → plan and tasks may be stale (`/techplan`, then `/breakdown`)
   - plan changed → tasks may be stale (`/breakdown`)
   Do **not** silently regenerate them — recommend the step and let me decide.

Do **not** write feature code. Present the revision and the staleness flags for review (gate).

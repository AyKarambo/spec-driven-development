---
description: Turn a story/idea into a spec — intent, boundaries, acceptance criteria (before code)
argument-hint: [feature slug/name — or empty to infer from the current branch]
disable-model-invocation: true
---

You draft a **spec** and write it to `specs/<slug>.spec.md`: $ARGUMENTS

The spec is the source of truth for spec-driven development. Spec first, then code. Follow the project rules from CLAUDE.md / AGENTS.md, if present.

1. **Identify the feature slug.** Take it from `$ARGUMENTS`; if empty, infer a short kebab-case slug from the current branch name or the feature being discussed. State the slug you resolved — if you can't determine one, stop and ask.
2. **Gate marker:** write `.claude/sdd/phase` with the single line `spec:<slug>`. Leave it in place — it keeps the planning gate active through review until `/implement` clears it.
3. **Clarify first — this is the gate that prevents "vibe-specifying".** If anything about users, goal, scope, or edge cases is ambiguous, ask me **2–3 sharp clarifying questions before writing**. Record my answers in the spec under **Resolved questions**, so the de-risking is visible and not lost.
4. Draft the spec. Start the file with a **YAML frontmatter block** (the spec lifecycle marker), then the sections:
   ```yaml
   ---
   slug: <slug>
   status: draft        # draft → planned → in-progress → done
   updated: <today's date, YYYY-MM-DD>
   ---
   ```
   - **Intent (WHAT & WHY)** – the problem and the benefit, not the solution
   - **In-Scope / Out-of-Scope** – clear boundaries
   - **Constraints** – technical/business limits, non-goals
   - **Acceptance Criteria** – testable, in *Given / When / Then* format
   - **Resolved questions** – the clarifications above, with the decisions taken
   - **Open Questions** – anything still to clarify
5. Phrase it so every reader arrives at the same interpretation.
6. Present the drafted spec for review (**gate**) — do **not** write code. **Only after I approve**, write it to `specs/<slug>.spec.md`.

The `status` frontmatter drives the lifecycle: `/techplan` advances it to `planned`, `/implement` to `in-progress` then `done`, and `/spec-cleanup` retires the plan/tasks of `done` features. The spec is a living document — use `/revise` when it changes. Only after approval do we move to the plan (`/techplan`) — or, if I want it hands-off from here, `/auto` runs everything from plan to an open PR autonomously.

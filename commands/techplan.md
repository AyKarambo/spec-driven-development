---
description: Derive the technical plan (the HOW) from an approved spec — with parallel codebase research
argument-hint: [feature slug/name — the one that holds the spec]
disable-model-invocation: true
---

You create the **technical plan** (the HOW) for the feature: $ARGUMENTS

1. **Read the approved spec.** Take the feature **slug** from `$ARGUMENTS`; if empty, infer it from the current branch. Read `specs/<slug>.spec.md`. **If the file is missing or empty, stop** and point to `/spec`. Also follow the project rules from CLAUDE.md / AGENTS.md, if present.
2. **Gate marker:** write `.claude/sdd/phase` with the line `plan:<slug>` and leave it in place.
3. **Research the codebase before proposing.** Dispatch several `Explore` subagents in parallel to survey the areas the spec touches — existing patterns, affected modules, data models, test setup, and integration points. Ground the plan in how this codebase actually works. (You can also use native Plan Mode / `/plan` for read-only exploration.)
4. Write the plan to `specs/<slug>.plan.md` with:
   - **Architecture & Approach** – how the spec is implemented
   - **Affected Files/Modules** – where things change or are created
   - **Data Model / Interfaces** – if relevant
   - **Test Strategy** – how the acceptance criteria are verified
   - **Risks & Alternatives** – trade-offs
5. **Advance the lifecycle:** set the spec's frontmatter `status:` to `planned` (and refresh `updated:` to today) in `specs/<slug>.spec.md` — a plan now exists. If the spec has no frontmatter block yet (e.g. an older spec), add one. This edit stays within `specs/`, so it's allowed even with the gate open.

Note: `/techplan` is its own command — don't confuse it with the native `/plan` (= Plan Mode).

Do **not** write any feature code. Present the plan for review (gate).

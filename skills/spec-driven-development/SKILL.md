---
name: spec-driven-development
description: Use when the user is about to build a non-trivial feature or behavior change and would benefit from a spec-first, human-gated workflow. Helps decide whether spec-driven development is warranted, then routes into the plugin's commands (/constitution, /spec, /techplan, /breakdown, /implement). Do NOT use for trivial one-line fixes or throwaway spikes.
---

# Spec-Driven Development

This skill helps decide **whether** to use spec-driven development (SDD) for a piece of work, and routes into the plugin's commands when it fits.

## First: is SDD warranted?

SDD front-loads intent so the hard 30% (edge cases, integration, true intent) doesn't collapse late. But **over-specifying trivial work** is a known anti-pattern ("a mountain of markdown"). Judge before recommending:

- **Full workflow** — `/constitution` (once), then `/spec → /techplan → /breakdown → /implement`: non-trivial features, anything shipping to team/production, work touching multiple modules or with real edge cases.
- **Lean path** — `/spec → /techplan → /implement` (skip breakdown): small but real changes with clear scope.
- **No SDD** — prototypes, spikes, learning, throwaway experiments, one-line fixes. Say so plainly and just do the work (optionally capture a spec afterward with `/reverse-spec` if it graduates into real work).

If the request is genuinely trivial, tell the user SDD would be overkill and offer to just do it.

## How to guide

1. If there's no `CLAUDE.md` / `AGENTS.md`, suggest `/constitution` first (one-time principles & guardrails; it can bridge Claude Code and Copilot via `@AGENTS.md`).
2. Start the feature with `/spec` — intent, boundaries, testable Given/When/Then, written to `specs/<slug>.spec.md` in the repo. `/spec` clarifies ambiguity first.
3. Then `/techplan` (the HOW, with codebase research), `/breakdown` (small testable tasks + a spec↔tasks consistency check), and `/implement` (one task at a time, tested).
4. **Every step ends at a human gate** — the result is presented for approval before the next step. A guardrail hook blocks feature-code writes while a planning gate is active. Use `/status` to see where things stand, `/revise` to update living artifacts, and `/next` to run just the next step.
5. If the user explicitly wants to go **hands-off after approving the spec** ("just build it once the spec is approved"), route to `/auto` — it runs plan → breakdown → implementation → review → PR autonomously and can be entered at any point after spec approval. Spec approval and the merge always remain human decisions.
6. Each spec carries a `status:` (`draft → planned → in-progress → done`) the commands keep current. Once a feature is `done`, suggest **`/spec-cleanup`** to archive its now-throwaway plan/tasks (the spec is kept) so `specs/` doesn't fill with stale scaffolding.
7. The **merge stays a human decision** — AI review (`/code-review`, `/review`) informs, it does not auto-gate (in `/auto` too, the run ends at an open PR).

Do not write feature code yourself from this skill — route the user into the commands, which enforce the gates.

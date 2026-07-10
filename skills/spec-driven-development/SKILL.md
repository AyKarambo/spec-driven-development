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
2. Start the feature with `/spec` — intent, boundaries, testable Given/When/Then, published to a `Feature: <slug>` GitHub issue (its `## Spec` section) — there's no local spec file. `/spec` clarifies ambiguity first.
3. Then `/techplan` (the HOW, with codebase research, added as `## Plan`), `/breakdown` (small testable tasks added as `## Tasks` — native GitHub checkboxes + a spec↔tasks consistency check), and `/implement` (one task at a time, tested — checking off the issue as it goes).
4. **Every step ends at a human gate** — the result is presented for approval before the next step. A guardrail hook blocks feature-code writes while a planning gate is active. Use `/status` to see where things stand, `/revise` to update living artifacts, and `/next` to run just the next step.
5. The **merge stays a human decision** — AI review (`/code-review`, `/review`) informs, it does not auto-gate.

Do not write feature code yourself from this skill — route the user into the commands, which enforce the gates.

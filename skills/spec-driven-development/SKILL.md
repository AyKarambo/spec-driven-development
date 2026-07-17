---
name: spec-driven-development
description: Use when the user is about to build a non-trivial feature or behavior change and would benefit from a spec-first, human-gated workflow. Helps decide whether spec-driven development is warranted, then routes into the plugin's commands (/constitution, /spec, /techplan, /breakdown, /implement). Do NOT use for trivial one-line fixes or throwaway spikes.
---

# Spec-Driven Development

This skill helps decide **whether** to use spec-driven development (SDD) for a piece of work, and routes into the plugin's commands when it fits.

## First: is SDD warranted?

SDD front-loads intent so the hard 30% (edge cases, integration, true intent) doesn't collapse late. But **over-specifying trivial work** is a known anti-pattern ("a mountain of markdown"). Judge before recommending:

- **Full workflow** — `/constitution` (once), then `/spec → /techplan → /breakdown → /implement`: non-trivial features, anything shipping to team/production, work touching multiple modules or with real edge cases.
- **Lean path** — `/spec → /breakdown → /implement` (skip the optional plan): small but real changes with clear scope. (`/breakdown` is required — it fills the task checklist `/implement` works from.)
- **No SDD** — prototypes, spikes, learning, throwaway experiments, one-line fixes. Say so plainly and just do the work (optionally capture a spec afterward with `/reverse-spec` if it graduates into real work).

If the request is genuinely trivial, tell the user SDD would be overkill and offer to just do it.

Artifacts live in **GitHub issues**, not repo files — so the working tree stays clean. This needs the `gh` CLI installed + authenticated and a GitHub remote on the repo; if those are missing, say so before starting (`/constitution` is the exception — it writes only local rule files).

## How to guide

1. If there's no `CLAUDE.md` / `AGENTS.md`, suggest `/constitution` first (one-time principles & guardrails; it can bridge Claude Code and Copilot via `@AGENTS.md`).
2. Start the feature with `/spec` — intent, boundaries, testable Given/When/Then, opened as a **GitHub issue** (`[SDD] <slug>: …`, labeled `sdd`). The user story is the issue body. `/spec` clarifies ambiguity first.
3. Then `/techplan` (the HOW, with codebase research — recorded as an optional `## Technical Plan` section in the same issue; skippable for small features), `/breakdown` (small testable tasks added as a **`## Tasks` checklist** in the same issue + a spec↔tasks consistency check), and `/implement` (one task at a time, tested — checking its box when done).
4. **Every step ends at a human gate** — the result is presented for approval before it's written to GitHub or the next step begins. A guardrail hook blocks feature-code writes on disk while a planning gate is active. Use `/status` to see where things stand, `/revise` to update living artifacts, and `/next` to run just the next step.
5. If the user explicitly wants to go **hands-off after approving the spec** ("just build it once the spec is approved"), route to `/sdd-auto` — it runs plan → breakdown → implementation → review → PR autonomously and can be entered at any point after the spec issue exists. Spec approval and the merge always remain human decisions.
6. Each spec issue carries a status **label** (`sdd:draft → sdd:planned → sdd:in-progress → sdd:done`) the commands keep current; a shipped feature's issue is labeled `sdd:done` and **closed**, which keeps the issue list clean. Use **`/spec-cleanup`** to finalize any feature that finished but was left open, and to flag long-stale SDD issues.
7. The **merge stays a human decision** — AI review (`/code-review`, `/review`) informs, it does not auto-gate (in `/sdd-auto` too, the run ends at an open PR).

Do not write feature code yourself from this skill — route the user into the commands, which enforce the gates.

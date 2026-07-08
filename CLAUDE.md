# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This repo is **both** the **Spec-Driven Development** Claude Code plugin **and** the marketplace that
ships it (`.claude-plugin/marketplace.json` lives at the repo root) — a personal plugin, installed from
a local path (see [README.md](README.md)). There is no application code, build step, or test suite: the
plugin is Markdown command/skill definitions plus two small cross-platform Node hook scripts.

## ⚠️ Release checklist — do this for EVERY change that ships

1. **Bump the version in BOTH manifests — they must always match:**
   - `.claude-plugin/plugin.json` → `"version"`
   - `.claude-plugin/marketplace.json` → `plugins[0].version`

   Semver: patch (`0.1.0 → 0.1.1`) for fixes, minor (`→ 0.2.0`) for new commands/behavior.

2. **Validate:** `claude plugin validate .` — must pass.

3. **Commit.**

4. **Pick up the change:** run `claude plugin marketplace update spec-driven-development-marketplace`
   (or restart Claude Code) — a local-path marketplace doesn't auto-refresh otherwise.

> **The #1 thing not to forget:** bump the version in **both** manifests.

## Verifying changes

No build/lint/test. Verify with:

- `claude plugin validate .` — validates the manifests, commands, skill, and hooks wiring. Must pass.
- `node --check hooks/gate-guard.js && node --check hooks/session-notice.js` — after editing either hook.
- **Functional testing is manual.** Install the plugin into a scratch/consuming repo (or point a local
  marketplace at this directory) and run the commands. The hooks only *do* anything in a repo that has a
  `.claude/sdd/phase` marker — see below.

## Architecture — the gate-marker contract

The whole plugin is organized around one piece of shared state: a one-line marker file
**`.claude/sdd/phase`** that lives **in the consuming repo** (never in this repo). Its contents are
`<phase>:<slug>` (e.g. `spec:user-login`), or just `constitution`. Two independent halves cooperate
through that file — so any change to the marker's path, its `<phase>:<slug>` format, or the write
allowlist must be mirrored in **both** halves:

**1. Commands (`commands/*.md`)** — plain-English instructions to Claude, not code. Each planning
command writes the marker as its first action and *leaves it in place* through the human review gate;
`/implement` deletes it first (that is the moment feature code may be written).

| Command | Marker behavior |
|---|---|
| `/constitution` | writes `constitution`, then **deletes it before presenting** (one-time setup, no downstream `/implement`) |
| `/spec` | writes `spec:<slug>`, leaves it |
| `/techplan` | writes `plan:<slug>`, leaves it (dispatches parallel `Explore` subagents to research the codebase) |
| `/breakdown` | writes `tasks:<slug>`, leaves it (ends with a spec↔tasks consistency check) |
| `/revise` | writes `revise:<slug>`, leaves it |
| `/reverse-spec` | writes `reverse-spec:<slug>`, leaves it |
| `/implement` | **deletes** the marker first, then implements exactly one task; stamps the spec `in-progress`/`done` |
| `/status` | read-only; never touches the marker |
| `/next` | delegates marker handling to whichever single step it runs |
| `/auto` | delegates to each phase it runs (planning phases write their marker, the implementation loop **deletes** it) — chains phases without stopping at intermediate gates; requires an approved spec to start |
| `/spec-cleanup` | **reads** the marker to protect the active slug; writes no marker (maintenance, like `/status`, but mutates `specs/`) |

**Where the spec lives.** The spec, plan, and tasks are all plain files under `specs/` in the repo:
`specs/<slug>.spec.md`, `specs/<slug>.plan.md`, `specs/<slug>.tasks.md`. `/spec` and `/reverse-spec`
write the spec file (after the review gate); `/techplan`, `/breakdown`, `/revise`, `/status`, `/next`
read it. Everything is local — no network calls, no external tracker.

**Spec lifecycle & cleanup (v0.3).** Each spec carries a YAML frontmatter `status:` that the
commands maintain — `draft` (`/spec`) → `planned` (`/techplan`, `/breakdown`) → `in-progress` →
`done` (`/implement`); `/reverse-spec` starts at `done`; `/revise` reopens to `planned`. When a
feature is `done`, its **plan + tasks are throwaway scaffolding**: `/spec-cleanup` moves them to
**`specs/archive/`** (or `git rm` with `--delete`) while **keeping the spec** in `specs/` stamped
`done`. Orphans and age-stale artifacts are only ever flagged for confirmation, never auto-removed.
Because `/techplan`/`/breakdown`/`/implement` now also edit the spec's frontmatter, and `specs/**`
is on the allowlist, these status stamps stay gate-safe. Design rationale:
[docs/specs/2026-07-06-v0.3-lifecycle-cleanup.md](docs/specs/2026-07-06-v0.3-lifecycle-cleanup.md).

**Auto mode (v0.4).** `/auto` chains the remaining phases (plan → tasks → implement → review → PR)
autonomously once a spec is approved, resuming from whatever artifacts already exist. It introduces
**no new marker phase, no new allowlist entry, and no new state file** — it reuses each phase's marker
behavior and simply doesn't stop at the intermediate gates. Two human decisions stay manual: **spec
approval** (the entry requirement — `specs/<slug>.spec.md` existing *is* the approval, because `/spec`
only writes it post-approval) and **the merge** (`/auto` ends at an open PR, never merges).
Implementation tasks are dispatched by difficulty: S → subagent on a fast/small model, M →
general-purpose subagent, L → the main conversation. Design rationale:
[docs/specs/2026-07-08-v0.4-auto-mode.md](docs/specs/2026-07-08-v0.4-auto-mode.md).

**2. Hooks (`hooks/*.js`, wired by `hooks/hooks.json`)** — Node scripts that read the marker and react:

- `gate-guard.js` (`PreToolUse` on `Write|Edit|MultiEdit|NotebookEdit`): if the marker exists, **denies**
  writes to anything outside the allowlist — `specs/**`, `CLAUDE.md`, `AGENTS.md`, `.claude/**` (plus any
  path outside the repo). So feature code can't be written while a planning gate is open.
- `session-notice.js` (`SessionStart`): surfaces an active marker as context, so a stale gate is never invisible.

Non-negotiable hook properties — **preserve these when editing**:

- **Fail open.** Any parse/IO error → `process.exit(0)`. A hook bug must never block legitimate work.
- **Zero impact when idle.** No marker → the hooks do nothing, so non-SDD repos are completely unaffected.
- **Cross-platform Node**, invoked via `${CLAUDE_PLUGIN_ROOT}` — no shell-isms, no hard-coded paths.
- The guardrail is a **discipline aid, not a security boundary** — it deliberately does not police `Bash`
  writes (see [docs/specs/2026-07-03-v0.2-design.md](docs/specs/2026-07-03-v0.2-design.md) §7).

The umbrella **skill** (`skills/spec-driven-development/SKILL.md`) is the only model-invocable piece: it
judges *whether* SDD is warranted (full vs. lean vs. none) and routes into the commands. It writes no
code and touches no marker.

## Conventions

- English throughout.
- Commands are manual-only: every `commands/*.md` carries `disable-model-invocation: true` in its
  frontmatter, plus `description` and `argument-hint`; `$ARGUMENTS` is the user input.
- Command names deliberately avoid native collisions: `/techplan` (not `/plan` = Plan Mode) and
  `/breakdown` (not `/tasks` = background jobs).
- Keep the two manifest versions in sync (see the release checklist).
- Never commit `.claude/sdd/` — it is consuming-repo state and is git-ignored here.
- Design rationale for the gate-guardrail mechanism lives in
  [docs/specs/2026-07-03-v0.2-design.md](docs/specs/2026-07-03-v0.2-design.md); update it when you make
  architectural changes.

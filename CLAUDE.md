# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This repo is **both** the **Spec-Driven Development** Claude Code plugin **and** the marketplace that
ships it (`.claude-plugin/marketplace.json` lives at the repo root) — a personal plugin, installed from
a local path (see [README.md](README.md)). There is no application code, build step, or test suite: the
plugin is Markdown command/skill definitions plus two small cross-platform Node hook scripts.

**As of v0.4, specs/plans/tasks live in GitHub issues, not in repo files.** The consuming repo needs
the `gh` CLI (authenticated, `repo` scope) and a GitHub remote. Design rationale:
[docs/specs/2026-07-08-v0.4-github-issues.md](docs/specs/2026-07-08-v0.4-github-issues.md).

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
- **Functional testing is manual.** Install the plugin into a scratch/consuming repo that has a
  GitHub remote and `gh` authenticated, and run the commands end to end (they create real issues). The
  hooks only *do* anything in a repo that has a `.claude/sdd/phase` marker — see below.

## Architecture — two contracts

The plugin has two shared contracts. A change to either must be mirrored across every file that
depends on it.

### Contract A — the gate marker (unchanged in spirit since v0.2)

One shared piece of local state: a one-line marker file **`.claude/sdd/phase`** that lives **in the
consuming repo** (never in this repo; gitignored). Its contents are `<phase>:<slug>` (e.g.
`spec:user-login`), or just `constitution`. Two independent halves cooperate through it:

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
| `/implement` | reads the slug from the marker, then **deletes** the marker first; implements one task sub-issue via a difficulty-graded executor (S/M → subagents, L → main conversation); advances the spec issue's status label |
| `/status` | read-only; never touches the marker |
| `/next` | delegates marker handling to whichever single step it runs |
| `/auto` | delegates to each phase it runs (planning phases write their marker, the implementation loop **deletes** it) — chains phases without stopping at intermediate gates; requires the spec issue to exist to start |
| `/spec-cleanup` | **reads** the marker to protect the active slug; writes no marker (maintenance, like `/status`) |

**Auto mode (v0.4).** `/auto` chains the remaining phases (plan → tasks → implement → review → PR)
autonomously once a spec exists, resuming from whatever artifacts already exist. It introduces
**no new marker phase, no new allowlist entry, and no new state file** — it reuses each phase's marker
behavior and simply doesn't stop at the intermediate gates. Two human decisions stay manual: **spec
approval** (the entry requirement — the **spec issue** existing *is* the approval, because `/spec`
only creates it post-approval) and **the merge** (`/auto` ends at an open PR, never merges).
Implementation tasks are dispatched by difficulty: S → subagent on a fast/small model, M →
general-purpose subagent, L → the main conversation — the same grading `/implement` uses, so manual
and autonomous runs behave identically per task. Design rationale:
[docs/specs/2026-07-08-v0.4-auto-mode.md](docs/specs/2026-07-08-v0.4-auto-mode.md).

**2. Hooks (`hooks/*.js`, wired by `hooks/hooks.json`)** — Node scripts that read the marker and react:

- `gate-guard.js` (`PreToolUse` on `Write|Edit|MultiEdit|NotebookEdit`): if the marker exists, **denies**
  writes to anything outside the allowlist — `CLAUDE.md`, `AGENTS.md`, `.claude/**` (plus any path
  outside the repo). So feature code can't be written on disk while a planning gate is open. (There is
  no `specs/**` entry anymore — specs are not files.)
- `session-notice.js` (`SessionStart`): surfaces an active marker as context, so a stale gate is never invisible.

Non-negotiable hook properties — **preserve these when editing**:

- **Fail open.** Any parse/IO error → `process.exit(0)`. A hook bug must never block legitimate work.
- **Zero impact when idle.** No marker → the hooks do nothing, so non-SDD repos are completely unaffected.
- **Cross-platform Node**, invoked via `${CLAUDE_PLUGIN_ROOT}` — no shell-isms, no hard-coded paths.
- The guardrail is a **discipline aid, not a security boundary** — it deliberately does not police `Bash`
  writes, which is exactly why `gh` issue writes (specs/plans/tasks) pass through it freely (see
  [docs/specs/2026-07-03-v0.2-design.md](docs/specs/2026-07-03-v0.2-design.md) §7).

### Contract B — the GitHub issue model (v0.4)

Every command that stores an artifact does it through `gh`, following one shared scheme. Any change to
the label names, title format, body markers, or `gh` recipes must be mirrored in **every** command
that reads or writes them.

- **Spec issue (one per feature):** title `[SDD] <slug>: <human title>`; labels `sdd` + exactly one
  status label (`sdd:draft` | `sdd:planned` | `sdd:in-progress` | `sdd:done`). Body = the user story,
  with a hidden `<!-- sdd:slug=<slug> -->` anchor and a `<!-- sdd:plan:start -->` / `<!-- sdd:plan:end -->`
  marker pair around the optional `## Technical Plan` section. **Done ⇒ labeled `sdd:done` AND closed.**
- **Task sub-issues:** created with `gh issue create --parent <spec#>`; title `[<slug>] <task>`; label
  `sdd:task`; body has `Goal:`/`Files:`/`Check:`/`Size:`. **Done ⇒ the sub-issue is closed.** Progress
  comes from the parent's `subIssuesSummary` (`{total, completed, percentCompleted}`).
- **Labels** (bootstrapped idempotently by `/spec` and `/reverse-spec` with `gh label create … 2>/dev/null || true`):
  `sdd` `5319E7`, `sdd:draft` `BFDADC`, `sdd:planned` `1D76DB`, `sdd:in-progress` `FBCA04`,
  `sdd:done` `0E8A16`, `sdd:task` `C5DEF5`.
- **Slug → issue lookup:** no repo-side map (that would defeat the clean-repo goal). Commands run
  `gh issue list --label sdd --state all --json …` and match the title prefix `[SDD] <slug>:`.
- **Bodies** are written by piping a temp file to `gh issue create/edit --body-file` (a temp file under
  `.claude/sdd/` is gitignored and on the gate allowlist).

The lifecycle a command maintains: `/spec` → `sdd:draft`; `/techplan` → `sdd:planned`; `/breakdown`
ensures `sdd:planned`; `/implement` → `sdd:in-progress` (first task) → `sdd:done` + close (last task);
`/reverse-spec` starts `sdd:done` + closed; `/revise` reopens to `sdd:planned` when it reopens real
work. `/spec-cleanup` finalizes finished-but-open specs and flags orphan/stale issues.

## Conventions

- English throughout.
- Commands are manual-only: every `commands/*.md` carries `disable-model-invocation: true` in its
  frontmatter, plus `description` and `argument-hint`; `$ARGUMENTS` is the user input.
- Command names deliberately avoid native collisions: `/techplan` (not `/plan` = Plan Mode) and
  `/breakdown` (not `/tasks` = background jobs).
- Every issue-touching command starts by verifying its **preconditions** (`gh` installed +
  authenticated, GitHub remote present) and stops with guidance if any is missing. `/constitution` is
  exempt (writes only `CLAUDE.md`/`AGENTS.md`/`.claude/rules/`).
- Planning commands **present the artifact for approval first, then persist to GitHub after approval** —
  nothing hits GitHub before the gate.
- Keep the two manifest versions in sync (see the release checklist).
- Never commit `.claude/sdd/` — it is consuming-repo state and is git-ignored here.
- Design rationale: the gate mechanism is in
  [docs/specs/2026-07-03-v0.2-design.md](docs/specs/2026-07-03-v0.2-design.md); the move to GitHub
  issues is in [docs/specs/2026-07-08-v0.4-github-issues.md](docs/specs/2026-07-08-v0.4-github-issues.md).
  Update these when you make architectural changes.

The umbrella **skill** (`skills/spec-driven-development/SKILL.md`) is the only model-invocable piece: it
judges *whether* SDD is warranted (full vs. lean vs. none) and routes into the commands. It writes no
code and touches no marker.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This repo is **both** the **Spec-Driven Development** Claude Code plugin **and** the marketplace that
ships it (`.claude-plugin/marketplace.json` lives at the repo root) — a personal plugin, installed from
a local path (see [README.md](README.md)). There is no application code, build step, or test suite: the
plugin is Markdown command/skill/agent definitions plus two small cross-platform Node hook scripts.

**As of v0.4, specs/plans/tasks live in GitHub issues, not in repo files.** The consuming repo needs
the `gh` CLI (authenticated, `repo` scope) and a GitHub remote. Design rationale:
[docs/specs/2026-07-08-v0.4-github-issues.md](docs/specs/2026-07-08-v0.4-github-issues.md), amended by
[docs/specs/2026-07-10-tasks-checklist-not-subissues.md](docs/specs/2026-07-10-tasks-checklist-not-subissues.md)
(tasks are a checklist inside the spec issue, not sub-issues).

**Invariant (v0.9) — no committed spec/plan/tasks Markdown.** The workflow never commits a spec/plan/tasks
Markdown file to a consuming repo. The **only** `.md` files it writes into the tracked tree are the project
rule files — `CLAUDE.md`, `AGENTS.md`, and `.claude/rules/**` (the constitution). Everything else (specs,
plans, tasks) lives in GitHub issues, piped in via `gh` from a **transient** body file under the
**gitignored** `.claude/sdd/` (`.claude/sdd/issue-body.md`) that the command **deletes right after** — so
it is never committed, whatever its extension. This is enforced on two sides that must stay in sync: the
`gate-guard.js` hook (while a gate is active, denies stray `.md` writes except the rule files and the
gitignored `.claude/sdd/` scratch) and every artifact command's **"the issue is the only store"** note.
Rationale: [docs/specs/2026-07-18-v0.9-no-stray-markdown.md](docs/specs/2026-07-18-v0.9-no-stray-markdown.md).

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
| `/breakdown` | writes `tasks:<slug>`, leaves it (ends with a spec↔tasks consistency check; fills the `## Tasks` checklist in the spec issue) |
| `/revise` | writes `revise:<slug>`, leaves it |
| `/reverse-spec` | writes `reverse-spec:<slug>`, leaves it |
| `/implement` | reads the slug from the marker, then **deletes** the marker first; implements one task from the spec issue's `## Tasks` checklist via a difficulty-graded executor (S → `sdd-quick`/Haiku, M → `sdd-standard`/Sonnet, L → main conversation); advances the spec issue's status label |
| `/status` | read-only; never touches the marker |
| `/next` | delegates marker handling to whichever single step it runs |
| `/sdd-auto` | delegates to each phase it runs (planning phases write their marker, the implementation loop **deletes** it) — chains phases without stopping at intermediate gates; requires the spec issue to exist to start |
| `/spec-cleanup` | **reads** the marker to protect the active slug; writes no marker (maintenance, like `/status`) |

**Auto mode (v0.4).** `/sdd-auto` chains the remaining phases (plan → tasks → implement → review → PR)
autonomously once a spec exists, resuming from whatever artifacts already exist. It introduces
**no new marker phase, no new allowlist entry, and no new state file** — it reuses each phase's marker
behavior and simply doesn't stop at the intermediate gates. Two human decisions stay manual: **spec
approval** (the entry requirement — the **spec issue** existing *is* the approval, because `/spec`
only creates it post-approval) and **the merge** (`/sdd-auto` ends at an open PR, never merges).
Implementation tasks are dispatched by difficulty: S → the `sdd-quick` subagent (Haiku), M →
the `sdd-standard` subagent (Sonnet), L → the main conversation — the same grading `/implement` uses, so manual
and autonomous runs behave identically per task. Design rationale:
[docs/specs/2026-07-08-v0.4-auto-mode.md](docs/specs/2026-07-08-v0.4-auto-mode.md).

**2. Hooks (`hooks/*.js`, wired by `hooks/hooks.json`)** — Node scripts that read the marker and react:

- `gate-guard.js` (`PreToolUse` on `Write|Edit|MultiEdit|NotebookEdit`): while the marker exists it applies
  two rules (both fail open, both silent when no marker):
  - **Markdown (`*.md`/`*.markdown`) — deny unless it's a rule file or gitignored scratch:** the only
    Markdown that may hit disk during a gate is `CLAUDE.md`, `AGENTS.md`, `.claude/rules/**`, or transient
    scratch under the gitignored `.claude/sdd/**`. This is what stops a spec/plan/tasks doc from being saved
    as a stray, committed `.md` file (e.g. `spec.md`, `specs/x.md`, even `.claude/notes.md`) instead of
    going into the GitHub issue.
  - **Everything else (feature code) — deny unless under the broad allowlist** `CLAUDE.md`, `AGENTS.md`,
    `.claude/**` (plus any path outside the repo). So feature code can't be written on disk while a
    planning gate is open. (There is no `specs/**` entry — specs are not files.)

  The transient issue-body file the commands pipe into `gh` (`.claude/sdd/issue-body.md`) lives under the
  gitignored `.claude/sdd/`, so it's allowed by the Markdown rule and — deleted right after use, never
  tracked — is never committed, whatever its extension. The Markdown rule is why the invariant above holds;
  mirror it in every command's "the issue is the only store" note and in the `session-notice.js` message.
- `session-notice.js` (`SessionStart`): surfaces an active marker as context, so a stale gate is never invisible.

Non-negotiable hook properties — **preserve these when editing**:

- **Fail open.** Any parse/IO error → `process.exit(0)`. A hook bug must never block legitimate work.
- **Zero impact when idle.** No marker → the hooks do nothing, so non-SDD repos are completely unaffected.
- **Cross-platform Node**, invoked via `${CLAUDE_PLUGIN_ROOT}` — no shell-isms, no hard-coded paths.
- The guardrail is a **discipline aid, not a security boundary** — it deliberately does not police `Bash`
  writes, which is exactly why `gh` issue writes (specs/plans/tasks) pass through it freely (see
  [docs/specs/2026-07-03-v0.2-design.md](docs/specs/2026-07-03-v0.2-design.md) §7).

### Contract B — the GitHub issue model (v0.4, tasks amended 2026-07-10)

Every command that stores an artifact does it through `gh`, following one shared scheme. Any change to
the label names, title format, body markers, or `gh` recipes must be mirrored in **every** command
that reads or writes them.

- **One issue per feature (spec + plan + tasks, all in one place):** title `[SDD] <slug>: <human title>`;
  labels `sdd` + exactly one status label (`sdd:draft` | `sdd:planned` | `sdd:in-progress` | `sdd:done`).
  Body = the user story, with a hidden `<!-- sdd:slug=<slug> -->` anchor and two marker pairs:
  `<!-- sdd:plan:start -->` / `<!-- sdd:plan:end -->` around the optional `## Technical Plan` section,
  and `<!-- sdd:tasks:start -->` / `<!-- sdd:tasks:end -->` around the `## Tasks` checklist. **Done ⇒
  labeled `sdd:done` AND closed.**
- **Tasks are a checklist, not sub-issues:** lines inside `## Tasks`, one per task —
  `- [ ] **T<n>: <goal>** (S/M/L)` with indented Files/Check sub-lines. **Done ⇒ the line is checked
  (`- [x]`)**, pushed with `gh issue edit <n> --body-file <transient temp>` on the same issue. Progress is
  the checked/total count of those lines, read directly from the body — there is no `subIssuesSummary` to
  read, because there are no sub-issues.
- **Labels** (bootstrapped idempotently by `/spec` and `/reverse-spec` with `gh label create … 2>/dev/null || true`):
  `sdd` `5319E7`, `sdd:draft` `BFDADC`, `sdd:planned` `1D76DB`, `sdd:in-progress` `FBCA04`,
  `sdd:done` `0E8A16`. (No `sdd:task` label — nothing task-shaped needs labeling anymore.)
- **Slug → issue lookup:** no repo-side map (that would defeat the clean-repo goal). Commands run
  `gh issue list --label sdd --state all --json …` and match the title prefix `[SDD] <slug>:`.
- **Bodies** are written by piping a **transient** temp file (`.claude/sdd/issue-body.md`) to
  `gh issue create/edit --body-file`, and the command **deletes it right after** the `gh` call. The file
  lives under the **gitignored** `.claude/sdd/`, so it passes the gate and — being deleted right away and
  never tracked — is never committed (its `.md` extension is fine because nothing under `.claude/sdd/` is
  ever committed). Mirror this name and the delete-after step in every command that writes a body.

The lifecycle a command maintains: `/spec` → `sdd:draft`; `/techplan` → `sdd:planned`; `/breakdown`
ensures `sdd:planned`; `/implement` → `sdd:in-progress` (first task checked) → `sdd:done` + close (last
task checked); `/reverse-spec` starts `sdd:done` + closed; `/revise` reopens to `sdd:planned` when it
reopens real work. `/spec-cleanup` finalizes finished-but-open specs and flags stale issues.

## Conventions

- English throughout.
- Commands are manual-only: every `commands/*.md` carries `disable-model-invocation: true` in its
  frontmatter, plus `description` and `argument-hint`; `$ARGUMENTS` is the user input.
- Command names deliberately avoid native collisions: `/techplan` (not `/plan` = Plan Mode),
  `/breakdown` (not `/tasks` = background jobs), and `/sdd-auto` (not `/auto` — bare `/auto` is
  shadowed by Claude Code's built-in auto-mode commands `/auto-mode-setup` / `/auto-pause`, so a
  plugin command named `auto` never surfaces in the menu; renamed in v0.8.0).
- Every issue-touching command starts by verifying its **preconditions** (`gh` installed +
  authenticated, GitHub remote present) and stops with guidance if any is missing. `/constitution` is
  exempt (writes only `CLAUDE.md`/`AGENTS.md`/`.claude/rules/`).
- Planning commands **present the artifact for approval first, then persist to GitHub after approval** —
  nothing hits GitHub before the gate.
- Keep the two manifest versions in sync (see the release checklist).
- Never commit `.claude/sdd/` — it is consuming-repo state and is git-ignored here.
- Design rationale: the gate mechanism is in
  [docs/specs/2026-07-03-v0.2-design.md](docs/specs/2026-07-03-v0.2-design.md); the move to GitHub
  issues is in [docs/specs/2026-07-08-v0.4-github-issues.md](docs/specs/2026-07-08-v0.4-github-issues.md);
  the switch from task sub-issues to a checklist inside the spec issue is in
  [docs/specs/2026-07-10-tasks-checklist-not-subissues.md](docs/specs/2026-07-10-tasks-checklist-not-subissues.md);
  the pinned executor agents (`sdd-quick`/`sdd-standard`) are in
  [docs/specs/2026-07-16-v0.7-pinned-executor-agents.md](docs/specs/2026-07-16-v0.7-pinned-executor-agents.md).
  Update the relevant doc when you make architectural changes.

The umbrella **skill** (`skills/spec-driven-development/SKILL.md`) is the only model-invocable piece: it
judges *whether* SDD is warranted (full vs. lean vs. none) and routes into the commands. It writes no
code and touches no marker.

## Executor agents (`agents/*.md`)

The difficulty-graded executor that `/implement` and `/sdd-auto` use is backed by two **plugin subagents with
pinned models**, so the S/M tiers are deterministic instead of left to the lead's per-run model choice:

- `agents/sdd-quick.md` — **Haiku**, for **S** (mechanical) tasks.
- `agents/sdd-standard.md` — **Sonnet**, for **M** (standard) tasks.
- **L** tasks are never delegated — the lead (main conversation) implements them directly.

Both workers are scoped to SDD implementation only (their `description` says so, to avoid spurious
auto-delegation outside the workflow), carry only file/search/Bash tools, and do **no bookkeeping** — they
implement one task and report back; the lead verifies the result, edits the GitHub issue, moves labels, and
commits. They also carry the **no-stray-Markdown rule** (spec/plan/tasks stay in the issue, never a file) —
they do the writing for S/M tasks during the implementation phase, when the gate hook is idle by design, so
that rule can't rely on the hook and must live in the agent files (see the v0.9 invariant above). If you
rename a worker, change its pinned model, or add a tier, mirror it in **both** command files
(`commands/implement.md` step 4 and `commands/sdd-auto.md`'s implementation loop) and in Contract A's table above.

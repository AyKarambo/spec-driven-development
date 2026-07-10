# Design: spec/plan/tasks live entirely in one GitHub issue

_Date: 2026-07-10 · Status: approved-for-planning · Author: Timo Seikel + Claude_

## 1 · Goal

Remove `specs/*.md` as a local artifact format entirely. Except for the one-time project constitution
(`CLAUDE.md`/`AGENTS.md`), this plugin should keep **nothing on disk**: spec, plan, and tasks all live
in **one GitHub issue per feature**, so GitHub's native rendering (task-list checkboxes, progress bar,
issue state) does the job instead of a bespoke local format.

This supersedes an intermediate step where only tasks moved to a GitHub issue while spec/plan stayed
local files with a local-fallback path — that fallback is dropped here in favor of a stricter, simpler
model with no local artifact fallback at all.

## 2 · Decisions

- **One issue per feature, three sections.** `/breakdown`'s earlier "Tasks: `<slug>`" issue becomes a
  single **`Feature: <slug>`** issue that grows over the workflow: `/spec` (or `/reverse-spec`) creates
  it with a `## Spec` section; `/techplan` adds `## Plan`; `/breakdown` adds `## Tasks` (GitHub task-list
  checkboxes: `- [ ] **T<n>: <goal>** (S/M/L)`, with indented Files/Check sub-lines). Each command reads
  and edits only its own section, leaving the others in the body untouched.
- **No local pointer, no local cache.** Earlier designs kept a small pointer file
  (`specs/<slug>.tasks.md`) so commands could find the right issue without a GitHub search. That's
  dropped too — every command finds the feature's issue by searching its **exact title**
  (`Feature: <slug>`, `gh issue list --search "\"Feature: <slug>\" in:title" --state all`, or an
  equivalent GitHub MCP search/list call) and always reads the **live** body, never a cached snapshot.
- **No local fallback.** If neither the `gh` CLI (installed and authenticated) nor a connected GitHub
  MCP server's issue tools are available, the affected command **stops and says so** rather than
  writing anything to a local file. This is a deliberate change from the hooks' fail-open philosophy:
  hooks fail open because a hook bug must never block legitimate work, but a *missing dependency* for a
  command that has no other home for its output should surface clearly, not silently degrade to a
  format nobody asked for.
- **`gh` CLI preferred, GitHub MCP as fallback mechanism** (unchanged from the prior design) — commands
  are plain-English instructions that tell Claude to shell out to `gh issue create` / `gh issue view` /
  `gh issue edit`, falling back to MCP issue tools only if `gh` itself isn't available.
- **Closing the issue stays a human decision** (unchanged) — `/implement` suggests closing once the
  last task is checked but never does it itself.
- **The gate-guard allowlist drops `specs/**`.** With no local spec/plan/tasks files at all, the only
  local content this plugin ever writes is the constitution (`CLAUDE.md`/`AGENTS.md`) and its own
  gate-orchestration marker (`.claude/sdd/phase`, under the already-allowed `.claude/**`). The allowlist
  is now just `CLAUDE.md`, `AGENTS.md`, `.claude/**`.
- **The gate marker itself stays local** — it's the one exception beyond the constitution. It has to be
  a plain file so `gate-guard.js` can check it synchronously on every `PreToolUse` call; round-tripping
  to GitHub on every tool call would be slow and would violate the hook's "zero impact when idle" /
  fail-open properties. It carries no spec/plan/tasks content, only `<phase>:<slug>` orchestration
  state, so it doesn't conflict with "everything but the constitution lives on GitHub."

## 3 · Non-goals

- No per-task issues or sub-issues, and no separate issues for spec vs. plan vs. tasks — one issue per
  feature, full stop.
- No auto-closing of the issue, and no auto-creating a GitHub remote if one doesn't exist.
- No change to `/constitution` — it's the explicitly-excluded local exception.
- No change to the gate-marker mechanism itself, beyond shrinking the write-allowlist it enforces.

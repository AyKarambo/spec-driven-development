# Spec-Driven Development

A personal Claude Code plugin for **spec-driven development** as native slash commands: from the
project constitution through spec and tech plan to small, review-based implementation — with
**human review gates** enforced by a guardrail hook.

Stack-agnostic: it works on any repo/language. Except for the one-time project constitution
(`CLAUDE.md`/`AGENTS.md`), **this plugin keeps nothing locally** — spec, plan, and tasks all live in a
single GitHub issue per feature, titled `Feature: <slug>`, so GitHub's native checkbox tracking (and
progress bar) does the job instead of a bespoke local format. Project-specific rules live per-repo in
`CLAUDE.md` / `AGENTS.md` (which `/constitution` generates).

## Workflow

```
/constitution   →  CLAUDE.md (+ AGENTS.md)         — principles & guardrails, one-time, local
      ↓
/spec           →  Feature: <slug> issue › ## Spec  (intent, scope, acceptance criteria)
      ↓
/techplan       →  Feature: <slug> issue › ## Plan  (technical approach, codebase research)
      ↓
/breakdown      →  Feature: <slug> issue › ## Tasks (small tasks as checkboxes + spec↔tasks consistency check)
      ↓
/implement      →  one task per run, tested, review-ready — checks off the issue
```

Each step ends with a **gate**: the result is presented for approval before the next step begins. There is no auto-gating — the merge stays a human decision.

## Commands

| Command          | Purpose                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `/constitution`  | Set/update project principles & guardrails (`CLAUDE.md`, bridges `AGENTS.md`) |
| `/spec`          | Draft a spec, published as the `## Spec` section of a `Feature: <slug>` GitHub issue — intent, boundaries, acceptance criteria |
| `/techplan`      | Derive the technical plan (the HOW) from an approved spec, with research, added as `## Plan` |
| `/breakdown`     | Break the plan into small, testable tasks added as `## Tasks` (GitHub checkboxes) + check acceptance-criteria coverage |
| `/implement`     | Implement exactly one task — small, tested, focused and reviewable          |
| `/status`        | Show where each feature stands and what the next step is (read-only)        |
| `/revise`        | Update a spec/plan/tasks and flag which downstream artifacts went stale     |
| `/reverse-spec`  | Generate a spec from existing code (brownfield adoption)                    |
| `/next`          | Run just the next step for a feature, and stop at its gate                  |

All commands are manual-only (`disable-model-invocation: true`) — **you** trigger them deliberately.

## The gate guardrail

The planning commands write a tiny local marker `.claude/sdd/phase` (e.g. `spec:invoice-export`) and
leave it in place through the review gate. A `PreToolUse` hook then **blocks writes to anything outside
the allowlist** (`CLAUDE.md`, `AGENTS.md`, `.claude/**`) so feature code can't be written before a gate
is approved. The marker itself is the one piece of local state this plugin owns beyond the constitution
— it has to be a local file so the hook can check it synchronously on every write.

The **spec, plan, and tasks** all live in the feature's GitHub issue body — under `## Spec`, `## Plan`,
and `## Tasks` respectively — never as local files. Each command reads the issue fresh and only ever
edits its own section, leaving the others untouched.

- `/implement` **clears** the marker first (that's when code may be written).
- A `SessionStart` notice surfaces an active gate so a stale marker is never invisible.
- **Override any time:** delete `.claude/sdd/phase`.
- When no marker exists, the hook does nothing — **zero impact on non-SDD work.**
- The hook is a Node script (cross-platform: Windows/macOS/Linux). It's a discipline aid, not a security
  boundary (it doesn't police `Bash` writes) — which is also why `gh` CLI calls to publish/update the
  feature issue are never blocked by an open gate.

## When NOT to use SDD

Over-specifying trivial work is an anti-pattern. Use the **full workflow** for non-trivial or production features; the **lean path** (`/spec → /techplan → /implement`) for small-but-real changes; and **no SDD** for prototypes, spikes, and one-line fixes. The bundled `spec-driven-development` skill helps make this call and routes you in.

## Native commands that complement this

`/plan` (Plan Mode — research without editing), `/code-review` (diff, `--fix` applies fixes), `/review` (pull request), `/security-review`, `/agents`, `/mcp`, `/init`, `/memory`.

> `/techplan` and `/breakdown` are deliberately named to avoid colliding with native `/plan` (Plan Mode) and `/tasks` (background jobs).

## Installation (local)

This repo **is** the marketplace. It works in **Claude Code** — the desktop app (the one with the **Code** tab), the CLI, and the IDE extensions. It does **not** install in the standalone Claude Desktop chat client (that supports only MCP/extensions).

### From the CLI

```bash
claude plugin marketplace add <path-to-this-folder>
claude plugin install spec-driven-development@spec-driven-development-marketplace
```

### From the Claude Code desktop app

1. Open the **Code** tab → click **＋** next to the prompt box → **Plugins**.
2. Choose **Add marketplace** and paste the local folder path.
3. Open **Discover**, pick **Spec-Driven Development** → **Install**.
4. Run `/reload-plugins` (or restart the app). `/spec`, `/techplan`, `/breakdown`, `/implement`, `/status`, `/revise`, `/reverse-spec`, `/next`, and `/constitution` now appear.

### Picking up changes

Since this is a local-path marketplace, edits to this folder aren't picked up automatically — run
`claude plugin marketplace update spec-driven-development-marketplace` (or restart Claude Code) after
changing anything here.

## Setup

The hooks need **Node.js**, which Claude Code already depends on. No environment variables are
required. Everything else — spec, plan, tasks — needs the **`gh` CLI**, installed and authenticated
against a GitHub remote for the repo (a connected GitHub MCP server also works, `gh` is just preferred).
There is **no local fallback**: if neither is available, `/spec`, `/techplan`, `/breakdown`, `/implement`,
and `/revise` stop and tell you to set one up rather than writing anything locally. `/constitution` is
the one command that stays fully local and needs neither.

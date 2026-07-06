# Spec-Driven Development

A personal Claude Code plugin for **spec-driven development** as native slash commands: from the
project constitution through spec and tech plan to small, review-based implementation — with
**human review gates** enforced by a guardrail hook.

Stack-agnostic: it works on any repo/language. Fully local — no external services, no network
dependency. Project-specific rules live per-repo in `CLAUDE.md` / `AGENTS.md` (which `/constitution`
generates).

## Workflow

```
/constitution   →  CLAUDE.md (+ AGENTS.md) — principles & guardrails, one-time
      ↓
/spec           →  specs/<slug>.spec.md      (intent, scope, acceptance criteria)
      ↓
/techplan       →  specs/<slug>.plan.md      (technical approach, codebase research)
      ↓
/breakdown      →  specs/<slug>.tasks.md     (small tasks + spec↔tasks consistency check)
      ↓
/implement      →  one task per run, tested, review-ready
```

Each step ends with a **gate**: the result is presented for approval before the next step begins. There is no auto-gating — the merge stays a human decision.

## Commands

| Command          | Purpose                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `/constitution`  | Set/update project principles & guardrails (`CLAUDE.md`, bridges `AGENTS.md`) |
| `/spec`          | Draft a spec into `specs/<slug>.spec.md` — intent, boundaries, acceptance criteria |
| `/techplan`      | Derive the technical plan (the HOW) from an approved spec, with research    |
| `/breakdown`     | Break the plan into small, testable tasks + check acceptance-criteria coverage |
| `/implement`     | Implement exactly one task — small, tested, focused and reviewable          |
| `/status`        | Show where each feature stands and what the next step is (read-only)        |
| `/revise`        | Update a spec/plan/tasks and flag which downstream artifacts went stale     |
| `/reverse-spec`  | Generate a spec from existing code (brownfield adoption)                    |
| `/next`          | Run just the next step for a feature, and stop at its gate                  |
| `/spec-cleanup`  | Archive the plan/tasks scaffolding of shipped features; flag stale/orphaned artifacts |

All commands are manual-only (`disable-model-invocation: true`) — **you** trigger them deliberately.

## Spec lifecycle & cleanup

Each spec carries a frontmatter `status:` that the commands keep current as work progresses:

```
draft ──/techplan──▶ planned ──/implement──▶ in-progress ──/implement (last task)──▶ done
```

Once a feature is **done**, its plan and tasks are throwaway scaffolding. **`/spec-cleanup`** moves
them to `specs/archive/` (or `git rm` with `--delete`) while **keeping the spec** in `specs/`,
stamped `done` — so the source of truth stays discoverable but `specs/` doesn't fill with stale
plans and task lists. Orphaned and long-untouched artifacts are only ever flagged for your
confirmation, never removed automatically. Run `/spec-cleanup --dry-run` to preview.

## The gate guardrail

The planning commands write a tiny marker `.claude/sdd/phase` (e.g. `spec:invoice-export`) and leave it
in place through the review gate. A `PreToolUse` hook then **blocks writes to anything outside the
spec-artifact allowlist** (`specs/**`, `CLAUDE.md`, `AGENTS.md`, `.claude/**`) so feature code can't be
written before a gate is approved.

The **spec, plan, and tasks** all live as files under `specs/` in the repo — nothing is stored outside it.

- `/implement` **clears** the marker first (that's when code may be written).
- A `SessionStart` notice surfaces an active gate so a stale marker is never invisible.
- **Override any time:** delete `.claude/sdd/phase`.
- When no marker exists, the hook does nothing — **zero impact on non-SDD work.**
- The hook is a Node script (cross-platform: Windows/macOS/Linux). It's a discipline aid, not a security boundary (it doesn't police `Bash` writes).

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
4. Run `/reload-plugins` (or restart the app). `/spec`, `/techplan`, `/breakdown`, `/implement`, `/status`, `/revise`, `/reverse-spec`, `/next`, `/spec-cleanup`, and `/constitution` now appear.

### Picking up changes

Since this is a local-path marketplace, edits to this folder aren't picked up automatically — run
`claude plugin marketplace update spec-driven-development-marketplace` (or restart Claude Code) after
changing anything here.

## Setup

The hooks need **Node.js**, which Claude Code already depends on. No external services or environment variables are required — everything (spec, plan, tasks) lives as plain files in the repo you're working in.

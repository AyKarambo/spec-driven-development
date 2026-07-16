# Spec-Driven Development

A personal Claude Code plugin for **spec-driven development** as native slash commands: from the
project constitution through spec and tech plan to small, review-based implementation — with
**human review gates** enforced by a guardrail hook.

Specs, plans, and tasks live in **GitHub issues**, not files in the repo — so the working tree stays
clean while the planning artifacts get a linkable, reviewable home with native progress tracking.

Stack-agnostic: it works on any repo/language. Project-specific rules live per-repo in
`CLAUDE.md` / `AGENTS.md` (which `/constitution` generates).

## Workflow

```
/constitution   →  CLAUDE.md (+ AGENTS.md)         — principles & guardrails, one-time, local
      ↓
/spec           →  GitHub issue "[SDD] <slug>: …"  (user story: intent, scope, acceptance criteria)
      ↓
/techplan       →  ## Technical Plan section in that issue  (the HOW, codebase research — optional)
      ↓
/breakdown      →  ## Tasks checklist in that same issue  (small tasks + spec↔tasks consistency check)
      ↓
/implement      →  one task per run, tested, review-ready; checks its box, closes the issue when done
```

Each step ends with a **gate**: the result is presented for approval before it's written to GitHub or
the next step begins. There is no auto-gating — the merge stays a human decision.

## How artifacts map to GitHub

- **One issue per feature — spec, plan, and tasks all in it** — title `[SDD] <slug>: <title>`, labeled
  `sdd`. Its body is the **user story** (WHAT & WHY).
- **The technical plan** (the HOW) is an optional **`## Technical Plan` section inside that same
  issue** — recommended for bigger features, skippable for small ones.
- **Tasks are a `## Tasks` checklist inside that same issue** — GitHub's native `- [ ]` task-list
  syntax, so the checkbox and progress bar are native, not bespoke. A task is done when its line is
  checked (`- [x]`).
- **A feature is done** when its spec issue is labeled `sdd:done` and **closed** — which is what keeps
  the issue list clean.

Prefer to go hands-off once the spec is approved? **`/auto`** runs everything below the spec
autonomously — plan, tasks, implementation, code review, and an open PR (see [Auto mode](#auto-mode)).

## Commands

| Command          | Purpose                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `/constitution`  | Set/update project principles & guardrails (`CLAUDE.md`, bridges `AGENTS.md`) |
| `/spec`          | Draft a spec as a GitHub issue — intent, boundaries, acceptance criteria    |
| `/techplan`      | Derive the technical plan (the HOW) into the spec issue, with research      |
| `/breakdown`     | Break the plan into a `## Tasks` checklist in the spec issue + check acceptance-criteria coverage |
| `/implement`     | Implement exactly one checklist task — small, tested, reviewable; executor picked by difficulty (S → `sdd-quick`/Haiku, M → `sdd-standard`/Sonnet, L → main conversation) |
| `/status`        | Show where each feature stands and what the next step is (read-only)        |
| `/revise`        | Update the spec/plan/tasks in the issue and flag which downstream artifacts went stale |
| `/reverse-spec`  | Generate a spec issue from existing code (brownfield adoption)              |
| `/next`          | Run just the next step for a feature, and stop at its gate                  |
| `/auto`          | Autopilot: after the spec issue exists, run plan → tasks → implementation → review → PR autonomously |
| `/spec-cleanup`  | Finalize finished-but-open specs; flag long-stale SDD issues                |

All commands are manual-only (`disable-model-invocation: true`) — **you** trigger them deliberately.

## Spec lifecycle

Each spec issue carries a status **label** the commands keep current as work progresses:

```
sdd:draft ──/techplan──▶ sdd:planned ──/implement──▶ sdd:in-progress ──/implement (last task)──▶ sdd:done (closed)
```

`/reverse-spec` starts a feature at `sdd:done` (documenting shipped code); `/revise` reopens a
done/in-progress feature back to `sdd:planned` when it reopens real work. Because `done` features are
closed, GitHub keeps the default issue list to live work only. **`/spec-cleanup`** finalizes any
feature that finished but was left open, and flags long-stale SDD issues for your confirmation (never
removing anything automatically). Run `/spec-cleanup --dry-run` to preview.

## Auto mode

Once a spec is **approved** (i.e. the spec issue exists — `/spec` only creates it after your
approval), **`/auto`** takes the feature the rest of the way without stopping at the intermediate
gates: technical plan → task breakdown → implementation → code review → an open pull request.

- **Enter it at any point after the spec issue exists** — right after `/spec`, mid-planning, or
  mid-implementation. It detects what already exists and runs only the missing phases; if every task
  in the checklist is already checked it just reviews and opens the PR.
- **Implementation is dispatched by difficulty:** small mechanical tasks go to sub-agents on a fast
  model, standard tasks to general-purpose sub-agents, and hard/risky tasks are done in the main
  conversation. Every result is verified (tests + diff) before its checkbox is ticked, with one
  focused commit per task. (Manual `/implement` runs use the same difficulty grading.)
- **The diff is code-reviewed before the PR is opened** (skipped only if a review clearly already
  happened), and clear findings are fixed.
- **It stops instead of pushing through** on repeated test failures, blockers, or spec conflicts —
  and reports honestly what's done. Re-running `/auto` resumes from the still-unchecked tasks.
- **Two decisions are never automated:** approving the spec (the entry ticket) and merging the PR
  (auto mode ends at an open PR).

## The gate guardrail

The planning commands write a tiny local marker `.claude/sdd/phase` (e.g. `spec:invoice-export`) and
leave it in place through the review gate. A `PreToolUse` hook then **blocks writes to anything outside
a small allowlist** (`CLAUDE.md`, `AGENTS.md`, `.claude/**`) so feature code can't be written before a
gate is approved. Specs/plans/tasks are written to GitHub via `gh` (a `Bash` call), so they're
unaffected — only on-disk code is gated.

- `/implement` **clears** the marker first (that's when code may be written).
- A `SessionStart` notice surfaces an active gate so a stale marker is never invisible.
- **Override any time:** delete `.claude/sdd/phase`.
- When no marker exists, the hook does nothing — **zero impact on non-SDD work.**
- The hook is a Node script (cross-platform: Windows/macOS/Linux). It's a discipline aid, not a
  security boundary (it doesn't police `Bash` writes).

The marker (`.claude/sdd/phase`) is local, gitignored state — it never gets committed, so the repo
stays clean.

## When NOT to use SDD

Over-specifying trivial work is an anti-pattern. Use the **full workflow** for non-trivial or
production features; the **lean path** (`/spec → /breakdown → /implement`, skipping the plan) for
small-but-real changes; and **no SDD** for prototypes, spikes, and one-line fixes. The bundled
`spec-driven-development` skill helps make this call and routes you in.

## Native commands that complement this

`/plan` (Plan Mode — research without editing), `/code-review` (diff, `--fix` applies fixes), `/review` (pull request), `/security-review`, `/agents`, `/mcp`, `/init`, `/memory`.

> `/techplan` and `/breakdown` are deliberately named to avoid colliding with native `/plan` (Plan Mode) and `/tasks` (background jobs).

## Requirements

Because specs live in GitHub issues, the plugin needs:

- **[`gh`](https://cli.github.com/) — the GitHub CLI**, installed and authenticated (`gh auth status`).
  The token needs the `repo` scope (to create/edit/close issues). No sub-issue support required — tasks
  are a checklist in the issue body, so any reasonably current `gh` works.
- **A GitHub remote** on the repo you're working in (`gh repo view` must succeed).
- **Node.js** (which Claude Code already depends on) for the guardrail hooks.

The commands verify these and stop with guidance if something is missing. `/constitution` is the one
exception — it writes only local rule files and needs no GitHub access.

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
4. Run `/reload-plugins` (or restart the app). `/spec`, `/techplan`, `/breakdown`, `/implement`, `/auto`, `/status`, `/revise`, `/reverse-spec`, `/next`, `/spec-cleanup`, and `/constitution` now appear.

### Picking up changes

Since this is a local-path marketplace, edits to this folder aren't picked up automatically — run
`claude plugin marketplace update spec-driven-development-marketplace` (or restart Claude Code) after
changing anything here.

### Troubleshooting: the desktop app is stuck on an old version

The desktop app and the CLI both read the **same** install record
(`~/.claude/plugins/installed_plugins.json`) — the desktop app has no private plugin config. So a
mismatch usually means the plugin was **never actually updated in place**: bumping the version in this
folder doesn't advance the *installed* copy until you refresh the marketplace **and** update the
plugin. A plain uninstall/reinstall from inside a running app can silently re-install the old cached
version (a local *directory* marketplace doesn't auto-refresh), and the `claude plugin validate`
version you see is the *source* version, not the installed one.

Fix it from the CLI:

```bash
# 1. Refresh the local marketplace so it re-reads marketplace.json (the new version)
claude plugin marketplace update spec-driven-development-marketplace

# 2. Update the installed plugin — writes a fresh cache copy + advances installed_plugins.json
claude plugin update spec-driven-development@spec-driven-development-marketplace
```

If it still won't move, force a clean cycle **after** the refresh:

```bash
claude plugin uninstall spec-driven-development@spec-driven-development-marketplace
claude plugin marketplace update spec-driven-development-marketplace
claude plugin install spec-driven-development@spec-driven-development-marketplace
```

Then **fully quit and relaunch the desktop app** — closing the window leaves it running in the tray,
and plugins are loaded once at startup, so on-disk changes won't show until a fresh launch.

Verify it took: `~/.claude/plugins/installed_plugins.json` should now show the new version and a
matching install path (e.g. `…\spec-driven-development\0.6.1`).

## Setup

Install and authenticate `gh` (`gh auth login`), make sure your repo has a GitHub remote, and you're
ready. The plugin creates the `sdd*` labels it needs on first use. No spec files are ever written to
the repo — the working tree stays clean.

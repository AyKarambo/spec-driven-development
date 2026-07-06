---
name: branch-cleanup
description: Use when the user wants to clean up, prune, or tidy old/stale local git branches or worktrees — e.g. "too many branches lying around", "clean up my worktrees", "prune old branches". Routes into the plugin's /cleanup command rather than deleting anything ad hoc.
---

# Branch Cleanup

Local git branches and worktrees pile up as feature work (e.g. spec-driven development, one branch/worktree per feature) finishes and merges but is never cleaned up.

When the user asks for this kind of tidy-up, run the `/cleanup` command from this plugin rather than improvising `git branch -D` / `git worktree remove` calls inline — it encodes the safe classification rules (what's auto-deletable vs what needs the user's judgment) and the local-only guardrail (never touches remote branches or pushes).

If the user only wants a report with nothing deleted, run `/cleanup --dry-run`.

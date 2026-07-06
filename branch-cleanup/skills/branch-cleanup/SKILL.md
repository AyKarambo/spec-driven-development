---
name: branch-cleanup
description: Use when the user wants to clean up, prune, or tidy old/stale git branches or worktrees, local or on origin — e.g. "too many branches lying around", "clean up my worktrees", "prune old branches", "clean up remote branches too". Routes into the plugin's /cleanup command rather than deleting anything ad hoc.
---

# Branch Cleanup

Local git branches and worktrees pile up as feature work (e.g. spec-driven development, one branch/worktree per feature) finishes and merges but is never cleaned up. The same thing happens on `origin` once a feature branch has been merged there too.

When the user asks for this kind of tidy-up, run the `/cleanup` command from this plugin rather than improvising `git branch -D` / `git worktree remove` / `git push origin --delete` calls inline — it encodes the safe classification rules (what's auto-deletable vs what needs the user's judgment) and the confirmation guardrails (local deletion is the safe default; deleting anything on `origin` is opt-in and always its own separate confirmation, never bundled with the local one).

- If the user only wants a report with nothing deleted, run `/cleanup --dry-run`.
- If the user also wants matching branches deleted on `origin` (not just locally), run `/cleanup --remote` — or just mention it in plain language. Either way, `/cleanup` will still ask for an explicit go-ahead before deleting anything on the remote, separately from the local confirmation.

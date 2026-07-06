---
description: Find stale local branches and worktrees and clean them up — auto-remove what's safely inactive, ask about the rest
argument-hint: [--dry-run] [branch-or-worktree-name-filter]
---

You clean up **local** git branches and worktrees that have piled up from finished feature work. This is a maintenance task, not a refactor — be conservative, be transparent, and never touch anything outside this local checkout.

Arguments (optional): $ARGUMENTS
- `--dry-run` — report and classify only, delete nothing, don't even ask.
- a filter string — only consider branches/worktrees whose name contains it.

## Hard rules (never violate)

- **Local-only.** Never push, never delete or touch a remote branch, never run anything that contacts `origin` in a mutating way. `git fetch` (read-only) is fine and encouraged before classifying. If the user wants remote branches pruned too, that's a separate explicit ask — mention it, don't do it.
- **Never delete or touch:** the branch currently checked out in the main working directory, the repo's default branch (`main`/`master`/whatever `origin/HEAD` points to), and any branch matching common long-lived names (`develop`, `staging`, `release/*`) unless the user explicitly names one of these in their filter/answer.
- **Never force anything without an explicit answer.** `git branch -d` (safe delete) is the default; only use `git branch -D` or `git worktree remove --force` after the user has been told exactly what's unmerged/dirty and has explicitly said to force it.
- **A branch checked out in a worktree can't be deleted until the worktree is removed** — handle worktree removal first, branch deletion second.

## Step 1 — gather data (read-only, no confirmation needed)

1. `git fetch --prune` (safe: updates remote-tracking refs and drops refs to branches deleted on the remote; touches nothing local).
2. Detect the default branch: try `git symbolic-ref refs/remotes/origin/HEAD`, falling back to whichever of `main`/`master` exists.
3. `git worktree list --porcelain` — get every worktree path, branch, and HEAD.
4. `git worktree prune -v` — removes registrations for worktrees whose directory is already gone from disk. Always safe, do it without asking, but report what it pruned.
5. `git for-each-ref refs/heads --format="%(refname:short)|%(committerdate:iso-strict)|%(upstream:short)|%(upstream:track)"` — every local branch with its last commit date and upstream tracking state.
6. `git branch --merged <default-branch>` — which branches are fully merged into the default branch.
7. Note the current branch (`git branch --show-current`).
8. If `gh` is available (see memory: it may not be on PATH — try `"C:\Program Files\GitHub CLI\gh.exe"` too, otherwise skip this check silently), for branches you're about to classify as deletable, check `gh pr list --head <branch> --state open` — if an open PR exists, treat that branch as protected regardless of merge state.

## Step 2 — classify every non-default, non-current branch

For each worktree directory found in step 1 (other than the main one), run `git -C <path> status --porcelain` to see if it's dirty (uncommitted changes or untracked files).

Bucket each branch:

- **PROTECTED** — default branch, current branch, `develop`/`staging`/`release/*`-style names, or has an open PR. Skip entirely, don't even list as a candidate.
- **SAFE — auto-delete** — merged into the default branch, no unpushed commits ahead of its upstream (or no upstream at all but merged), and either has no worktree or has a *clean* worktree.
- **NEEDS-WORKTREE-REMOVAL-FIRST** — same as SAFE but has a worktree directory that must be removed before the branch ref can go; still safe if that worktree is clean.
- **ASK** — everything else: not merged into default, diverged/ahead of upstream, dirty worktree, no upstream and unclear if it was ever pushed/reviewed, or last commit is very recent (say, under 48 hours — likely still active work in progress).

## Step 3 — report

Print a compact report grouped by bucket, one line per branch: name, last commit date/age, merge status, worktree path if any (and whether it's clean/dirty). Call out anything `git worktree prune` already removed. If `--dry-run` was passed, stop here.

## Step 4 — confirm and execute

- If SAFE / NEEDS-WORKTREE-REMOVAL-FIRST is non-empty: propose deleting all of them in one batch ("I'll remove these N clean, merged branches/worktrees: ... — proceed?"). A single plain-language confirmation is enough for this bucket since every item already met the same high-confidence bar — don't interrogate the user item by item.
- If ASK is non-empty: this is where you actually need the user's judgment, since these don't meet the safe bar. If there are ≤4 ambiguous items, use AskUserQuestion with multiSelect so the user can pick which (if any) to delete anyway, with the reason (unmerged / dirty / diverged / recent) shown in each option's description. If there are more than 4, present them as a plain list in your report and ask conversationally which ones (if any) they want deleted — don't force a 4-option tool onto a longer list.
- Never delete something the user didn't clearly approve, and never assume silence means yes.

Execute in this order per approved branch:
1. If it has a worktree: `git worktree remove <path>` (add `--force` only if the user explicitly approved deleting a dirty worktree).
2. Then the branch: `git branch -d <branch>` (use `-D` only if the user explicitly approved force-deleting an unmerged branch).

## Step 5 — summary

End with a short summary: what was pruned automatically, what was deleted after confirmation, what was left alone and why (still active / user said keep / needs their judgment later).

---
description: Find stale local branches and worktrees and clean them up — auto-remove what's safely inactive, ask about the rest; optionally prune matching remote branches too, always with a separate explicit confirmation
argument-hint: [--dry-run] [--remote] [branch-or-worktree-name-filter]
---

You clean up git branches and worktrees that have piled up from finished feature work. This is a maintenance task, not a refactor — be conservative, be transparent. **Local cleanup is the safe default; deleting anything on `origin` is opt-in and always confirmed separately.**

Arguments (optional): $ARGUMENTS
- `--dry-run` — report and classify only, delete nothing, don't even ask.
- `--remote` — also classify branches on `origin` and offer to delete the safe ones there, not just locally. Without this flag, remote branches are only ever reported as candidates, never deleted. (You can also just ask for this in plain language instead of passing the flag.)
- a filter string — only consider branches/worktrees whose name contains it.

## Hard rules (never violate)

- **Local is the default and the safety net.** Local branch/worktree deletion never touches `origin`. `git fetch --prune` / `git remote prune origin` (read-only bookkeeping of remote-tracking refs) are always fine to run.
- **Deleting a branch on `origin` is opt-in, and always its own separate confirmation.** Only consider it if `--remote` was passed or the user explicitly asks for it, in this run. Even then: classify remote branches with the same PROTECTED/SAFE/ASK rules as local (Step 2), report them, and get one explicit confirmation for the remote batch that is **separate from** the local-deletion confirmation in Step 4 — never fold "delete these local branches" and "delete these on origin" into a single yes/no, and never infer remote approval from a local one. Remote branches are shared and visible to every collaborator and harder to walk back than a local delete, so hold them to a stricter bar: skip anything with an open PR, anything ahead of what's merged, and (for branches with no local counterpart) anything committed to in the last 48 hours.
- **Never force anything without an explicit answer.** `git branch -d` (safe delete) is the only local-delete command by default. `git push origin --delete <branch>` is the only remote-delete command, ever — never `git push --force`, never non-standard refspecs, never on a branch that's ahead of its merge target.
- **Never delete or touch:** the branch currently checked out in the main working directory, the repo's default branch (`main`/`master`/whatever `origin/HEAD` points to) locally or on `origin`, and any branch matching common long-lived names (`develop`, `staging`, `release/*`) locally or on `origin` — unless the user explicitly names one of these in their filter/answer.
- **A branch checked out in a worktree can't be deleted until the worktree is removed** — handle worktree removal first, branch deletion second.

## Step 1 — gather data (read-only, no confirmation needed)

1. `git fetch --prune` (safe: updates remote-tracking refs and drops refs to branches deleted on the remote; touches nothing local or on `origin`).
2. Detect the default branch: try `git symbolic-ref refs/remotes/origin/HEAD`, falling back to whichever of `main`/`master` exists.
3. `git worktree list --porcelain` — get every worktree path, branch, and HEAD.
4. `git worktree prune -v` — removes registrations for worktrees whose directory is already gone from disk. Always safe, do it without asking, but report what it pruned.
5. `git for-each-ref refs/heads --format="%(refname:short)|%(committerdate:iso-strict)|%(upstream:short)|%(upstream:track)"` — every local branch with its last commit date and upstream tracking state.
6. `git branch --merged <default-branch>` — which local branches are fully merged into the default branch.
7. Note the current branch (`git branch --show-current`).
8. If `gh` is available (see memory: it may not be on PATH — try `"C:\Program Files\GitHub CLI\gh.exe"` too, otherwise skip this check silently), for any branch you're about to classify as deletable (local or remote), check `gh pr list --head <branch> --state open` — if an open PR exists, treat that branch as protected regardless of merge state.
9. If `--remote` was passed, or the user asked for remote cleanup: also run `git for-each-ref refs/remotes/origin --format="%(refname:short)|%(committerdate:iso-strict)"` (excluding `origin/HEAD`) and `git branch -r --merged origin/<default-branch>` to get every remote branch's age and merge state.

## Step 2 — classify every non-default, non-current branch

For each worktree directory found in step 1 (other than the main one), run `git -C <path> status --porcelain` to see if it's dirty (uncommitted changes or untracked files).

Bucket each **local** branch:

- **PROTECTED** — default branch, current branch, `develop`/`staging`/`release/*`-style names, or has an open PR. Skip entirely, don't even list as a candidate.
- **SAFE — auto-delete** — merged into the default branch, no unpushed commits ahead of its upstream (or no upstream at all but merged), and either has no worktree or has a *clean* worktree.
- **NEEDS-WORKTREE-REMOVAL-FIRST** — same as SAFE but has a worktree directory that must be removed before the branch ref can go; still safe if that worktree is clean.
- **ASK** — everything else: not merged into default, diverged/ahead of upstream, dirty worktree, no upstream and unclear if it was ever pushed/reviewed, or last commit is very recent (say, under 48 hours — likely still active work in progress).

If `--remote` was passed (or requested), also bucket every **remote** branch on `origin` (other than `origin/HEAD` and the default branch):

- **PROTECTED** — default branch, `develop`/`staging`/`release/*`-style names, or has an open PR.
- **SAFE — auto-delete** — merged into `origin/<default>`, AND (if a same-named local branch exists) that local branch is itself SAFE or already deleted. Never mark a remote branch SAFE if its local counterpart is in ASK, or if it has no local counterpart and its last commit is under 48 hours old.
- **ASK** — everything else: not merged, local counterpart is in ASK/diverged, no local counterpart and recent, or merge state can't be confirmed.

## Step 3 — report

Print a compact report grouped by bucket, one line per branch: name, last commit date/age, merge status, worktree path if any (and whether it's clean/dirty). If remote branches were classified, report them in a clearly separate "Remote (origin)" section using the same bucket labels. Call out anything `git worktree prune` already removed. If `--dry-run` was passed, stop here.

If `--remote` was **not** passed and there are remote branches that look stale (merged into default, no open PR), mention them briefly — e.g. "N branches on origin also look stale — pass `--remote` or just say so if you'd like me to check those too" — but do not classify or act on them further this run.

## Step 4 — confirm and execute (local)

- If SAFE / NEEDS-WORKTREE-REMOVAL-FIRST is non-empty: propose deleting all of them in one batch ("I'll remove these N clean, merged local branches/worktrees: ... — proceed?"). A single plain-language confirmation is enough for this bucket since every item already met the same high-confidence bar — don't interrogate the user item by item.
- If ASK is non-empty: this is where you actually need the user's judgment, since these don't meet the safe bar. If there are ≤4 ambiguous items, use AskUserQuestion with multiSelect so the user can pick which (if any) to delete anyway, with the reason (unmerged / dirty / diverged / recent) shown in each option's description. If there are more than 4, present them as a plain list in your report and ask conversationally which ones (if any) they want deleted — don't force a 4-option tool onto a longer list.
- Never delete something the user didn't clearly approve, and never assume silence means yes.

Execute in this order per approved local branch:
1. If it has a worktree: `git worktree remove <path>` (add `--force` only if the user explicitly approved deleting a dirty worktree).
2. Then the branch: `git branch -d <branch>` (use `-D` only if the user explicitly approved force-deleting an unmerged branch).

## Step 5 — confirm and execute (remote, only if `--remote` was passed or requested)

This is a **separate confirmation from Step 4**, even right after the local batch was approved — deleting a branch on `origin` is visible to every collaborator and harder to undo than a local delete.

- Present the remote SAFE bucket as its own explicit list — e.g. "These N branches on `origin` are merged into `<default>` with no open PR: ... — delete them from `origin` too?" Do not bundle this question with the local one, and do not proceed on an ambiguous or partial answer.
- If the remote ASK bucket is non-empty, surface it the same way as local ASK (AskUserQuestion for ≤4 items, plain list otherwise) — never auto-delete anything in this bucket.
- Only ever run `git push origin --delete <branch>` for a branch the user just explicitly approved in this step. Never infer approval from the local-branch confirmation, and never touch a remote branch that has no matching approved entry.

## Step 6 — summary

End with a short summary: what was pruned automatically, what was deleted locally after confirmation, what was deleted on `origin` after confirmation (if any), and what was left alone and why (still active / user said keep / needs their judgment later).

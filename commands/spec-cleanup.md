---
description: Finalize finished-but-open spec issues and flag long-stale SDD issues — conservative, human-gated
argument-hint: [--dry-run] [--delete] [--stale-days=N] [slug-filter]
disable-model-invocation: true
---

You keep the **SDD issues** tidy on GitHub. Because a shipped feature's spec issue is closed automatically by `/implement`, GitHub already keeps the default list clean — so this command is light: it **finalizes** features that finished but were never closed, and **flags** long-stale SDD issues. This is maintenance, not a refactor — be conservative, be transparent, and never touch code or the active feature.

**Preconditions:** `gh` installed + authenticated, GitHub remote present. If not, say so and stop.

Arguments (optional): $ARGUMENTS
- `--dry-run` — classify and report only, change nothing, don't even ask.
- `--delete` — **permanently delete** the finalized issues (`gh issue delete`) instead of closing them (opt-in, destructive; closing is the default).
- `--stale-days=N` — age threshold for the stale sweep (default **60**). Open specs untouched longer than this that aren't finished are flagged for your judgment.
- a filter string — only consider features whose slug contains it.

## Hard rules (never violate)

- **Never touch code or any file.** This command acts only on GitHub issues via `gh`.
- **Never touch non-SDD issues.** Only ever act on issues labeled `sdd`.
- **Never touch the active feature.** If `.claude/sdd/phase` exists, read its `<phase>:<slug>` and treat that slug as PROTECTED — it's mid-planning behind an open gate. Do not finalize, close, or delete its issue.
- **Close by default; delete only on `--delete`.** Closing preserves history and is reversible (`gh issue reopen`). Deletion is permanent — only on explicit `--delete`, and confirmed per item.
- **Never remove anything the user didn't clearly approve**, and never assume silence means yes. `--dry-run` and age-stale items are report-or-ask only.
- **This command writes no gate marker.** It reads `.claude/sdd/phase` (to protect the active slug) but never creates or deletes it.

## Step 1 — gather data (read-only, no confirmation needed)

1. Read `.claude/sdd/phase` if present — note the active `<slug>` (PROTECTED).
2. List spec issues: `gh issue list --label sdd --state all --json number,title,labels,state,url,body,updatedAt --limit 500`. The slug is the `<slug>` in each `[SDD] <slug>: …` title. For each, count checked vs total checkbox lines in its `## Tasks` section.
3. Apply the slug filter, if any.

## Step 2 — classify each feature

- **PROTECTED** (skip, don't list as a candidate): the active-gate slug; and any spec issue that is still live work (open, status `draft`/`planned`/`in-progress`, not age-stale).
- **SAFE — finalize** (high-confidence, one batch confirmation): an **open** spec issue whose `## Tasks` checklist is **all checked** (`total > 0 && checked == total`) but that isn't yet `sdd:done`/closed. Action: `gh issue edit <n> --add-label sdd:done` and `--remove-label` whichever other `sdd:*` status label is present, then `gh issue close <n> --reason completed` (or delete it with `--delete`).
- **ASK** (needs your judgment — never auto-remove): **Age-stale** — an open spec issue whose `updatedAt` is older than `--stale-days` and that isn't finished (e.g. an `in-progress` feature that looks abandoned).

## Step 3 — report

Print a compact report grouped by bucket, one line per issue: slug/number, `sdd:*` status, open/closed, task progress `N/M`, age (from `updatedAt`), and what would happen (finalize-close / delete / keep). List age-stale items in the ASK section with the reason shown. If `--dry-run` was passed, stop here.

## Step 4 — confirm and execute

- If SAFE is non-empty: propose the whole batch in one go ("I'll mark these N finished features `sdd:done` and close them: … — proceed?"). One plain-language confirmation is enough for this bucket, since every item met the same all-tasks-checked bar — don't interrogate item by item.
- If ASK is non-empty: this is where your judgment is needed. For ≤4 items use `AskUserQuestion` with `multiSelect` so you can pick which (if any) to close/delete, with the reason (age-stale / abandoned) in each option's description. For more than 4, present a plain list and ask conversationally.

Execute per approved item (issues only, via `gh`):
1. **SAFE:** relabel `sdd:done` and close (as above); with `--delete`, `gh issue delete <n> --yes` instead.
2. **ASK approvals:** close (default) or `gh issue delete <n> --yes` (only with `--delete`), per what you approved.
3. Never touch the active-gate slug or any non-SDD issue.

## Step 5 — summary

End with a short summary: which finished features were finalized (labeled done + closed), which age-stale items you closed/deleted after confirmation, and what was left alone and why (still active / protected by the gate / you chose to keep it).

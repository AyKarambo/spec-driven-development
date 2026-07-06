---
description: Archive the plan/tasks scaffolding of shipped features and flag stale/orphaned spec artifacts — conservative, human-gated
argument-hint: [--dry-run] [--delete] [--stale-days=N] [slug-filter]
disable-model-invocation: true
---

You clean up **spec artifacts** under `specs/` that have piled up as spec-driven features finished. The **spec is a durable living document** — this command retires the throwaway **scaffolding** (plan + tasks) of shipped features and flags stale or orphaned files, but keeps every spec. This is maintenance, not a refactor — be conservative, be transparent, and never touch code or the active feature.

Arguments (optional): $ARGUMENTS
- `--dry-run` — classify and report only, change nothing, don't even ask.
- `--delete` — `git rm` the retired plan/tasks instead of archiving them (opt-in; archiving is the default).
- `--stale-days=N` — age threshold for the stale sweep (default **60**). Artifacts untouched longer than this that aren't clearly done are flagged for your judgment.
- a filter string — only consider features whose slug contains it.

## Hard rules (never violate)

- **The spec stays.** Never move, archive, or delete a `specs/<slug>.spec.md` file. When a feature is done, the spec is kept in place and stamped `status: done` — only its `<slug>.plan.md` and `<slug>.tasks.md` are retired.
- **Never touch code.** Only ever act on files under `specs/`. Never edit, move, or delete anything outside it.
- **Never touch the active feature.** If `.claude/sdd/phase` exists, read its `<phase>:<slug>` and treat that slug as PROTECTED — it's mid-planning behind an open gate. Do not archive or delete any of its artifacts, and do not stamp its status.
- **Archive by default; delete only on `--delete`.** The default action moves scaffolding to `specs/archive/` (recoverable, history-preserving). Deletion (`git rm`) happens only when `--delete` was passed.
- **Never remove anything the user didn't clearly approve**, and never assume silence means yes. `--dry-run` and orphan/age-stale items in particular are report-or-ask only.
- **This command writes no gate marker.** It reads `.claude/sdd/phase` (to protect the active slug) but never creates or deletes it. (It is not itself a planning gate.)

## Step 1 — gather data (read-only, no confirmation needed)

1. Read `.claude/sdd/phase` if present — note the active `<slug>` (PROTECTED).
2. Scan `specs/` (top level, not `specs/archive/`) for every feature's artifacts: `<slug>.spec.md`, `<slug>.plan.md`, `<slug>.tasks.md`. Group by slug.
3. For each spec, read its frontmatter `status:` (`draft` | `planned` | `in-progress` | `done`) if present.
4. For each `<slug>.tasks.md`, count checked vs total checklist items (`- [x]` vs `- [ ]`) — "all checked" is the fallback done-signal when a spec has no `status:` frontmatter.
5. For age: get each artifact's last-change time (prefer `git log -1 --format=%cI -- <file>`; fall back to file mtime). Compare against `--stale-days` (default 60).
6. Apply the slug filter, if any.

## Step 2 — classify each feature

- **PROTECTED** (skip, don't list as a candidate): the active-gate slug; any feature whose spec is `draft`/`planned`/`in-progress` and is **not** age-stale (still live work).
- **SAFE — auto-archive** (high-confidence, one batch confirmation): the feature is **shipped** — spec `status: done`, **or** (no `status:`) its `<slug>.tasks.md` has all items checked. Action: retire `<slug>.plan.md` + `<slug>.tasks.md` (archive, or delete with `--delete`), and stamp the spec `status: done` (backfill the frontmatter block if missing). The spec file itself stays in `specs/`.
- **ASK** (needs your judgment — never auto-remove):
  - **Orphans** — a `<slug>.plan.md` or `<slug>.tasks.md` with no matching `<slug>.spec.md` (could be lost work, or leftovers from a renamed/removed spec).
  - **Age-stale** — any artifact untouched longer than `--stale-days` that isn't clearly done (e.g. an `in-progress` feature that looks abandoned).

## Step 3 — report

Print a compact report grouped by bucket, one line per feature: slug, `status:` (or "no status"), impl progress `N/M` from tasks, artifact ages, and what would happen (archive / delete / keep-spec-stamp-done). List orphans and age-stale items in the ASK section with the reason shown. If `--dry-run` was passed, stop here.

## Step 4 — confirm and execute

- If SAFE is non-empty: propose the whole batch in one go ("I'll archive the plan+tasks of these N shipped features and stamp their specs done: … — proceed?"). One plain-language confirmation is enough for this bucket, since every item met the same shipped bar — don't interrogate item by item.
- If ASK is non-empty: this is where your judgment is needed. For ≤4 items use `AskUserQuestion` with `multiSelect` so you can pick which (if any) to archive/delete, with the reason (orphan / age-stale / abandoned) in each option's description. For more than 4, present a plain list and ask conversationally.

Execute per approved feature (all paths under `specs/` only):
1. Ensure `specs/archive/` exists.
2. Retire scaffolding: `git mv specs/<slug>.plan.md specs/archive/` and the same for `.tasks.md` (plain move if the file isn't git-tracked). With `--delete`: `git rm` those files instead.
3. For SAFE features, stamp the kept spec `specs/<slug>.spec.md` `status: done` and update `updated:` to today's date (add the frontmatter block if the spec has none).
4. Never move or delete the `.spec.md` file, and never touch the active-gate slug.

## Step 5 — summary

End with a short summary: which shipped features were retired (and where their scaffolding went), which specs were stamped done, what orphans/age-stale items you archived/deleted after confirmation, and what was left alone and why (still active / protected by the gate / you chose to keep it).

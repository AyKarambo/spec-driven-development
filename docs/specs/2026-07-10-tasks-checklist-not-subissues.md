# Design: tasks as a checklist in the spec issue, not sub-issues

_Date: 2026-07-10 · Status: approved-for-planning · Author: Timo Seikel + Claude_

## 1 · Context

[2026-07-08-v0.4-github-issues.md](2026-07-08-v0.4-github-issues.md) moved specs, plans, and tasks off
the local filesystem and onto GitHub: one **spec issue** per feature (`[SDD] <slug>: <title>`) carrying
the user story and an optional `## Technical Plan` section, with each **task** as a native GitHub
**sub-issue** (`gh issue create --parent <spec#>`), progress read from `subIssuesSummary`.

This addendum changes exactly one part of that design: **where the task list lives.** Everything else
in the v0.4 design — one issue per feature, the `sdd`/`sdd:*` status-label lifecycle, `gh`-only with no
local fallback, up-front preconditions, and `/implement`'s difficulty-graded executors — is unchanged
and still governs.

## 2 · Decision

**Tasks are a checklist inside the spec issue body, not sub-issues.** A third marked section,
`## Tasks` (between `<!-- sdd:tasks:start -->` / `<!-- sdd:tasks:end -->`, mirroring the existing
`sdd:plan` marker pair), holds one line per task in GitHub's native task-list syntax:

```markdown
- [ ] **T1: <goal>** (S/M/L)
  - Files: <what will likely be touched>
  - Check: <how you tell it's done>
```

- **Progress** is the checked/total count of top-level checklist lines in that section — read directly
  from the issue body — instead of `subIssuesSummary`.
- **Done** = the line's box is checked (`- [x]`), pushed via `gh issue edit <n> --body-file -` on the
  same issue, instead of closing a separate sub-issue.
- **`/breakdown`** fills the `## Tasks` section once (analogous to how `/techplan` fills `## Plan`);
  **`/implement`** flips one checkbox per task; **`/revise`** edits the section directly, preserving
  the checked state of any task it isn't touching.
- **The `sdd:task` label is retired** — there's nothing left to label, since a task is a line, not an
  issue. The label set shrinks to `sdd`, `sdd:draft`, `sdd:planned`, `sdd:in-progress`, `sdd:done`.
- **`/spec-cleanup`'s orphan-task-issue check is retired** for the same reason (no more free-floating
  task issues to go orphaned). Its stale-open-spec check is unchanged.
- The spec-issue status lifecycle, auto-close-on-last-task behavior, and `/sdd-auto`'s resume/implementation
  logic are otherwise unchanged — they just read "all tasks checked" instead of "all sub-issues closed."

## 3 · Why override the v0.4 decision

Requested directly: one issue holding the whole feature end-to-end — reading it top to bottom shows
spec, plan, and task progress in one place — was preferred over spreading tasks across N linked
issues. A side benefit: this drops the `gh` sub-issue feature-support requirement entirely, so the
plugin now only needs basic `issue create/edit/view` support, not the newer `--parent` flag.

## 4 · Non-goals

- No migration tooling for spec issues that already have real sub-issues from the v0.4 era — those are
  out of scope; a repo adopting this addendum just starts fresh features with the checklist model.
- No hybrid mode (some features on sub-issues, some on checklists) — one mechanism, repo-wide.

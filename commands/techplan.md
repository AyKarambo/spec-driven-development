---
description: Derive the technical plan (the HOW) from an approved spec issue — with parallel codebase research
argument-hint: [feature slug/name — the one that holds the spec issue]
disable-model-invocation: true
---

You create the **technical plan** (the HOW) and record it **in the spec issue** for the feature: $ARGUMENTS

The plan is the *technical* answer to the spec's *user story*. It lives as a **`## Technical Plan` section inside the same spec issue** — recommended for bigger features, and skippable for small ones (you can go straight to `/breakdown`).

**The issue is the only store — never write the plan to a file.** The plan is a section *inside the spec issue*, not a repo file. Do **not** create or write it to a Markdown file (no `plan.md`, `techplan.md`, `docs/plan.md`, `<slug>-plan.md`, …). Aside from the one-line `.claude/sdd/phase` gate marker, the only content this command writes to disk is a **transient** body file under `.claude/sdd/` — used solely to pipe the updated issue body into `gh`, then deleted — and it is never a `.md`. (A gate hook enforces this: while the marker is set, `.md` writes outside `CLAUDE.md`/`AGENTS.md`/`.claude/rules/**` are denied.)

**Preconditions (verify first, stop with guidance if missing):** `gh` installed + authenticated, and a GitHub remote exists. If not, stop and explain.

1. **Find the approved spec issue.** Resolve the **slug** from `$ARGUMENTS` (else the current branch). Locate the issue: `gh issue list --label sdd --state all --limit 500 --json number,title,body,state,labels,url` and match the one whose title starts with `[SDD] <slug>:`. **If none matches, stop** and point to `/spec`. Read its body. Also follow the project rules from CLAUDE.md / AGENTS.md, if present.
2. **Gate marker:** write `.claude/sdd/phase` with the line `plan:<slug>` and leave it in place.
3. **Research the codebase before proposing.** Dispatch several `Explore` subagents in parallel to survey the areas the spec touches — existing patterns, affected modules, data models, test setup, and integration points. Ground the plan in how this codebase actually works. (You can also use native Plan Mode / `/plan` for read-only exploration.)
4. Draft the **Technical Plan** with:
   - **Architecture & Approach** – how the spec is implemented
   - **Affected Files/Modules** – where things change or are created
   - **Data Model / Interfaces** – if relevant
   - **Test Strategy** – how the acceptance criteria are verified
   - **Risks & Alternatives** – trade-offs
5. Present the plan for review (**gate**) — do **not** write feature code and do **not** touch the issue yet. **Only after I approve, record it in the spec issue:**
   - Read the current body (`gh issue view <n> --json body -q .body`), replace the content **between** the `<!-- sdd:plan:start -->` and `<!-- sdd:plan:end -->` markers with a `## Technical Plan` heading followed by the plan (leave the markers, and the separate `<!-- sdd:tasks:start/end -->` pair, untouched), write the new body to a transient non-`.md` file (`.claude/sdd/issue-body.txt`), run `gh issue edit <n> --body-file .claude/sdd/issue-body.txt`, then **delete the temp file**.
   - **Advance the lifecycle to `sdd:planned`:** `gh issue edit <n> --add-label sdd:planned` and remove whichever *other* `sdd:*` status label the issue currently has (you already have its labels from step 1 — typically `--remove-label sdd:draft`; only pass `--remove-label` for labels that are actually present). If the issue was **closed** (e.g. from `/reverse-spec`), first reopen it (`gh issue reopen <n>`).

Note: `/techplan` is its own command — don't confuse it with the native `/plan` (= Plan Mode).

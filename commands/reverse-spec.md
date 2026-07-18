---
description: Generate a spec issue from existing code (brownfield) — adopt the workflow on legacy features
argument-hint: [feature slug/name + the feature/area to document, e.g. "invoice-export the invoice export"]
disable-model-invocation: true
---

You write a **spec for existing code** (reverse-engineered) and open it as a **GitHub issue**: $ARGUMENTS

This lets the spec-driven workflow apply to features that already exist, not just new ones.

**The issue is the only store — never write the spec to a file.** The reverse-engineered spec (and any later plan/tasks) lives in the GitHub issue, not in the repo. Do **not** create or write it to a Markdown file (no `spec.md`, `specs/` folder, `<slug>.md`, …). Aside from the one-line `.claude/sdd/phase` gate marker, the only content this command writes to disk is a **transient** body file under `.claude/sdd/` — used solely to pipe text into `gh`, then deleted — and it is never a `.md`. (A gate hook enforces this: while the marker is set, `.md` writes outside `CLAUDE.md`/`AGENTS.md`/`.claude/rules/**` are denied.)

**Preconditions (verify first, stop with guidance if missing):** `gh` is installed and authenticated (`gh auth status`), and the repo has a GitHub remote (`gh repo view`). If not, stop and explain — specs live in GitHub issues.

1. **Identify the feature slug** to attach the spec to (from `$ARGUMENTS`, else the current branch). **Gate marker:** write `.claude/sdd/phase` with the line `reverse-spec:<slug>` and leave it in place — it keeps the planning gate active through review until `/implement` clears it.
2. Explore the relevant code (read-only; use `Explore` subagents if the area is large) to understand what it actually does — inputs, outputs, behavior, edge cases, and constraints already enforced.
3. Draft the spec issue **body** in the same shape as `/spec`, reconstructed from the code:
   ```markdown
   <!-- sdd:slug=<slug> -->
   ## User Story (Intent — WHAT & WHY)   — reconstructed from the code and its usage
   ## In Scope / Out of Scope
   ## Constraints                        — limits/assumptions the code already relies on
   ## Acceptance Criteria                — *Given / When / Then*, matching current behavior
   ## Open Questions                     — behavior that's ambiguous or looks unintended (flag it, don't "fix" it)

   <!-- sdd:plan:start -->
   <!-- sdd:plan:end -->

   <!-- sdd:tasks:start -->
   <!-- sdd:tasks:end -->
   ```
4. Mark clearly where you **inferred** intent versus where it's **explicit** in the code.
5. Present the spec for review (**gate**) — do **not** change any code and do **not** create the issue yet. **Only after I approve:**
   - **Ensure the SDD labels exist** (idempotent — same set and colors as `/spec`: `sdd`, `sdd:draft`, `sdd:planned`, `sdd:in-progress`, `sdd:done`; `gh label create … 2>/dev/null || true`).
   - **Create the issue as already-shipped:** write the body to a transient, non-`.md` temp file (`.claude/sdd/issue-body.txt`) and run `gh issue create --title "[SDD] <slug>: <short title>" --body-file .claude/sdd/issue-body.txt --label sdd --label sdd:done`, **delete the temp file**, then **close it** (`gh issue close <n> --reason completed`) — reverse-spec documents behavior that already shipped, so it starts `done`.
   - Report the issue number and URL.

From here the normal flow applies to any changes: a `/techplan` or `/revise` for new work **reopens** the issue and moves it back to `sdd:planned`.

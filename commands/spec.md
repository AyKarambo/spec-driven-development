---
description: Turn a story/idea into a spec issue on GitHub — intent, boundaries, acceptance criteria (before code)
argument-hint: [feature slug/name — or empty to infer from the current branch]
disable-model-invocation: true
---

You draft a **spec** (the user story — WHAT & WHY) and open it as a **GitHub issue**: $ARGUMENTS

The spec issue is the source of truth for spec-driven development. Spec first, then code. Follow the project rules from CLAUDE.md / AGENTS.md, if present.

**Preconditions (verify first, stop with guidance if missing):** `gh --version` and `gh auth status` succeed, and the repo has a GitHub remote (`gh repo view` succeeds). If not, stop and tell me to install/authenticate `gh` or add a GitHub remote — this plugin stores specs in GitHub issues, not files.

1. **Identify the feature slug.** Take it from `$ARGUMENTS`; if empty, infer a short kebab-case slug from the current branch name or the feature being discussed. State the slug you resolved — if you can't determine one, stop and ask. **Check it's free:** `gh issue list --label sdd --state all --limit 500 --json number,title` and see whether any title starts with `[SDD] <slug>:` — if one already exists, stop and point to `/revise` or `/status`.
2. **Gate marker:** write `.claude/sdd/phase` with the single line `spec:<slug>`. Leave it in place — it keeps the planning gate active through review until `/implement` clears it.
3. **Clarify first — this is the gate that prevents "vibe-specifying".** If anything about users, goal, scope, or edge cases is ambiguous, ask me sharp clarifying questions before writing. **2–3 is the norm, but never cap yourself there** — it's far better to ask another round than to leave **Open Questions** on the table or bake in an assumption. Keep asking until every ambiguity that materially affects what to build is resolved. Record my answers under **Resolved Questions**, so the de-risking is visible and not lost.
4. Draft the spec issue **body** with a hidden slug anchor first, then the sections:
   ```markdown
   <!-- sdd:slug=<slug> -->
   ## User Story (Intent — WHAT & WHY)   — the problem and the benefit, not the solution
   ## In Scope / Out of Scope            — clear boundaries
   ## Constraints                        — technical/business limits, non-goals
   ## Acceptance Criteria                — testable, in *Given / When / Then* format
   ## Resolved Questions                 — the clarifications above, with the decisions taken
   ## Open Questions                     — anything still to clarify

   <!-- sdd:plan:start -->
   <!-- sdd:plan:end -->

   <!-- sdd:tasks:start -->
   <!-- sdd:tasks:end -->
   ```
   Leave the empty `sdd:plan` and `sdd:tasks` marker pairs at the end — `/techplan` fills the
   **## Technical Plan** between the first pair later (optional for small features), and `/breakdown`
   fills **## Tasks** between the second.
5. Phrase it so every reader arrives at the same interpretation.
6. Present the drafted spec for review (**gate**) — do **not** write code and do **not** create the issue yet. **Only after I approve:**
   - **Ensure the SDD labels exist** (idempotent): for each of `sdd` (color `5319E7`), `sdd:draft` (`BFDADC`), `sdd:planned` (`1D76DB`), `sdd:in-progress` (`FBCA04`), `sdd:done` (`0E8A16`) run `gh label create <name> --color <hex> --description "spec-driven development" 2>/dev/null || true`.
   - **Create the spec issue:** write the body to a temp file (e.g. `.claude/sdd/spec-body.md` — gitignored and gate-allowed) and run `gh issue create --title "[SDD] <slug>: <short title>" --body-file <that file> --label sdd --label sdd:draft`. Report the created issue number and URL.

The status **label** drives the lifecycle: `/techplan` advances it to `sdd:planned`, `/implement` to `sdd:in-progress` then `sdd:done` (and closes the issue), and `/revise` reopens it. The spec is a living document — use `/revise` when it changes. Only after approval do we move to the plan (`/techplan`) or straight to `/breakdown` for a small feature — or, if you want it hands-off from here, `/sdd-auto` runs everything from plan to an open PR autonomously.

---
description: Turn a story/idea into a spec — intent, boundaries, acceptance criteria (before code)
argument-hint: [feature slug/name — or empty to infer from the current branch]
disable-model-invocation: true
---

You draft a **spec** for: $ARGUMENTS

The spec is the source of truth for spec-driven development. Spec first, then code. Follow the project rules from CLAUDE.md / AGENTS.md, if present.

1. **Identify the feature slug.** Take it from `$ARGUMENTS`; if empty, infer a short kebab-case slug from the current branch name or the feature being discussed. State the slug you resolved — if you can't determine one, stop and ask.
2. **Gate marker:** write `.claude/sdd/phase` with the single line `spec:<slug>`. Leave it in place — it keeps the planning gate active through review until `/implement` clears it.
3. **Clarify first — this is the gate that prevents "vibe-specifying".** If anything about users, goal, scope, or edge cases is ambiguous, ask me **2–3 sharp clarifying questions before writing**. Record my answers under **Resolved questions**, so the de-risking is visible and not lost.
4. Draft the spec (in the conversation — don't publish anything yet) with these sections:
   - **Intent (WHAT & WHY)** – the problem and the benefit, not the solution
   - **In-Scope / Out-of-Scope** – clear boundaries
   - **Constraints** – technical/business limits, non-goals
   - **Acceptance Criteria** – testable, in *Given / When / Then* format
   - **Resolved questions** – the clarifications above, with the decisions taken
   - **Open Questions** – anything still to clarify
5. Phrase it so every reader arrives at the same interpretation.
6. Present the drafted spec for review (**gate**) — do **not** write code.
7. **Only after I approve**, publish it. This plugin has no local artifact files for specs — the feature's GitHub issue is the only home:
   - Search for an existing issue titled exactly `Feature: <slug>` (`gh issue list --search "\"Feature: <slug>\" in:title" --state all --json number,title,state,body,url`, or a connected GitHub MCP issue-search tool). If found, replace its `## Spec` section, leaving any existing `## Plan`/`## Tasks` sections untouched.
   - Otherwise, create **one** new issue titled `Feature: <slug>` whose body opens with a `## Spec` section holding the approved draft (`gh issue create --title "Feature: <slug>" --body-file -`).
   - **If neither the `gh` CLI (installed and authenticated) nor a connected GitHub MCP server's issue tools are available, stop here** and tell me to set one up — do not write the spec anywhere else.

The spec is a living document — use `/revise` when it changes. Only after approval do we move to the plan (`/techplan`).

---
description: Generate a spec from existing code (brownfield) — adopt the workflow on legacy features
argument-hint: [feature slug/name + the feature/area to document, e.g. "invoice-export the invoice export"]
disable-model-invocation: true
---

You write a **spec for existing code** (reverse-engineered): $ARGUMENTS

This lets the spec-driven workflow apply to features that already exist, not just new ones.

1. **Identify the feature slug** to attach the spec to (from `$ARGUMENTS`, else the current branch). **Gate marker:** write `.claude/sdd/phase` with the line `reverse-spec:<slug>` and leave it in place — it keeps the planning gate active through review until `/implement` clears it.
2. Explore the relevant code (read-only; use `Explore` subagents if the area is large) to understand what it actually does — inputs, outputs, behavior, edge cases, and constraints already enforced.
3. Draft the spec in the same shape as `/spec`:
   - **Intent (WHAT & WHY)** – reconstructed from the code and its usage
   - **In-Scope / Out-of-Scope**
   - **Constraints** – limits/assumptions the code already relies on
   - **Acceptance Criteria** – *Given / When / Then*, matching current behavior
   - **Open Questions** – behavior that's ambiguous or looks unintended (flag it, don't "fix" it)
4. Mark clearly where you **inferred** intent versus where it's **explicit** in the code.
5. Present the spec for review (**gate**) — do **not** change any code. **Only after I approve**, publish it:
   - Search for an existing issue titled `Feature: <slug>` (as in `/techplan`). If found, replace its `## Spec` section, leaving `## Plan`/`## Tasks` untouched.
   - Otherwise, create **one** new issue titled `Feature: <slug>` whose body opens with a `## Spec` section holding the approved draft.
   - **If neither the `gh` CLI nor a connected GitHub MCP server's issue tools are available, stop here** and tell me to set one up — do not write the spec anywhere else.

From here the normal flow (`/techplan` → `/breakdown` → `/implement`) applies to any changes.

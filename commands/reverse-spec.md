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
5. Present the spec for review (**gate**) — do **not** change any code. **Only after I approve**, write it to `specs/<slug>.spec.md`. From here the normal flow (`/techplan` → `/breakdown` → `/implement`) applies to any changes.

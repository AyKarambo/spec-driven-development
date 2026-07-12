---
description: Set or update project principles & guardrails (writes CLAUDE.md, optionally bridges to AGENTS.md)
argument-hint: [optional focus, e.g. "Testing" or "API conventions"]
disable-model-invocation: true
---

You help capture the **project constitution** (principles & guardrails) — the one-time framework that all later specs, plans, and implementations follow.

Focus (optional): $ARGUMENTS

**Gate marker:** As your first action, write `.claude/sdd/phase` with the single line `constitution`. Delete this file again right before you present your result — the constitution is one-time setup, not a per-feature gate.

Approach:
1. Read the existing context where available: CLAUDE.md, AGENTS.md, README.md, and the build/package files (e.g. package.json).
2. If something essential is unclear (stack, test command, architecture, definition of done), ask me targeted questions before writing. **2–3 is the norm, but never cap yourself there** — it's far better to ask another round than to guess or bake in an assumption. Keep asking until everything essential to the constitution is nailed down.
3. Create or update **CLAUDE.md** with concise, concrete rules (rule of thumb: < 200 lines). Structure:
   - **Stack & Tooling** – languages, frameworks, package managers
   - **Build & Test** – exact commands (e.g. `npm test`)
   - **Conventions** – style, naming, folder structure (concrete: "2 spaces", not "clean")
   - **Guardrails** – what must never happen; security/privacy rules
   - **Definition of Done** – when a task counts as finished
4. **Share rules across tools.** If this repo is (or may be) used with GitHub Copilot as well as Claude Code, keep a single source of truth: put the shared rules in **`AGENTS.md`** and have `CLAUDE.md` import it with the line `@AGENTS.md`. Claude Code reads `CLAUDE.md` natively; Copilot reads `AGENTS.md` natively — this way both share one ruleset. Ask me which layout I want if it's unclear.
5. Write specifically and verifiably. Move large, path-specific rule sets out to `.claude/rules/`.

Do **not** write any feature code. Delete the `.claude/sdd/phase` marker, then show me the result for approval (gate).

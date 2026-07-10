---
description: Derive the technical plan (the HOW) from an approved spec — with parallel codebase research
argument-hint: [feature slug/name — the one that holds the spec]
disable-model-invocation: true
---

You create the **technical plan** (the HOW) for the feature: $ARGUMENTS

1. **Read the approved spec.** Take the feature **slug** from `$ARGUMENTS`; if empty, infer it from the current branch. Find the `Feature: <slug>` GitHub issue (`gh issue list --search "\"Feature: <slug>\" in:title" --state all --json number,title,state,body,url`, or a connected GitHub MCP issue-search tool) and read its `## Spec` section. **If no such issue or section exists, stop** and point to `/spec`. **If GitHub access isn't available at all, stop** and tell me to set up `gh` or a GitHub MCP server — there is no local fallback. Also follow the project rules from CLAUDE.md / AGENTS.md, if present.
2. **Gate marker:** write `.claude/sdd/phase` with the line `plan:<slug>` and leave it in place.
3. **Research the codebase before proposing.** Dispatch several `Explore` subagents in parallel to survey the areas the spec touches — existing patterns, affected modules, data models, test setup, and integration points. Ground the plan in how this codebase actually works. (You can also use native Plan Mode / `/plan` for read-only exploration.)
4. Draft the plan (in the conversation — don't publish anything yet) with:
   - **Architecture & Approach** – how the spec is implemented
   - **Affected Files/Modules** – where things change or are created
   - **Data Model / Interfaces** – if relevant
   - **Test Strategy** – how the acceptance criteria are verified
   - **Risks & Alternatives** – trade-offs
5. Present the plan for review (**gate**). Do **not** write any feature code.
6. **Only after I approve**, publish it: add or replace the `## Plan` section on the same `Feature: <slug>` issue (`gh issue edit <number> --body-file -`), leaving `## Spec`/`## Tasks` untouched.

Note: `/techplan` is its own command — don't confuse it with the native `/plan` (= Plan Mode).

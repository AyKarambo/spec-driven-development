---
description: Break the technical plan into small, testable tasks — added as a checklist to the feature's GitHub issue
argument-hint: [feature slug/name — the one that holds the spec/plan]
disable-model-invocation: true
---

You break the plan for **$ARGUMENTS** into small, individually implementable and testable **tasks**, then add them as a checklist to the feature's GitHub issue so GitHub's native task-list checkboxes track progress.

1. Identify the feature slug (from `$ARGUMENTS`, else the current branch). Find the `Feature: <slug>` GitHub issue (as in `/techplan`) and read its `## Spec` and `## Plan` sections. **If there's no `## Plan` section, stop** and point to `/techplan`. **If GitHub access isn't available at all, stop** and tell me to set up `gh` or a GitHub MCP server — there is no local fallback.
2. **Gate marker:** write `.claude/sdd/phase` with the line `tasks:<slug>` and leave it in place.
3. Draft the task list (in the conversation — don't publish anything yet). Per task, use GitHub's native task-list syntax so each checkbox is detected and counted in the issue's progress bar:
   - `- [ ] **T<n>: <goal>** (<S/M/L>)` — one line per task, the checkbox first
   - indented sub-lines for **Files** (what will likely be touched) and **Check** (how you tell the task is done)
4. Rules: each task **small and individually reviewable**, sensibly ordered (dependencies first), no task bigger than necessary.
5. **Consistency gate (analyze):** before finishing, verify that **every acceptance criterion in the `## Spec` section** maps to at least one task. List any acceptance criteria with no task (gaps) and any tasks that trace to no criterion (scope creep). Make the list complete, or flag what needs a spec/plan revision (`/revise`).
6. Present the full task list and the consistency check for review (**gate**). Do **not** write code, and do **not** publish anything yet.
7. **Only after I approve**, add or replace the `## Tasks` section on the same `Feature: <slug>` issue (`gh issue edit <number> --body-file -`), leaving `## Spec`/`## Plan` untouched.

Note: `/breakdown` is its own command — don't confuse it with the native `/tasks` (= running background jobs).

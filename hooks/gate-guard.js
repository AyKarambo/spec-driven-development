#!/usr/bin/env node
/*
 * Spec-Driven Development — gate guardrail (PreToolUse).
 *
 * While a planning gate is active (the file .claude/sdd/phase exists in the repo),
 * this blocks on-disk writes that would defeat the workflow. Specs, plans, and tasks
 * live in GitHub issues (written via `gh`, a Bash call this guard does not police), so
 * no spec/plan/tasks doc should ever be committed to disk during a gate.
 *
 * Two rules, applied only while a gate is active:
 *   1. Markdown files (*.md / *.markdown): DENY unless the path is a project rule file
 *      (CLAUDE.md, AGENTS.md, .claude/rules/**) OR transient scratch under the gitignored
 *      .claude/sdd/** (where the commands write the issue-body file they pipe into `gh`,
 *      then delete). This is what stops a spec/plan/tasks doc from being saved as a stray,
 *      committed Markdown file instead of going into the GitHub issue.
 *   2. Everything else (feature code, etc.): DENY unless under the broad allowlist
 *      (CLAUDE.md, AGENTS.md, .claude/**), so feature code can't be written before the
 *      gate is approved.
 *
 * When no marker exists it does nothing at all — zero impact on normal work, so non-SDD
 * repos and the implementation phase (marker already cleared) are completely unaffected.
 *
 * The transient issue-body file the commands pipe into `gh` lives under the gitignored
 * .claude/sdd/, so it is allowed (rule 1) and — being deleted right after use and never
 * tracked — is never committed, whatever its extension.
 *
 * Override: delete .claude/sdd/phase (or run /implement, which clears it).
 *
 * Fails OPEN on any error — a bug here must never block legitimate work.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch (_) {
    return '';
  }
}

function isMarkdown(rel) {
  return /\.(md|markdown)$/i.test(rel);
}

function deny(reason) {
  const out = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason
    }
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readStdin() || '{}');
  } catch (_) {
    process.exit(0); // can't parse input → don't interfere
  }

  const cwd = payload.cwd || process.cwd();
  const markerPath = path.join(cwd, '.claude', 'sdd', 'phase');

  let phase;
  try {
    phase = fs.readFileSync(markerPath, 'utf8').trim();
  } catch (_) {
    process.exit(0); // no gate active
  }
  if (!phase) process.exit(0);

  const input = payload.tool_input || {};
  const target = input.file_path || input.notebook_path || '';
  if (!target) process.exit(0); // nothing path-like to check

  const abs = path.isAbsolute(target) ? target : path.join(cwd, target);
  const relNative = path.relative(cwd, abs);

  // Outside this repo → not our concern. Two ways a target can be outside:
  //  - a same-drive escape → path.relative gives a `../…` path;
  //  - a different drive letter or a UNC path on Windows → path.relative can't
  //    form a relative path and returns an ABSOLUTE one. Both must pass.
  if (path.isAbsolute(relNative)) process.exit(0);
  const rel = relNative.split(path.sep).join('/'); // posix-style, relative to repo
  if (rel === '..' || rel.startsWith('../')) process.exit(0);

  // Rule 1 — Markdown: only project rule files, or transient .claude/sdd/ scratch.
  if (isMarkdown(rel)) {
    const mdAllowed =
      rel === 'CLAUDE.md' ||
      rel === 'AGENTS.md' ||
      rel.startsWith('.claude/rules/') ||
      rel.startsWith('.claude/sdd/'); // gitignored transient scratch (issue-body file)
    if (mdAllowed) process.exit(0);
    deny(
      `🚦 Spec-Driven gate active (${phase}). Specs, plans, and tasks live in GitHub issues — ` +
      `don't save them as a committed Markdown file. On disk, Markdown may only go to CLAUDE.md, ` +
      `AGENTS.md, .claude/rules/**, or the gitignored .claude/sdd/ scratch. Put this content in the ` +
      `spec issue via gh (its body is piped from a transient .claude/sdd/ file, then deleted). ` +
      `To override, delete .claude/sdd/phase.`
    );
  }

  // Rule 2 — everything else (feature code): the broad planning-gate allowlist.
  const allowed =
    rel === 'CLAUDE.md' ||
    rel === 'AGENTS.md' ||
    rel.startsWith('.claude/');
  if (allowed) process.exit(0);

  deny(
    `🚦 Spec-Driven gate active (${phase}). No feature code may be written right now — finish the ` +
    `planning step first. On disk, only CLAUDE.md, AGENTS.md, and .claude/** may be written; ` +
    `specs/plans/tasks live in GitHub issues (written via gh). Run /implement to lift the gate, ` +
    `or delete .claude/sdd/phase to override.`
  );
}

try {
  main();
} catch (_) {
  process.exit(0); // never break legitimate work on a bug
}

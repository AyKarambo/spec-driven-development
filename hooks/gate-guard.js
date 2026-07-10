#!/usr/bin/env node
/*
 * Spec-Driven Development — gate guardrail (PreToolUse).
 *
 * While a planning gate is active (the file .claude/sdd/phase exists in the repo),
 * this blocks writes to anything OUTSIDE the spec-artifact allowlist, so feature
 * code can't be written before the gate is approved. When no marker exists it does
 * nothing at all — zero impact on normal work.
 *
 * Allowlist: CLAUDE.md, AGENTS.md, .claude/**
 * (Spec/plan/tasks live in a GitHub issue, edited via `gh`/Bash — never local files — so there's
 * no specs/** carve-out. The only local content this plugin writes is the constitution and its
 * own gate-orchestration state.)
 * Override:  delete .claude/sdd/phase (or run /implement, which clears it).
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
  const rel = path.relative(cwd, abs).split(path.sep).join('/'); // posix-style, relative to repo

  const allowed =
    rel === 'CLAUDE.md' ||
    rel === 'AGENTS.md' ||
    rel.startsWith('.claude/') ||
    rel.startsWith('..'); // outside this repo → not our concern

  if (allowed) process.exit(0);

  const reason =
    `🚦 Spec-Driven gate active (${phase}). Only CLAUDE.md, AGENTS.md, and .claude/** may be written ` +
    `right now — the spec/plan/tasks themselves live in the feature's GitHub issue, not local files. ` +
    `Present the current step for approval, then run /implement (which clears the gate). To override ` +
    `now, delete .claude/sdd/phase.`;

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

try {
  main();
} catch (_) {
  process.exit(0); // never break legitimate work on a bug
}

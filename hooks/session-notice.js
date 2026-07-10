#!/usr/bin/env node
/*
 * Spec-Driven Development — session notice (SessionStart).
 *
 * If a planning gate is active when a session starts, surface it as context so a
 * stale marker is never invisible ("why am I blocked?"). Silent when no marker.
 * Fails OPEN on any error.
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
    process.exit(0);
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

  const context =
    `ℹ️ Spec-Driven Development: a planning gate is active (${phase}). ` +
    `Only CLAUDE.md, AGENTS.md, and .claude/** can be written until you run /implement or delete ` +
    `.claude/sdd/phase — the spec/plan/tasks themselves live in the feature's GitHub issue.`;

  const out = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context
    }
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

try {
  main();
} catch (_) {
  process.exit(0);
}

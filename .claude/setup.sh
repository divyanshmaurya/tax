#!/usr/bin/env bash
# SessionStart setup for Claude Code (web/remote sessions).
# Ensures dependencies are installed so `npm run dev|build|lint` work immediately.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

if [ ! -d node_modules ]; then
  echo "Installing npm dependencies…"
  npm install --no-audit --no-fund
else
  echo "Dependencies already present."
fi

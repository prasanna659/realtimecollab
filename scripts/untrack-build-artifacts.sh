#!/usr/bin/env bash
# One-time cleanup: stop tracking generated files that were committed by mistake. Files stay on disk.
set -euo pipefail
git rm -q --cached --ignore-unmatch frontend/tsconfig.tsbuildinfo frontend/tsconfig.node.tsbuildinfo \
  frontend/vite.config.js frontend/vite.config.d.ts .vscode/settings.json
echo "Now run: git commit -m 'Stop tracking generated files'"

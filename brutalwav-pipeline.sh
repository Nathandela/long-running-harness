#!/usr/bin/env bash
set -euo pipefail

echo "=== BRUTALWAV Wiring Fix Pipeline ==="
echo "Phase 1: Infinity Loop (4 epics + review after each)"
bash infinity-loop.sh

echo ""
echo "=== Phase 2: Polish Loop (1 cycle) ==="
bash polish-loop.sh

echo ""
echo "=== Pipeline Complete ==="
git push 2>/dev/null || echo "git push failed (or no remote)"

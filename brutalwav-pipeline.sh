#!/usr/bin/env bash
set -euo pipefail

echo "=== BRUTALWAV Pipeline ==="
echo "Phase 1: Infinity Loop (18 epics + review after each epic)"
bash infinity-loop.sh

echo ""
echo "=== Phase 2: Polish Loop (5 cycles) ==="
bash polish-loop.sh

echo ""
echo "=== Pipeline Complete ==="
git push 2>/dev/null || echo "git push failed (or no remote)"

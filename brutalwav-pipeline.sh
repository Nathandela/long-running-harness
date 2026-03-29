#!/usr/bin/env bash
set -euo pipefail

echo "=== BRUTALWAV W5+W6 Pipeline ==="
echo "Phase 1: Infinity Loop (W5 Audio Bridge + W6 Visual Polish)"
bash infinity-loop.sh

echo ""
echo "=== Phase 2: Polish Loop (2 cycles) ==="
bash polish-loop.sh

echo ""
echo "=== Pipeline Complete ==="
git push 2>/dev/null || echo "git push failed (or no remote)"

#!/usr/bin/env bash
set -euo pipefail

echo "=== BRUTALWAV Fix Pipeline ==="
echo "Phase 1: FIX1 (Audio/Transport) -> FIX2 (Tracks/MIDI) + FIX3 (Layout)"
bash infinity-loop.sh

echo ""
echo "=== Phase 2: Polish (2 cycles) ==="
bash polish-loop.sh

echo ""
echo "=== Pipeline Complete ==="
git push 2>/dev/null || echo "git push failed (or no remote)"

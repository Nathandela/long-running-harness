FIXES_APPLIED

All 52 tests pass. Here's what was fixed:

| Severity | Finding | Fix |
|----------|---------|-----|
| **P0** | `addSend` skips cycle detection | Added `wouldCauseCycle` check before `graph.addEdge`, throws on cycle |
| **P1** | `removeBus` leaves orphaned `outputTarget` refs | Re-routes dependent buses to `"master"` before removal |
| **P1** | `removeBus` leaves dangling sidechains | Cleans up sidechains where source or target matches removed bus |
| **P1** | Store `removeBus` same issues | Store now re-routes outputTargets and filters sidechains |
| **P2** | `setBusOutput` disconnects on unknown target | Validates target exists before disconnecting |
| **P2** | `removeSend` orphaned source nodes | Prunes non-bus source nodes from graph when their last send is removed |
| **P2** | `dispose` doesn't clear graph | Added `graph.clear()` in dispose |
| **P2** | Store `addSend` allows duplicates | Added duplicate check before appending |
| **P2** | Store `updateSendLevel` no clamp | Clamps to `[0, 1]` |

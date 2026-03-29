REVIEW_CHANGES_REQUESTED

1. **P2 — Missing `aria-haspopup` / `aria-expanded` on the Add Track button** (`src/ui/transport/TransportBar.tsx:110-118`). The button toggles a `role="menu"` dropdown but lacks `aria-haspopup="menu"` and `aria-expanded={addMenuOpen}`. Screen readers won't announce the menu relationship. Add both attributes to the trigger button.

2. **P2 — Dropdown not closable via Escape key** (`src/ui/transport/TransportBar.tsx:84-99`). The outside-click handler closes the menu on `mousedown`, but there is no keyboard handler for `Escape`. Users navigating via keyboard have no way to dismiss the menu without clicking away. Add a `keydown` listener for `Escape` in the same `useEffect`.

3. **P3 — `useDrumMachineState` creates a new `stepSequencer` per mount, not per track** (`src/ui/panels.tsx:35-39`). When the user switches between drum tracks, `DrumMachineController` remounts and creates a fresh sequencer — losing the pattern of the previous drum track. If the app ever supports multiple drum tracks, each one shares the same ephemeral state. Fine for now, but worth a TODO comment noting this is single-track-only.

4. **P3 — `onParamChange` updates local state only** (`src/ui/panels.tsx:104-116`). Drum instrument param changes (decay, tone, etc.) are stored in component state but never propagated to the audio engine or persisted in the store. The params drift silently — the UI shows values that have no audio effect. Either connect to the audio layer or add a comment noting this is intentionally visual-only for now.

5. **P3 — `onTriggerPad` is a no-op** (`src/ui/panels.tsx:100-102`). The callback does nothing — pad taps are silently swallowed. If this is intentional (audio wiring deferred), note it explicitly, e.g. `// TODO: wire to audio engine for pad preview`.

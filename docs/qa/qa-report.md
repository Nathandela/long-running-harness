# QA Report: BRUTALWAV DAW

**Target**: http://localhost:5173
**Date**: 2026-03-29T04:45:00Z
**Environment**: Playwright 1.58.2 + Chromium headless (AudioContext mocked for headless compatibility)
**Strategies**: Smoke Testing, Visual Review, Keyboard Accessibility, Interactive States, Viewport Stress, Design Token Verification

---

## P0 Findings (Blocks Ship)

None.

## P1 Findings (Critical)

None.

## P2 Findings (Important)

- **[KNOWN]** VU meters hardcoded to 0 -- no activity during playback
  - **Where**: `src/ui/mixer/MixerPanel.tsx` (meterLevel={0}, meterPeak={0}, clipping={false})
  - **Repro**: Play transport, observe VU meters remain at zero
  - **Justification**: Real AnalyserNode not wired to meter components

- **[A11Y]** Fader slider missing aria-label
  - **Where**: Mixer fader `role="slider"` element
  - **Repro**: Tab to fader, screen reader announces no label
  - **Justification**: WCAG 4.1.2 requires accessible names for interactive controls

## P3 Findings (Minor)

- **[A11Y]** No heading elements (h1-h6) in the application
  - **Where**: Entire document
  - **Repro**: Inspect DOM -- zero headings found
  - **Justification**: Headings aid screen reader navigation; DAW apps commonly use ARIA landmarks instead (sections are present)

- **[UX]** SynthEditor, DrumMachinePanel, PianoRollEditor only visible after track selection
  - **Where**: InstrumentPanel shows "INSTRUMENT" placeholder, ArrangementPanel shows no piano roll
  - **Repro**: Load app without tracks -- only placeholder text visible
  - **Justification**: Expected behavior for empty state; not a bug but worth noting for completeness

## Passed Checks

### Smoke Testing
- [x] Page loads without console errors
- [x] No JavaScript page errors
- [x] No network errors (4xx/5xx)
- [x] Main content visible after click-to-start gate
- [x] All key panels render (DawShell, TransportBar, ArrangementPanel, MixerPanel, InstrumentPanel, MediaPoolPanel)

### Visual Review
- [x] Layout alignment consistent across all panels
- [x] Text readable with monospace font (JetBrains Mono)
- [x] Dark theme renders correctly with proper contrast
- [x] Panel borders and separators visible
- [x] Transport controls properly spaced and aligned
- [x] MASTER strip fader with blue fill and gain readout (+0.0)
- [x] Media pool shows helpful empty state ("Drop audio files here or click IMPORT")

### Viewport Stress
- [x] 1440px (desktop): Full layout, no overflow
- [x] 1024px (minimum): All panels visible, no horizontal overflow
- [x] 768px (tablet): Layout adapts, no horizontal overflow

### Keyboard Accessibility
- [x] Tab navigates through 7 unique interactive elements: BPM input, Play, Stop, Loop, Metronome, fader slider, Import button
- [x] Focus indicators visible (blue 2px outline via `:focus-visible`)
- [x] Focus ring uses design token `--focus-ring: 2px solid var(--color-blue)`
- [x] Tab order follows logical visual order (transport left-to-right, then mixer, then media pool)
- [x] Space key triggers transport play/stop

### Interactive States
- [x] Play button: green background when active/playing
- [x] Transport buttons: hover states present (CSS module `_transportBtn_`)
- [x] Loop/Metronome: `role="switch"` with `aria-checked` toggling correctly
- [x] Fader: draggable slider with visual feedback
- [x] Import button: visible hover state

### Transport Functionality
- [x] Play starts playback (cursor display advances from 001.01.000)
- [x] Arrangement canvas renders beat grid with bar numbers (2, 3, 4, 5, 6, 7)
- [x] Red playhead line moves across arrangement during playback
- [x] Cursor display shows bars.beats.ticks format (e.g., 001.03.383)

### Design Token System
- [x] Color tokens: `--color-black`, `--color-white`, all gray scale (100-900 odd steps)
- [x] Typography tokens: `--font-mono`, `--text-xs` through `--text-4xl`
- [x] Spacing tokens: `--space-1` through `--space-16` (8px grid)
- [x] Semantic colors: `--color-success` (green), `--color-warning` (amber), `--color-error` (red)
- [x] Focus tokens: `--focus-ring`, `--focus-offset`
- [x] Transition tokens: `--transition-fast` (100ms), `--transition-normal` (200ms)
- [x] Z-index scale defined (base through context-menu)

### DOM Summary
- 7 buttons (Play, Stop, Loop, Metronome, Import, plus internal)
- 2 inputs (BPM x1, though Tab cycle shows it twice due to focus wrap)
- 2 canvas elements (arrangement timeline, arrangement content)
- 4 sections (arrangement, mixer, instrument, media pool)
- 9 aria-labels on interactive elements
- 10 data-testid attributes for testing hooks

## Screenshots

| Screenshot | Description |
|---|---|
| `qa-01-initial-load.png` | Click-to-start splash screen |
| `qa-02-after-click-start.png` | DAW shell after audio engine init |
| `qa-03-daw-shell.png` | Full DAW layout at 1440x900 |
| `qa-05-mixer-panel.png` | Master strip with fader |
| `qa-06-arrangement-panel.png` | Arrangement panel (pre-playback) |
| `qa-07-instrument-panel.png` | Instrument panel placeholder |
| `qa-08-media-pool-panel.png` | Media pool with empty state |
| `qa-12-viewport-1024.png` | 1024px viewport |
| `qa-13-viewport-768.png` | 768px viewport |
| `qa-14-keyboard-focus.png` | Focus ring on MET button |
| `qa-15-after-space.png` | Post-Space: beat grid + playhead visible |
| `qa-16-button-hover.png` | Play active state (green), arrangement with grid |
| `qa-17-fader-hover.png` | Fader hover during playback |
| `qa-99-final-state.png` | Final application state |

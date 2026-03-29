# BRUTALWAV: UI Wiring Fix

## Problem Statement

The initial 18-epic build produced 42K lines of working, tested code -- but most UI components were built in isolation and never connected to the main app shell. The DAW opens but users cannot create tracks, access instruments, use effects, or export audio. This spec addresses all 9 integration gaps identified by the post-build audit.

**Parent spec**: `docs/specs/brutalwav-daw.md`

---

## EARS Requirements (Wiring-Specific)

### R-EVT: Event-Driven

| ID | Trigger | Requirement |
|----|---------|-------------|
| W-EVT-01 | When the user clicks "Add Track" in the toolbar | The system shall present a menu with track type options: Audio, Instrument (Synth), Drum (808). On selection, create the track via addTrack store method and add a corresponding channel strip in the mixer. |
| W-EVT-02 | When the user selects an instrument track | The InstrumentPanel shall render the SynthEditor for that track |
| W-EVT-03 | When the user selects a drum track | The InstrumentPanel shall render the DrumMachinePanel for that track |
| W-EVT-04 | When the user double-clicks a MIDI clip in the arrangement | The system shall open the PianoRollEditor for that clip in the bottom panel |
| W-EVT-05 | When the user clicks "Add Effect" on a channel strip | The EffectsRack shall open for that track, allowing effect selection and parameter editing |
| W-EVT-06 | When the user drags a media pool item to the arrangement | The system shall create an audio clip on the target track at the drop position |
| W-EVT-07 | When the user clicks "Export" / "Bounce" in the toolbar | The system shall open a bounce dialog with range selection (full/loop), start rendering via BounceEngine, show progress, and offer WAV download on completion |
| W-EVT-08 | When the user clicks "Routing" in the mixer | The RoutingMatrix panel shall open, showing send/bus routing for all tracks |
| W-EVT-09 | When transport plays/stops | The 808 step sequencer shall start/stop in sync, using TransportClock subscription |

### R-STA: State-Driven

| ID | State | Requirement |
|----|-------|-------------|
| W-STA-01 | While no tracks exist | The arrangement and mixer shall show an empty state with clear "Add Track" call-to-action |
| W-STA-02 | While a drum track is selected | The InstrumentPanel shall show DrumMachinePanel (not SynthEditor or empty "INSTRUMENT" text) |
| W-STA-03 | While the piano roll is open | The bottom panel shall show the PianoRollEditor instead of InstrumentPanel + MediaPool side-by-side |

---

## Scenario Table

| # | Scenario | Refs | Verification |
|---|----------|------|-------------|
| S1 | User adds an instrument track | W-EVT-01 | Track appears in arrangement + mixer, synth editor opens in instrument panel |
| S2 | User adds a drum track | W-EVT-01, W-EVT-03 | Track appears, 808 panel opens with step sequencer |
| S3 | User plays synth via virtual keyboard | W-EVT-02 | Audio output from synth through mixer |
| S4 | User programs 808 pattern and presses Play | W-EVT-09 | 808 pattern plays in sync with transport |
| S5 | User imports audio and drags to arrangement | W-EVT-06 | Clip appears on track with waveform |
| S6 | User double-clicks MIDI clip | W-EVT-04 | Piano roll opens for editing |
| S7 | User adds reverb to a track | W-EVT-05 | EffectsRack opens, reverb added, audio passes through |
| S8 | User clicks Export, bounces session | W-EVT-07 | Progress shown, WAV downloads |
| S9 | User opens routing matrix | W-EVT-08 | Send/bus routing visible for all tracks |

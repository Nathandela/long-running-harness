// Layout
export { ClickToStart } from "./ClickToStart";
export { CrossOriginError } from "./CrossOriginError";
export { DawShell } from "./DawShell";
export { Toolbar } from "./Toolbar";
export { ArrangementPanel } from "./arrangement";
export { InstrumentPanel } from "./panels";
export { MixerPanel, ChannelStrip, MasterStrip } from "./mixer";

// Design tokens
export { tokens } from "./tokens/tokens";
export type { ThemeTokens } from "./tokens/tokens";

// Primitives
export { Button } from "./primitives/Button";
export { Toggle } from "./primitives/Toggle";
export { Select } from "./primitives/Select";
export { Modal } from "./primitives/Modal";
export { Tooltip } from "./primitives/Tooltip";
export { ContextMenu } from "./primitives/ContextMenu";
export type { MenuItem } from "./primitives/ContextMenu";

// DAW Controls
export { RotaryKnob } from "./controls/RotaryKnob";
export { Fader } from "./controls/Fader";
export { VuMeter } from "./controls/VuMeter";
export { DrumPad } from "./controls/DrumPad";
export { StepButton } from "./controls/StepButton";

// Keyboard system
export { CommandRegistry } from "./keyboard/command-registry";
export type { Command } from "./keyboard/command-registry";
export { ShortcutMap } from "./keyboard/shortcut-map";
export type { ShortcutBinding } from "./keyboard/shortcut-map";
export { useKeyboardShortcuts } from "./keyboard/useKeyboardShortcuts";

// Transport
export { TransportBar, BpmInput, CursorDisplay } from "./transport/index";

// Drum Machine
export { DrumMachinePanel } from "./drum-machine";

// Hooks
export { useReducedMotion } from "./hooks/useReducedMotion";
export { useTransportCursor } from "./hooks/useTransportCursor";

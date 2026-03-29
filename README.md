# BRUTALWAV

A browser-based Digital Audio Workstation built autonomously by AI agents. Neo-Brutalist design, Web Audio API, React + TypeScript.

Live demo: [nathan-delacretaz.com/daw](https://nathan-delacretaz.com/daw/index.html)

## Context

This project is a benchmark comparing open-source AI agent harnesses against frontier lab tooling for long-running autonomous coding sessions.

On March 24 2026, Anthropic published a [post on harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps) for long-running AI coding sessions, demonstrating the approach by building a browser-based DAW in 3h50m for $124.70.

This repository is the same brief, built with [compound-agent](https://github.com/Nathandela/compound-agent) -- an open-source multi-agent harness with persistent memory and multi-model review. The build ran autonomously for ~20 hours across multiple sessions on a Claude Max subscription. Full writeup: [Harness Design for Dark Software Factories](https://nathan-delacretaz.com/thinks/harness-design-dark-factories).

## Features

- **Synthesizer.** Subtractive polyphonic synth with oscillators, filters, ADSR envelopes, LFOs, and modulation matrix
- **Drum machine.** TR-808 style step sequencer with synthesized drum voices
- **Sequencing.** Canvas-based piano roll, arrangement view with clip dragging/trimming/splitting, grid snapping, loop regions
- **Effects.** Per-channel insert effects (reverb, delay, chorus, distortion, EQ, compressor)
- **Mixer.** Multi-track mixer with volume, pan, mute, solo, and master bus
- **Automation.** Breakpoint automation lanes with multiple curve types
- **Audio.** AudioWorklet-based DSP, SharedArrayBuffer transport, look-ahead scheduling, offline WAV bounce

## Running locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Requires a modern browser with Web Audio API and SharedArrayBuffer support.

## How it was built

The `agent_logs/` directory contains the full trace of the autonomous build process: review reports, architect prompts, implementer logs, and loop execution records. These show how compound-agent decomposed the project into 18 tasks, wrote tests first, built features, ran multi-model review (Claude Sonnet, Claude Opus, Gemini, Codex), and iterated through 5 polish cycles.

## Stack

- React 19 + TypeScript (strict mode)
- Vite
- Zustand (state management)
- Canvas 2D (arrangement, piano roll, knobs)
- Web Audio API + AudioWorklet
- Vitest + Testing Library

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Type-check + production build |
| `pnpm test` | Run test suite |
| `pnpm check` | Lint + format check + tests |

## License

MIT

# MONO-1

A software subtractive synthesizer playable via Web MIDI hardware or your computer keyboard, built with the Web Audio API. Personal/learning project — see [`PROJECT.md`](./PROJECT.md) for the full design rationale and roadmap.

Signal chain: **Oscillator → Filter → Amplifier (envelope) → Output**

## Features

- 4 waveforms: sine, square, sawtooth, triangle
- Lowpass filter with cutoff + resonance
- AR (attack/release) envelope
- Live oscilloscope
- Web MIDI input — auto-connects to any plugged-in MIDI device
- Computer-keyboard fallback: `A S D F G H J K` (white keys), `W E T Y U` (black keys)

Currently monophonic (one voice at a time) — this is Phase 1 of the roadmap in `PROJECT.md`. Polyphony, modulation, more parameters, a hardware controller, and native packaging are later phases.

## Stack

Vite + React + TypeScript, Web Audio API, Web MIDI API. No backend, no external audio framework.

## Getting started

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build for production |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests (Playwright, auto-starts the dev server) |

## Project structure

```
src/
  hooks/
    useSynthEngine.ts        Web Audio graph: oscillator → filter → gain → analyser
    useMidi.ts                Web MIDI hardware input
    useComputerKeyboard.ts    computer-keyboard fallback input
  components/                 Knob, Scope, WaveButtons, PianoKeyboard, StatusBar
  lib/                        note tables, MIDI-to-frequency math, knob scaling math
tests/                        Playwright end-to-end tests
```

More detail on the architecture lives in [`CLAUDE.md`](./CLAUDE.md).

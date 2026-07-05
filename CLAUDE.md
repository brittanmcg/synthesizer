# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

MONO-1: a personal, solo-learning synthesizer project (not for commercial release). A software synth engine (Web Audio API) driven by MIDI hardware and/or computer keyboard (Web MIDI API). See `PROJECT.md` for the full design rationale, roadmap, and rejected-alternatives discussion — read it before making architectural changes. Note: `PROJECT.md` predates the React conversion and still describes the UI as "plain HTML/CSS/JS"; the codebase has since moved to Vite + React + TypeScript (this file reflects the current state).

Currently at Phase 1 of the roadmap in `PROJECT.md`: single oscillator → lowpass filter → AR envelope, monophonic (one voice at a time). **Monophonic behavior and the lack of LFO/modulation/presets/effects are intentional for this phase, not bugs** — don't "fix" them without checking the roadmap first.

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build         # tsc -b (typecheck) && vite build
npm run preview        # preview the production build
npm run test:e2e       # Playwright end-to-end suite (auto-starts the dev server)
npx tsc -b             # typecheck only, no emit issues (composite build across tsconfig.json + tsconfig.node.json)
```

Run a single Playwright test by name:
```bash
npx playwright test -g "cutoff knob drag"
```

There is no unit test suite — `tests/synth.spec.ts` (Playwright) is the only test coverage, driving the real app in a browser.

## Architecture

Single-page Vite + React + TypeScript app, no routing, no backend. The important structure is the split between the **audio engine** (imperative, ref-based, outside React's render cycle) and the **UI** (React state, for display only):

- **`src/hooks/useSynthEngine.ts`** — owns the entire Web Audio graph: `OscillatorNode → BiquadFilterNode (lowpass) → GainNode (manual AR envelope) → AnalyserNode → destination`. All audio nodes and parameters live in refs, not React state, so parameter changes never trigger re-renders and stay sample-accurate. The `AudioContext` is created lazily on the first `noteOn` call (browser autoplay policy requires a user gesture). Parameter changes go through Web Audio's scheduling methods (`setTargetAtTime`, `linearRampToValueAtTime`) rather than direct `.value` assignment, to avoid zipper noise/clicks — preserve this pattern for any new parameter.
- **`src/hooks/useMidi.ts`** — Web MIDI hardware input. Exposes a `status` state machine (`searching → unsupported | connected | disconnected`) and a `flash` pulse for note-on LED feedback. Handles device hot-plug via `onstatechange`.
- **`src/hooks/useComputerKeyboard.ts`** — maps `A S D F G H J K` (white keys) / `W E T Y U` (black keys) to MIDI note numbers as a keyboard fallback when no MIDI hardware is attached.
- **`src/App.tsx`** — composition root. Holds UI-facing state (waveform, cutoff, resonance, attack, release, octave, active note, LED flash) and wires handlers that call both the engine's imperative setters *and* `setState` — the engine needs its own copy for real-time audio scheduling, React needs its own copy for display. When adding a new synth parameter, follow this same dual-write pattern.
- **`src/lib/notes.ts`** — note tables: `whiteNotes`/`blackLayout` for the two-octave C4–C6 on-screen keyboard, `keyMap` for computer-keyboard input, `midiToFreq`.
- **`src/components/`** — presentational components: `Knob` (generic draggable rotary control, supports linear or log scaling — log is used for cutoff/attack/release since those feel more musical on a log curve), `Scope` (oscilloscope canvas driven directly by `requestAnimationFrame` reading the analyser node, deliberately bypassing React state for performance), `PianoKeyboard`, `WaveButtons`, `StatusBar`.
- **`src/style.css`** — single global stylesheet (no CSS modules/styled-components). Hardware-panel dark theme: graphite panels, amber/teal accents, JetBrains Mono. Preserve this visual identity unless there's a specific reason to change it.

## Testing notes

`tests/synth.spec.ts` drives the real UI with Playwright (`playwright.config.ts` auto-launches `npm run dev` via `webServer`). Two gotchas hit during development, worth remembering when writing new interaction tests:

- React derives `mouseleave`/`mouseenter` from bubbling `mouseout`/`mouseover` events — a raw `dispatchEvent('mouseleave')` never reaches a React `onMouseLeave` handler. Use a real `page.mouse.move(...)` to a point outside the element instead.
- `page.keyboard.down()`/`up()` have no target element to auto-wait on (unlike locator actions), so they can fire before Vite/React finish mounting on a cold start. Wait for a rendered element (e.g. `toBeVisible()`) before sending key events.

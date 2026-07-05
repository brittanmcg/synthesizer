# MONO-1 — Personal Synthesizer Project

## Overview

A personal-use, hybrid synthesizer: a software synth engine paired with physical
MIDI hardware control. Not for commercial release — solo project, built to learn
synthesis and DSP concepts hands-on.

**Builder background:** Comfortable coding in JavaScript (primary strength) and
Java. Does not know and does not want to write C++. Working on macOS.

**Definition of "hybrid":** the sound-generating engine is software; control comes
from MIDI hardware (an existing MIDI keyboard initially, with a custom-built
controller planned later using a Teensy microcontroller).

## Current decision: build it as a web app

After comparing several stacks (see "Options considered" below), the current
direction is:

- **Audio engine:** Web Audio API (native browser API, no framework layer yet)
- **MIDI input:** Web MIDI API (native, connects directly to hardware controllers)
- **UI:** plain HTML/CSS/JS for now; a JS framework (React/Svelte) can be layered
  in as the UI grows more complex
- **Packaging (future step, not yet done):** wrap the finished web app with
  **Tauri** to produce a real double-clickable macOS `.app` with its own dock
  icon — not "open a browser tab." Chosen over Electron for being lighter weight.

This was chosen because it best matches the builder's strongest language (JS),
gives the easiest path to a genuinely modern-looking UI (not a "90s synth GUI"),
and has trivial MIDI hardware integration via Web MIDI — no bindings/libraries
needed.

## Synthesis approach

**Classic subtractive synthesis** (think Minimoog/Juno lineage), deliberately
chosen as the starting point over wavetable/FM/granular because it's the most
well-documented approach and produces a usable instrument fastest. Signal chain:

```
Oscillator → Filter → Amplifier (envelope) → Output
```

More exotic synthesis (wavetable, FM) is an explicit later phase, not part of
the current scope.

## Build phases (roadmap)

- [x] **Phase 0 — DSP fundamentals**: sample rate, buffers, waveforms, audio
      callback model
- [x] **Phase 1 — Make noise + MIDI in**: single oscillator, basic filter,
      simple attack/release envelope, playable via Web MIDI and computer
      keyboard fallback. **Done — see "Current code" below.**
- [ ] **Phase 2 — Polyphony**: track multiple simultaneous notes, voice
      allocation/stealing so chords work, not just one note at a time
- [ ] **Phase 3 — LFO + modulation**: at least filter cutoff modulation to
      start
- [ ] **Phase 4 — Fuller GUI**: move from raw DOM/CSS knobs to a proper
      component framework if the UI complexity warrants it; more parameters
      exposed (filter type, envelope stages, etc.)
- [ ] **Phase 5 — Hardware controller build**: Teensy 4.0/4.1 with
      potentiometers/encoders, USB MIDI class-compliant, sending MIDI CC
      messages to the software synth
- [ ] **Phase 6 — Packaging**: wrap as a Tauri app for a real native-feeling
      macOS application
- [ ] **Phase 7 — Polish**: effects (delay/chorus/reverb), preset save/load

## Current code

**File:** `synth-phase1.html` — a single self-contained HTML file (no build
step, no dependencies except a Google Fonts import for JetBrains Mono).

**What it implements:**
- Monophonic (single voice) subtractive synth: `OscillatorNode` →
  `BiquadFilterNode` (lowpass) → `GainNode` (manual AR envelope via
  `linearRampToValueAtTime`)
- 4 selectable waveforms: sine, square, sawtooth, triangle
- Custom draggable rotary knob UI component (cutoff, resonance, attack,
  release, octave — cutoff/attack/release are log-scaled for musical feel)
- Live oscilloscope via `AnalyserNode` + `<canvas>`
- Web MIDI input: auto-connects to any plugged-in MIDI device, decodes raw
  note-on/note-off bytes
- On-screen clickable keyboard + computer-keyboard fallback
  (`A S D F G H J K` = white keys, `W E T Y U` = black keys) so it's
  playable with no MIDI hardware attached

**Deliberately NOT yet implemented** (do not "fix" these — they're the next
planned phases, not bugs):
- Only one note can sound at a time (monophonic) — polyphony is Phase 2
- No LFO / modulation routing yet — Phase 3
- No preset save/load
- No audio effects (reverb, delay, etc.)
- Not packaged as a native app yet — still runs as a browser page

## Options considered and rejected (context for "why not X")

Useful background in case these come up again — these were deliberately
evaluated and set aside, not overlooked:

| Option | Why not chosen |
|---|---|
| **JUCE (C++)** | Industry standard (Vital, Surge XT, and many major companies use it), but requires C++, which the builder doesn't know and doesn't want to learn for this |
| **SuperCollider** | Great for fast synthesis prototyping, but no path to a polished custom GUI — would need pairing with a separate app shell |
| **Faust** | Can compile to a real plugin/app without C++, but a new DSL, less alignment with builder's JS/Java strengths |
| **ChucK / Csound** | Both legitimate, well-established audio languages, but neither has a native path to a modern GUI — would require pairing with a separate front-end layer |
| **Rust** | Best-in-class real-time audio safety (no GC), but a new language for the builder — would add significant ramp-up time before first sound |
| **Java (JSyn)** | Strong option — proven viable by Cherry Audio's Voltage Modular, which is built this way commercially. Matches builder's background directly. Still in consideration for the actual audio engine if the web app's Web Audio API ever feels limiting |
| **Elementary Audio (JS)** | A real contender, declarative JS audio framework designed for shipping real apps. The "web app" direction effectively supersedes this — Elementary would be a natural upgrade path if raw Web Audio API's node-graph approach becomes limiting for more custom DSP |

**Key reference point:** commercial synths split between framework-built
(JUCE — Vital, Surge XT) and fully custom in-house engines (Omnisphere's
proprietary STEAM Engine, Voltage Modular's Java-based engine). There's no
single "right" way to build one — the choice here optimizes for the builder's
existing skills and a personal-project scope, not for competing with
professional studios' years of engineering investment.

## Conventions / preferences to maintain going forward

- Keep the signal chain explicit and readable — this is a learning project,
  favor clarity over cleverness in the DSP code
- Use Web Audio's scheduling methods (`setValueAtTime`,
  `linearRampToValueAtTime`, `setTargetAtTime`) for all parameter changes
  rather than setting `.value` directly, to avoid audio clicks/zipper noise
- Keep the hardware-panel-style visual identity (dark graphite panel, amber/
  teal accent colors, monospace typography) unless there's a specific reason
  to change direction
- No external audio framework dependency yet (raw Web Audio API) — only
  introduce Tone.js, Elementary Audio, or similar if a specific limitation is
  hit that raw Web Audio API can't reasonably solve

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSynthEngine } from './useSynthEngine';

class FakeAudioParam {
  value = 0;
  setTargetAtTime = vi.fn((target: number) => { this.value = target; return this; });
  setValueAtTime = vi.fn((value: number) => { this.value = value; return this; });
  linearRampToValueAtTime = vi.fn((value: number) => { this.value = value; return this; });
  cancelScheduledValues = vi.fn(() => this);
}

class FakeOscillatorNode {
  type = 'sawtooth';
  frequency = new FakeAudioParam();
  connect = vi.fn();
  start = vi.fn();
}

class FakeBiquadFilterNode {
  type = 'lowpass';
  frequency = new FakeAudioParam();
  Q = new FakeAudioParam();
  connect = vi.fn();
}

class FakeGainNode {
  gain = new FakeAudioParam();
  connect = vi.fn();
}

class FakeAnalyserNode {
  fftSize = 0;
  connect = vi.fn();
}

// Track every node the engine creates so tests can inspect the real instance
// the hook is driving, rather than asserting on class-level spies.
let lastOsc: FakeOscillatorNode;
let lastFilter: FakeBiquadFilterNode;
let lastGain: FakeGainNode;
let lastAnalyser: FakeAnalyserNode;

let lastCtx: FakeAudioContext;

class FakeAudioContext {
  currentTime = 0;
  destination = {};
  createOscillator = vi.fn(() => (lastOsc = new FakeOscillatorNode()));
  createBiquadFilter = vi.fn(() => (lastFilter = new FakeBiquadFilterNode()));
  createGain = vi.fn(() => (lastGain = new FakeGainNode()));
  createAnalyser = vi.fn(() => (lastAnalyser = new FakeAnalyserNode()));

  constructor() {
    lastCtx = this;
  }
}

beforeEach(() => {
  lastCtx = undefined as unknown as FakeAudioContext;
  vi.stubGlobal('AudioContext', FakeAudioContext);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useSynthEngine', () => {
  it('does not build the audio graph until the first noteOn', () => {
    renderHook(() => useSynthEngine());
    expect(lastCtx).toBeUndefined();
  });

  it('builds the graph lazily and only once across repeated notes', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.noteOn(60));
    act(() => result.current.noteOn(64));

    expect(lastCtx.createOscillator).toHaveBeenCalledTimes(1);
    expect(lastOsc.start).toHaveBeenCalledTimes(1);
    expect(lastOsc.connect).toHaveBeenCalledWith(lastFilter);
    expect(lastFilter.connect).toHaveBeenCalledWith(lastGain);
    expect(lastGain.connect).toHaveBeenCalledWith(lastAnalyser);
  });

  it('sets oscillator frequency to the MIDI note frequency on noteOn', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.noteOn(69)); // A4 -> 440 Hz

    expect(lastOsc.frequency.setTargetAtTime).toHaveBeenCalledWith(
      expect.closeTo(440, 5),
      0,
      0.004,
    );
  });

  it('shifts the note-on frequency by the configured octave offset', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.setOctave(1));
    act(() => result.current.noteOn(69)); // A4 + 1 octave -> 880 Hz

    expect(lastOsc.frequency.setTargetAtTime).toHaveBeenCalledWith(
      expect.closeTo(880, 5),
      0,
      0.004,
    );
  });

  it('ramps the gain up to 0.35 over the attack time on noteOn', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.setAttack(0.05));
    act(() => result.current.noteOn(60));

    expect(lastGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.35, 0.05);
  });

  it('ramps the gain down over the release time on noteOff for the active note', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.setRelease(0.3));
    act(() => result.current.noteOn(60));
    act(() => result.current.noteOff(60));

    expect(lastGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.0001, 0.3);
  });

  it('ignores noteOff for a note that is not the currently active one', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.noteOn(60));
    lastGain.gain.linearRampToValueAtTime.mockClear();

    act(() => result.current.noteOff(61)); // 61 was never sounded

    expect(lastGain.gain.linearRampToValueAtTime).not.toHaveBeenCalled();
  });

  it('applies waveform changes to an already-running oscillator', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.noteOn(60));
    act(() => result.current.setWaveform('square'));

    expect(lastOsc.type).toBe('square');
  });

  it('applies the waveform set before the first noteOn to the newly created oscillator', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.setWaveform('triangle'));
    act(() => result.current.noteOn(60));

    expect(lastOsc.type).toBe('triangle');
  });

  it('pushes cutoff/resonance changes to the filter node', () => {
    const { result } = renderHook(() => useSynthEngine());

    act(() => result.current.noteOn(60));
    act(() => result.current.setCutoff(500));
    act(() => result.current.setResonance(8));

    expect(lastFilter.frequency.setTargetAtTime).toHaveBeenCalledWith(500, 0, 0.01);
    expect(lastFilter.Q.setTargetAtTime).toHaveBeenCalledWith(8, 0, 0.01);
  });

  it('does not throw when parameters are set before any note has played', () => {
    const { result } = renderHook(() => useSynthEngine());

    expect(() => {
      act(() => {
        result.current.setCutoff(500);
        result.current.setResonance(5);
        result.current.setAttack(0.1);
        result.current.setRelease(0.5);
        result.current.setWaveform('square');
      });
    }).not.toThrow();

    expect(result.current.getAnalyser()).toBeNull();
  });
});

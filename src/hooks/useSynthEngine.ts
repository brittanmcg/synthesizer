import { useCallback, useRef } from 'react';
import { midiToFreq } from '../lib/notes';

export type Waveform = 'sawtooth' | 'square' | 'triangle' | 'sine';

interface EngineParams {
  waveform: Waveform;
  cutoff: number; // Hz
  resonance: number; // Q
  attack: number; // seconds
  release: number; // seconds
  octaveOffset: number;
}

/**
 * Owns the Web Audio graph: Oscillator -> Biquad Lowpass Filter -> Gain (AR envelope) -> Analyser.
 * The graph is created lazily on the first note-on, since AudioContext requires a user gesture.
 * All mutable audio state lives in refs so parameter changes never trigger a React re-render.
 */
export function useSynthEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const ampGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeNoteRef = useRef<number | null>(null);

  const paramsRef = useRef<EngineParams>({
    waveform: 'sawtooth',
    cutoff: 2000,
    resonance: 1.0,
    attack: 0.01,
    release: 0.2,
    octaveOffset: 0,
  });

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const audioCtx = new AudioContext();

    const osc = audioCtx.createOscillator();
    osc.type = paramsRef.current.waveform;
    osc.frequency.value = 440;

    const filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = paramsRef.current.cutoff;
    filterNode.Q.value = paramsRef.current.resonance;

    const ampGain = audioCtx.createGain();
    ampGain.gain.value = 0;

    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    osc.connect(filterNode);
    filterNode.connect(ampGain);
    ampGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    osc.start();

    audioCtxRef.current = audioCtx;
    oscRef.current = osc;
    filterRef.current = filterNode;
    ampGainRef.current = ampGain;
    analyserRef.current = analyser;
  }, []);

  const noteOn = useCallback((midiNote: number) => {
    initAudio();
    const audioCtx = audioCtxRef.current!;
    const osc = oscRef.current!;
    const ampGain = ampGainRef.current!;

    activeNoteRef.current = midiNote;
    const freq = midiToFreq(midiNote + paramsRef.current.octaveOffset * 12);
    const now = audioCtx.currentTime;

    osc.frequency.setTargetAtTime(freq, now, 0.004);

    ampGain.gain.cancelScheduledValues(now);
    ampGain.gain.setValueAtTime(ampGain.gain.value, now);
    ampGain.gain.linearRampToValueAtTime(0.35, now + Math.max(paramsRef.current.attack, 0.002));
  }, [initAudio]);

  const noteOff = useCallback((midiNote: number) => {
    if (midiNote !== activeNoteRef.current) return;
    const audioCtx = audioCtxRef.current;
    const ampGain = ampGainRef.current;
    if (!audioCtx || !ampGain) return;

    const now = audioCtx.currentTime;
    ampGain.gain.cancelScheduledValues(now);
    ampGain.gain.setValueAtTime(ampGain.gain.value, now);
    ampGain.gain.linearRampToValueAtTime(0.0001, now + Math.max(paramsRef.current.release, 0.01));
    activeNoteRef.current = null;
  }, []);

  const setWaveform = useCallback((waveform: Waveform) => {
    paramsRef.current.waveform = waveform;
    if (oscRef.current) oscRef.current.type = waveform;
  }, []);

  const setCutoff = useCallback((value: number) => {
    paramsRef.current.cutoff = value;
    if (filterRef.current && audioCtxRef.current) {
      filterRef.current.frequency.setTargetAtTime(value, audioCtxRef.current.currentTime, 0.01);
    }
  }, []);

  const setResonance = useCallback((value: number) => {
    paramsRef.current.resonance = value;
    if (filterRef.current && audioCtxRef.current) {
      filterRef.current.Q.setTargetAtTime(value, audioCtxRef.current.currentTime, 0.01);
    }
  }, []);

  const setAttack = useCallback((value: number) => {
    paramsRef.current.attack = value;
  }, []);

  const setRelease = useCallback((value: number) => {
    paramsRef.current.release = value;
  }, []);

  const setOctave = useCallback((value: number) => {
    paramsRef.current.octaveOffset = value;
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return {
    noteOn,
    noteOff,
    setWaveform,
    setCutoff,
    setResonance,
    setAttack,
    setRelease,
    setOctave,
    getAnalyser,
  };
}

export type SynthEngine = ReturnType<typeof useSynthEngine>;

import { useCallback, useRef, useState } from 'react';
import { Scope } from './components/Scope';
import { WaveButtons } from './components/WaveButtons';
import { Knob } from './components/Knob';
import { PianoKeyboard } from './components/PianoKeyboard';
import { StatusBar } from './components/StatusBar';
import { useSynthEngine, type Waveform } from './hooks/useSynthEngine';
import { useMidi } from './hooks/useMidi';
import { useComputerKeyboard } from './hooks/useComputerKeyboard';
import './style.css';

export default function App() {
  const engine = useSynthEngine();

  const [waveform, setWaveform] = useState<Waveform>('sawtooth');
  const [cutoff, setCutoff] = useState(2000);
  const [resonance, setResonance] = useState(1.0);
  const [attack, setAttack] = useState(0.01);
  const [release, setRelease] = useState(0.2);
  const [octave, setOctave] = useState(0);

  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [noteFlash, setNoteFlash] = useState(false);
  const noteFlashTimer = useRef<number>();

  const triggerNoteFlash = useCallback(() => {
    setNoteFlash(true);
    window.clearTimeout(noteFlashTimer.current);
    noteFlashTimer.current = window.setTimeout(() => setNoteFlash(false), 90);
  }, []);

  const handleNoteOn = useCallback((note: number) => {
    engine.noteOn(note);
    setActiveNote(note);
    triggerNoteFlash();
  }, [engine, triggerNoteFlash]);

  const handleNoteOff = useCallback((note: number) => {
    engine.noteOff(note);
    setActiveNote((prev) => (prev === note ? null : prev));
  }, [engine]);

  const midi = useMidi({ onNoteOn: handleNoteOn, onNoteOff: handleNoteOff });
  useComputerKeyboard({ onNoteOn: handleNoteOn, onNoteOff: handleNoteOff });

  const handleWaveformChange = (wave: Waveform) => {
    setWaveform(wave);
    engine.setWaveform(wave);
  };
  const handleCutoffChange = (v: number) => {
    setCutoff(v);
    engine.setCutoff(v);
  };
  const handleResonanceChange = (v: number) => {
    setResonance(v);
    engine.setResonance(v);
  };
  const handleAttackChange = (v: number) => {
    setAttack(v);
    engine.setAttack(v);
  };
  const handleReleaseChange = (v: number) => {
    setRelease(v);
    engine.setRelease(v);
  };
  const handleOctaveChange = (v: number) => {
    setOctave(v);
    engine.setOctave(Math.round(v));
  };

  return (
    <div className="machine">
      <div className="header">
        <h1>MONO<span>—1</span></h1>
        <div className="subtitle">PHASE 1 · OSC → FILTER → AMP</div>
      </div>

      <div className="panel">
        <Scope getAnalyser={engine.getAnalyser} />

        <div className="sections">
          <div className="section osc">
            <div className="section-title"><span className="dot" />OSCILLATOR</div>
            <div className="row">
              <WaveButtons value={waveform} onChange={handleWaveformChange} />
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <Knob
                id="knob-octave"
                min={-3}
                max={3}
                value={octave}
                label="OCTAVE"
                format={(v) => `${Math.round(v) >= 0 ? '+' : ''}${Math.round(v)}`}
                onChange={handleOctaveChange}
              />
            </div>
          </div>

          <div className="section filt">
            <div className="section-title"><span className="dot" />FILTER</div>
            <div className="row">
              <Knob
                id="knob-cutoff"
                min={80}
                max={12000}
                value={cutoff}
                log
                label="CUTOFF"
                format={(v) => `${Math.round(v)} Hz`}
                onChange={handleCutoffChange}
              />
              <Knob
                id="knob-resonance"
                min={0.1}
                max={20}
                value={resonance}
                label="RESONANCE"
                format={(v) => v.toFixed(1)}
                onChange={handleResonanceChange}
              />
            </div>
          </div>

          <div className="section env">
            <div className="section-title"><span className="dot" />ENVELOPE</div>
            <div className="row">
              <Knob
                id="knob-attack"
                min={0.002}
                max={2}
                value={attack}
                log
                label="ATTACK"
                format={(v) => `${Math.round(v * 1000)} ms`}
                onChange={handleAttackChange}
              />
              <Knob
                id="knob-release"
                min={0.01}
                max={3}
                value={release}
                log
                label="RELEASE"
                format={(v) => `${Math.round(v * 1000)} ms`}
                onChange={handleReleaseChange}
              />
            </div>
          </div>
        </div>

        <PianoKeyboard activeNote={activeNote} onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />

        <div className="hint">
          Click keys, or play with your computer keyboard: <b>A S D F G H J K</b> (white) · <b>W E T Y U</b> (black)
        </div>

        <StatusBar
          noteFlash={noteFlash}
          midiFlash={midi.flash}
          midiStatus={midi.status}
          midiDeviceName={midi.deviceName}
        />
      </div>
    </div>
  );
}

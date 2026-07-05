import { useEffect, useRef, useState } from 'react';

export type MidiStatus = 'searching' | 'unsupported' | 'connected' | 'disconnected';

interface UseMidiOptions {
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
}

interface UseMidiResult {
  status: MidiStatus;
  deviceName: string | null;
  /** Pulses true for ~90ms whenever a note-on message arrives, for LED flash UI. */
  flash: boolean;
}

/** Wires up Web MIDI hardware input, forwarding note on/off to the synth engine. */
export function useMidi({ onNoteOn, onNoteOff }: UseMidiOptions): UseMidiResult {
  const [status, setStatus] = useState<MidiStatus>('searching');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<number>();

  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  onNoteOnRef.current = onNoteOn;
  onNoteOffRef.current = onNoteOff;

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setStatus('unsupported');
      return;
    }

    let cancelled = false;
    let access: MIDIAccess | null = null;

    function handleMessage(e: MIDIMessageEvent) {
      const data = e.data;
      if (!data) return;
      const [statusByte, note, velocity] = data;
      const cmd = statusByte & 0xf0;
      if (cmd === 0x90 && velocity > 0) {
        onNoteOnRef.current(note);
        setFlash(true);
        window.clearTimeout(flashTimer.current);
        flashTimer.current = window.setTimeout(() => setFlash(false), 90);
      } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
        onNoteOffRef.current(note);
      }
    }

    function hookInputs(midiAccess: MIDIAccess) {
      const inputs = Array.from(midiAccess.inputs.values());
      inputs.forEach((input) => { input.onmidimessage = handleMessage; });
      if (inputs.length > 0) {
        setStatus('connected');
        setDeviceName(inputs[0].name ?? null);
      } else {
        setStatus('disconnected');
        setDeviceName(null);
      }
    }

    navigator.requestMIDIAccess()
      .then((midiAccess) => {
        if (cancelled) return;
        access = midiAccess;
        hookInputs(midiAccess);
        midiAccess.onstatechange = () => hookInputs(midiAccess);
      })
      .catch(() => {
        if (!cancelled) setStatus('disconnected');
      });

    return () => {
      cancelled = true;
      if (access) access.onstatechange = null;
      window.clearTimeout(flashTimer.current);
    };
  }, []);

  return { status, deviceName, flash };
}

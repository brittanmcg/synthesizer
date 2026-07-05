import type { MidiStatus } from '../hooks/useMidi';

interface StatusBarProps {
  noteFlash: boolean;
  midiFlash: boolean;
  midiStatus: MidiStatus;
  midiDeviceName: string | null;
}

function midiText(status: MidiStatus, deviceName: string | null): string {
  switch (status) {
    case 'searching':
      return 'MIDI: SEARCHING…';
    case 'unsupported':
      return 'MIDI: UNSUPPORTED BROWSER';
    case 'connected':
      return deviceName ? `MIDI: ${deviceName}` : 'MIDI: CONNECTED';
    case 'disconnected':
      return 'MIDI: NO DEVICE';
  }
}

export function StatusBar({ noteFlash, midiFlash, midiStatus, midiDeviceName }: StatusBarProps) {
  const midiConnected = midiStatus === 'connected';

  return (
    <div className="status" style={{ marginTop: 14, justifyContent: 'center' }}>
      <div className={`led${noteFlash ? ' on' : ''}`} />
      <span>NOTE</span>
      <span style={{ width: 16 }} />
      <div className={`led midi-ready${midiConnected ? ' active' : ''}${midiFlash ? ' on' : ''}`} />
      <span>{midiText(midiStatus, midiDeviceName)}</span>
    </div>
  );
}

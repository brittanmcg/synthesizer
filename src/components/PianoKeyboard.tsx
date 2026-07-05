import type { TouchEvent } from 'react';
import { whiteNotes, blackLayout } from '../lib/notes';

interface PianoKeyboardProps {
  activeNote: number | null;
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
}

const whiteWidthPct = 100 / whiteNotes.length;

export function PianoKeyboard({ activeNote, onNoteOn, onNoteOff }: PianoKeyboardProps) {
  const bind = (note: number) => ({
    onMouseDown: () => onNoteOn(note),
    onMouseUp: () => onNoteOff(note),
    onMouseLeave: () => { if (activeNote === note) onNoteOff(note); },
    onTouchStart: (e: TouchEvent) => { e.preventDefault(); onNoteOn(note); },
    onTouchEnd: (e: TouchEvent) => { e.preventDefault(); onNoteOff(note); },
  });

  return (
    <div className="keyboard">
      {whiteNotes.map((note) => (
        <div
          key={note}
          className={`key white${activeNote === note ? ' active' : ''}`}
          data-note={note}
          {...bind(note)}
        />
      ))}
      {blackLayout.map(({ note, afterWhiteIndex }) => (
        <div
          key={note}
          className={`key black${activeNote === note ? ' active' : ''}`}
          data-note={note}
          style={{ left: `calc(${(afterWhiteIndex + 1) * whiteWidthPct}% - 2.8%)` }}
          {...bind(note)}
        />
      ))}
    </div>
  );
}

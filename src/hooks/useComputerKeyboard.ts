import { useEffect, useRef } from 'react';
import { keyMap } from '../lib/notes';

interface UseComputerKeyboardOptions {
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
}

/** Maps A S D F G H J K (white) / W E T Y U (black) to MIDI notes. */
export function useComputerKeyboard({ onNoteOn, onNoteOff }: UseComputerKeyboardOptions) {
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  onNoteOnRef.current = onNoteOn;
  onNoteOffRef.current = onNoteOff;

  useEffect(() => {
    const heldKeys = new Set<string>();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const note = keyMap[e.key.toLowerCase()];
      if (note !== undefined && !heldKeys.has(e.key)) {
        heldKeys.add(e.key);
        onNoteOnRef.current(note);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      const note = keyMap[e.key.toLowerCase()];
      if (note !== undefined) {
        heldKeys.delete(e.key);
        onNoteOffRef.current(note);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
}

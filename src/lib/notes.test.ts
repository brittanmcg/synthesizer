import { describe, expect, it } from 'vitest';
import { whiteNotes, blackLayout, keyMap, midiToFreq } from './notes';

describe('midiToFreq', () => {
  it('returns 440 Hz for MIDI note 69 (A4)', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
  });

  it('doubles frequency one octave up (12 semitones)', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 5);
  });

  it('halves frequency one octave down', () => {
    expect(midiToFreq(57)).toBeCloseTo(220, 5);
  });
});

describe('whiteNotes / blackLayout', () => {
  it('has 13 white keys, strictly ascending, no duplicates', () => {
    expect(whiteNotes).toHaveLength(13);
    for (let i = 1; i < whiteNotes.length; i++) {
      expect(whiteNotes[i]).toBeGreaterThan(whiteNotes[i - 1]);
    }
  });

  it('has 9 black keys, none overlapping a white key', () => {
    expect(blackLayout).toHaveLength(9);
    const whiteSet = new Set(whiteNotes);
    for (const { note } of blackLayout) {
      expect(whiteSet.has(note)).toBe(false);
    }
  });

  it('positions every black key after a valid white key index', () => {
    for (const { afterWhiteIndex } of blackLayout) {
      expect(afterWhiteIndex).toBeGreaterThanOrEqual(0);
      expect(afterWhiteIndex).toBeLessThan(whiteNotes.length);
    }
  });
});

describe('keyMap', () => {
  it('maps computer-keyboard keys to a contiguous 13-note range starting at 60', () => {
    const notes = Object.values(keyMap).sort((a, b) => a - b);
    expect(notes).toHaveLength(13);
    expect(notes[0]).toBe(60);
    expect(notes[notes.length - 1]).toBe(72);
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i]).toBe(notes[i - 1] + 1);
    }
  });

  it('maps the documented white and black keys correctly', () => {
    expect(keyMap['a']).toBe(60);
    expect(keyMap['w']).toBe(61);
    expect(keyMap['k']).toBe(72);
  });
});

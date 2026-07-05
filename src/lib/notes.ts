// Two octaves, C4–C6: white keys laid out as flex children,
// black keys positioned by percentage offset after a given white key index.

export const whiteNotes = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81];

export interface BlackKey {
  note: number;
  afterWhiteIndex: number;
}

export const blackLayout: BlackKey[] = [
  { note: 61, afterWhiteIndex: 0 },
  { note: 63, afterWhiteIndex: 1 },
  { note: 66, afterWhiteIndex: 3 },
  { note: 68, afterWhiteIndex: 4 },
  { note: 70, afterWhiteIndex: 5 },
  { note: 73, afterWhiteIndex: 7 },
  { note: 75, afterWhiteIndex: 8 },
  { note: 78, afterWhiteIndex: 10 },
  { note: 80, afterWhiteIndex: 11 },
];

export const keyMap: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64,
  f: 65, t: 66, g: 67, y: 68, h: 69,
  u: 70, j: 71, k: 72,
};

export function midiToFreq(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

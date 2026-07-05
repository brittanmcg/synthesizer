// Pure scaling math for the rotary Knob control, split out from the
// component so it can be unit tested without touching pointer events or DOM.

/** Maps a value in [min, max] to a normalized [0, 1] position, linear or log-scaled. */
export function toNorm(v: number, min: number, max: number, log: boolean): number {
  if (log) {
    const lv = Math.log(v), lmin = Math.log(min), lmax = Math.log(max);
    return (lv - lmin) / (lmax - lmin);
  }
  return (v - min) / (max - min);
}

/** Inverse of toNorm — maps a normalized [0, 1] position back to [min, max], clamping first. */
export function fromNorm(n: number, min: number, max: number, log: boolean): number {
  const clamped = Math.min(1, Math.max(0, n));
  if (log) {
    const lmin = Math.log(min), lmax = Math.log(max);
    return Math.exp(lmin + clamped * (lmax - lmin));
  }
  return min + clamped * (max - min);
}

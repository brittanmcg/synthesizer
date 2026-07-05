import { describe, expect, it } from 'vitest';
import { toNorm, fromNorm } from './knobScale';

describe('linear scaling', () => {
  it('maps the midpoint of the range to 0.5', () => {
    expect(toNorm(5, 0, 10, false)).toBeCloseTo(0.5, 10);
  });

  it('maps the endpoints to 0 and 1', () => {
    expect(toNorm(0, 0, 10, false)).toBeCloseTo(0, 10);
    expect(toNorm(10, 0, 10, false)).toBeCloseTo(1, 10);
  });

  it('is the inverse of fromNorm', () => {
    expect(fromNorm(0.5, 0, 10, false)).toBeCloseTo(5, 10);
    expect(fromNorm(0.25, -20, 20, false)).toBeCloseTo(-10, 10);
  });

  it('clamps out-of-range normalized input', () => {
    expect(fromNorm(-1, 0, 10, false)).toBe(0);
    expect(fromNorm(2, 0, 10, false)).toBe(10);
  });
});

describe('log scaling', () => {
  it('maps the geometric midpoint of the range to 0.5', () => {
    // 1000 is the geometric mean of 100 and 10000
    expect(toNorm(1000, 100, 10000, true)).toBeCloseTo(0.5, 10);
  });

  it('maps the endpoints to 0 and 1', () => {
    expect(toNorm(80, 80, 12000, true)).toBeCloseTo(0, 10);
    expect(toNorm(12000, 80, 12000, true)).toBeCloseTo(1, 10);
  });

  it('round-trips through toNorm/fromNorm', () => {
    for (const v of [80, 250, 2000, 12000]) {
      expect(fromNorm(toNorm(v, 80, 12000, true), 80, 12000, true)).toBeCloseTo(v, 6);
    }
  });

  it('clamps out-of-range normalized input to the range endpoints', () => {
    expect(fromNorm(-1, 80, 12000, true)).toBeCloseTo(80, 10);
    expect(fromNorm(2, 80, 12000, true)).toBeCloseTo(12000, 10);
  });
});

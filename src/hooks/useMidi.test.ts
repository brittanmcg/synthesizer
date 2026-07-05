import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useMidi } from './useMidi';

class FakeMidiInput {
  onmidimessage: ((e: { data: Uint8Array }) => void) | null = null;
  constructor(public name: string) {}
}

class FakeMidiAccess {
  inputs: Map<string, FakeMidiInput>;
  onstatechange: (() => void) | null = null;
  constructor(inputs: FakeMidiInput[]) {
    this.inputs = new Map(inputs.map((input, i) => [String(i), input]));
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess;
});

describe('useMidi', () => {
  it('reports unsupported when the browser has no Web MIDI API', async () => {
    const { result } = renderHook(() => useMidi({ onNoteOn: vi.fn(), onNoteOff: vi.fn() }));
    await waitFor(() => expect(result.current.status).toBe('unsupported'));
  });

  it('starts in "searching" before the access promise resolves', () => {
    let resolveAccess!: (access: FakeMidiAccess) => void;
    (navigator as unknown as { requestMIDIAccess: () => Promise<FakeMidiAccess> }).requestMIDIAccess =
      () => new Promise((resolve) => { resolveAccess = resolve; });

    const { result } = renderHook(() => useMidi({ onNoteOn: vi.fn(), onNoteOff: vi.fn() }));
    expect(result.current.status).toBe('searching');
    // avoid an unresolved promise leaking into the next test
    resolveAccess(new FakeMidiAccess([]));
  });

  it('reports connected with the device name when an input is present', async () => {
    const input = new FakeMidiInput('Fake Keyboard');
    (navigator as unknown as { requestMIDIAccess: () => Promise<FakeMidiAccess> }).requestMIDIAccess =
      () => Promise.resolve(new FakeMidiAccess([input]));

    const { result } = renderHook(() => useMidi({ onNoteOn: vi.fn(), onNoteOff: vi.fn() }));

    await waitFor(() => expect(result.current.status).toBe('connected'));
    expect(result.current.deviceName).toBe('Fake Keyboard');
  });

  it('reports disconnected when there are no inputs', async () => {
    (navigator as unknown as { requestMIDIAccess: () => Promise<FakeMidiAccess> }).requestMIDIAccess =
      () => Promise.resolve(new FakeMidiAccess([]));

    const { result } = renderHook(() => useMidi({ onNoteOn: vi.fn(), onNoteOff: vi.fn() }));

    await waitFor(() => expect(result.current.status).toBe('disconnected'));
    expect(result.current.deviceName).toBeNull();
  });

  it('reports disconnected if requesting access rejects', async () => {
    (navigator as unknown as { requestMIDIAccess: () => Promise<FakeMidiAccess> }).requestMIDIAccess =
      () => Promise.reject(new Error('denied'));

    const { result } = renderHook(() => useMidi({ onNoteOn: vi.fn(), onNoteOff: vi.fn() }));

    await waitFor(() => expect(result.current.status).toBe('disconnected'));
  });

  it('forwards note-on/note-off messages and flashes on note-on', async () => {
    const input = new FakeMidiInput('Fake Keyboard');
    (navigator as unknown as { requestMIDIAccess: () => Promise<FakeMidiAccess> }).requestMIDIAccess =
      () => Promise.resolve(new FakeMidiAccess([input]));

    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();
    const { result } = renderHook(() => useMidi({ onNoteOn, onNoteOff }));

    await waitFor(() => expect(result.current.status).toBe('connected'));
    expect(input.onmidimessage).not.toBeNull();

    act(() => {
      input.onmidimessage!({ data: new Uint8Array([0x90, 64, 100]) }); // note-on, velocity 100
    });
    expect(onNoteOn).toHaveBeenCalledWith(64);
    expect(result.current.flash).toBe(true);

    await waitFor(() => expect(result.current.flash).toBe(false), { timeout: 500 });

    act(() => {
      input.onmidimessage!({ data: new Uint8Array([0x80, 64, 0]) }); // note-off
    });
    expect(onNoteOff).toHaveBeenCalledWith(64);

    act(() => {
      input.onmidimessage!({ data: new Uint8Array([0x90, 67, 0]) }); // note-on w/ velocity 0 == note-off
    });
    expect(onNoteOff).toHaveBeenCalledWith(67);
  });
});

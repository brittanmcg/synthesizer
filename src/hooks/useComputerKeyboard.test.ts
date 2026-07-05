import { describe, expect, it, vi } from 'vitest';
import { renderHook, fireEvent } from '@testing-library/react';
import { useComputerKeyboard } from './useComputerKeyboard';

describe('useComputerKeyboard', () => {
  it('fires onNoteOn/onNoteOff for a mapped white key', () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();
    renderHook(() => useComputerKeyboard({ onNoteOn, onNoteOff }));

    fireEvent.keyDown(document, { key: 'a' });
    expect(onNoteOn).toHaveBeenCalledWith(60);

    fireEvent.keyUp(document, { key: 'a' });
    expect(onNoteOff).toHaveBeenCalledWith(60);
  });

  it('fires onNoteOn/onNoteOff for a mapped black key', () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();
    renderHook(() => useComputerKeyboard({ onNoteOn, onNoteOff }));

    fireEvent.keyDown(document, { key: 'w' });
    expect(onNoteOn).toHaveBeenCalledWith(61);

    fireEvent.keyUp(document, { key: 'w' });
    expect(onNoteOff).toHaveBeenCalledWith(61);
  });

  it('is case-insensitive', () => {
    const onNoteOn = vi.fn();
    renderHook(() => useComputerKeyboard({ onNoteOn, onNoteOff: vi.fn() }));

    fireEvent.keyDown(document, { key: 'A' });
    expect(onNoteOn).toHaveBeenCalledWith(60);
  });

  it('ignores unmapped keys', () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();
    renderHook(() => useComputerKeyboard({ onNoteOn, onNoteOff }));

    fireEvent.keyDown(document, { key: 'z' });
    fireEvent.keyUp(document, { key: 'z' });

    expect(onNoteOn).not.toHaveBeenCalled();
    expect(onNoteOff).not.toHaveBeenCalled();
  });

  it('does not re-trigger onNoteOn for OS auto-repeat while a key is held', () => {
    const onNoteOn = vi.fn();
    renderHook(() => useComputerKeyboard({ onNoteOn, onNoteOff: vi.fn() }));

    fireEvent.keyDown(document, { key: 'a' });
    fireEvent.keyDown(document, { key: 'a', repeat: true });
    fireEvent.keyDown(document, { key: 'a' }); // still held, even without the repeat flag

    expect(onNoteOn).toHaveBeenCalledTimes(1);
  });

  it('allows retriggering the same key after it has been released', () => {
    const onNoteOn = vi.fn();
    renderHook(() => useComputerKeyboard({ onNoteOn, onNoteOff: vi.fn() }));

    fireEvent.keyDown(document, { key: 'a' });
    fireEvent.keyUp(document, { key: 'a' });
    fireEvent.keyDown(document, { key: 'a' });

    expect(onNoteOn).toHaveBeenCalledTimes(2);
  });

  it('removes its listeners on unmount', () => {
    const onNoteOn = vi.fn();
    const { unmount } = renderHook(() => useComputerKeyboard({ onNoteOn, onNoteOff: vi.fn() }));

    unmount();
    fireEvent.keyDown(document, { key: 'a' });

    expect(onNoteOn).not.toHaveBeenCalled();
  });
});

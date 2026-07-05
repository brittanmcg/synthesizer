import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PianoKeyboard } from './PianoKeyboard';

describe('PianoKeyboard', () => {
  it('renders 13 white keys and 9 black keys', () => {
    const { container } = render(
      <PianoKeyboard activeNote={null} onNoteOn={vi.fn()} onNoteOff={vi.fn()} />,
    );
    expect(container.querySelectorAll('.key.white')).toHaveLength(13);
    expect(container.querySelectorAll('.key.black')).toHaveLength(9);
  });

  it('marks only the key matching activeNote as active', () => {
    const { container } = render(
      <PianoKeyboard activeNote={61} onNoteOn={vi.fn()} onNoteOff={vi.fn()} />,
    );
    expect(container.querySelector('[data-note="61"]')).toHaveClass('active');
    expect(container.querySelector('[data-note="60"]')).not.toHaveClass('active');
    expect(container.querySelectorAll('.active')).toHaveLength(1);
  });

  it('calls onNoteOn/onNoteOff on mousedown/mouseup for a given key', () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();
    const { container } = render(
      <PianoKeyboard activeNote={null} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />,
    );
    const key = container.querySelector('[data-note="64"]')!;

    key.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(onNoteOn).toHaveBeenCalledWith(64);

    key.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(onNoteOff).toHaveBeenCalledWith(64);
  });

  it('releases the active note when the mouse leaves the key', () => {
    const onNoteOff = vi.fn();
    const { container } = render(
      <PianoKeyboard activeNote={64} onNoteOn={vi.fn()} onNoteOff={onNoteOff} />,
    );
    const key = container.querySelector('[data-note="64"]')!;

    key.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));

    expect(onNoteOff).toHaveBeenCalledWith(64);
  });

  it('does not release a note on mouse-leave if that key is not the active one', () => {
    const onNoteOff = vi.fn();
    const { container } = render(
      <PianoKeyboard activeNote={60} onNoteOn={vi.fn()} onNoteOff={onNoteOff} />,
    );
    const key = container.querySelector('[data-note="64"]')!;

    key.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));

    expect(onNoteOff).not.toHaveBeenCalled();
  });
});

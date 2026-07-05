import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Knob } from './Knob';

function firePointer(el: Element, type: string, clientY: number, pointerId = 1) {
  el.dispatchEvent(
    new PointerEvent(type, { bubbles: true, cancelable: true, clientY, pointerId }),
  );
}

describe('Knob', () => {
  it('renders the label and formatted value', () => {
    const { getByText } = render(
      <Knob
        id="knob-test"
        min={0}
        max={10}
        value={5}
        label="TEST"
        format={(v) => `${v} units`}
        onChange={vi.fn()}
      />,
    );
    expect(getByText('TEST')).toBeInTheDocument();
    expect(getByText('5 units')).toBeInTheDocument();
  });

  it('falls back to a fixed 2-decimal string when no format is given', () => {
    const { getByText } = render(
      <Knob id="knob-test" min={0} max={10} value={3} label="TEST" onChange={vi.fn()} />,
    );
    expect(getByText('3.00')).toBeInTheDocument();
  });

  it('increases the value when dragged upward, clamped to max', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Knob id="knob-test" min={0} max={10} value={5} label="TEST" onChange={onChange} />,
    );
    const knob = container.querySelector('#knob-test')!;
    // element.setPointerCapture isn't implemented in jsdom; stub it out so the
    // component's pointerdown handler doesn't throw.
    (knob as HTMLElement & { setPointerCapture: (id: number) => void }).setPointerCapture = vi.fn();

    firePointer(knob, 'pointerdown', 100);
    firePointer(knob, 'pointermove', 30); // moved up 70px -> +0.5 norm on a 140px range

    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('decreases the value when dragged downward, clamped to min', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Knob id="knob-test" min={0} max={10} value={5} label="TEST" onChange={onChange} />,
    );
    const knob = container.querySelector('#knob-test')!;
    (knob as HTMLElement & { setPointerCapture: (id: number) => void }).setPointerCapture = vi.fn();

    firePointer(knob, 'pointerdown', 100);
    firePointer(knob, 'pointermove', 300); // moved down -> -0.5 norm past 0

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('stops responding to pointer moves after pointerup', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Knob id="knob-test" min={0} max={10} value={5} label="TEST" onChange={onChange} />,
    );
    const knob = container.querySelector('#knob-test')!;
    (knob as HTMLElement & { setPointerCapture: (id: number) => void }).setPointerCapture = vi.fn();

    firePointer(knob, 'pointerdown', 100);
    firePointer(knob, 'pointerup', 100);
    onChange.mockClear();

    firePointer(knob, 'pointermove', 0);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores pointer moves without a preceding pointerdown', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Knob id="knob-test" min={0} max={10} value={5} label="TEST" onChange={onChange} />,
    );
    const knob = container.querySelector('#knob-test')!;

    firePointer(knob, 'pointermove', 0);

    expect(onChange).not.toHaveBeenCalled();
  });
});

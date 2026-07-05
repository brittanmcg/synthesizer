import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('shows "SEARCHING" while MIDI status is unresolved', () => {
    const { getByText } = render(
      <StatusBar noteFlash={false} midiFlash={false} midiStatus="searching" midiDeviceName={null} />,
    );
    expect(getByText('MIDI: SEARCHING…')).toBeInTheDocument();
  });

  it('shows "UNSUPPORTED BROWSER" when Web MIDI is unavailable', () => {
    const { getByText } = render(
      <StatusBar noteFlash={false} midiFlash={false} midiStatus="unsupported" midiDeviceName={null} />,
    );
    expect(getByText('MIDI: UNSUPPORTED BROWSER')).toBeInTheDocument();
  });

  it('shows the device name when connected', () => {
    const { getByText } = render(
      <StatusBar noteFlash={false} midiFlash={false} midiStatus="connected" midiDeviceName="Fake Keyboard" />,
    );
    expect(getByText('MIDI: Fake Keyboard')).toBeInTheDocument();
  });

  it('falls back to "CONNECTED" when connected without a device name', () => {
    const { getByText } = render(
      <StatusBar noteFlash={false} midiFlash={false} midiStatus="connected" midiDeviceName={null} />,
    );
    expect(getByText('MIDI: CONNECTED')).toBeInTheDocument();
  });

  it('shows "NO DEVICE" when disconnected', () => {
    const { getByText } = render(
      <StatusBar noteFlash={false} midiFlash={false} midiStatus="disconnected" midiDeviceName={null} />,
    );
    expect(getByText('MIDI: NO DEVICE')).toBeInTheDocument();
  });

  it('applies the "on" flash class to the note LED only when noteFlash is true', () => {
    const { container, rerender } = render(
      <StatusBar noteFlash={false} midiFlash={false} midiStatus="disconnected" midiDeviceName={null} />,
    );
    const noteLed = container.querySelector('.led:not(.midi-ready)');
    expect(noteLed).not.toHaveClass('on');

    rerender(<StatusBar noteFlash={true} midiFlash={false} midiStatus="disconnected" midiDeviceName={null} />);
    expect(noteLed).toHaveClass('on');
  });

  it('marks the MIDI LED active only when connected', () => {
    const { container, rerender } = render(
      <StatusBar noteFlash={false} midiFlash={false} midiStatus="disconnected" midiDeviceName={null} />,
    );
    const midiLed = container.querySelector('.led.midi-ready');
    expect(midiLed).not.toHaveClass('active');

    rerender(<StatusBar noteFlash={false} midiFlash={false} midiStatus="connected" midiDeviceName="X" />);
    expect(midiLed).toHaveClass('active');
  });
});

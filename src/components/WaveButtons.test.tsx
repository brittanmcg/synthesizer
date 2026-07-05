import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaveButtons } from './WaveButtons';

describe('WaveButtons', () => {
  it('marks the current waveform button as active and the rest inactive', () => {
    render(<WaveButtons value="square" onChange={vi.fn()} />);

    expect(screen.getByTitle('Square')).toHaveClass('active');
    expect(screen.getByTitle('Saw')).not.toHaveClass('active');
    expect(screen.getByTitle('Triangle')).not.toHaveClass('active');
    expect(screen.getByTitle('Sine')).not.toHaveClass('active');
  });

  it('calls onChange with the clicked waveform', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<WaveButtons value="sawtooth" onChange={onChange} />);

    await user.click(screen.getByTitle('Sine'));

    expect(onChange).toHaveBeenCalledWith('sine');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

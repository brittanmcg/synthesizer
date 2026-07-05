import type { Waveform } from '../hooks/useSynthEngine';

interface WaveButtonsProps {
  value: Waveform;
  onChange: (wave: Waveform) => void;
}

const WAVES: { type: Waveform; symbol: string; title: string }[] = [
  { type: 'sawtooth', symbol: '◢', title: 'Saw' },
  { type: 'square', symbol: '▢', title: 'Square' },
  { type: 'triangle', symbol: '△', title: 'Triangle' },
  { type: 'sine', symbol: '∿', title: 'Sine' },
];

export function WaveButtons({ value, onChange }: WaveButtonsProps) {
  return (
    <div className="wave-buttons">
      {WAVES.map(({ type, symbol, title }) => (
        <button
          key={type}
          type="button"
          className={`wave-btn${value === type ? ' active' : ''}`}
          title={title}
          onClick={() => onChange(type)}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}

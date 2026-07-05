import { useRef, type PointerEvent } from 'react';

interface KnobProps {
  id: string;
  min: number;
  max: number;
  value: number;
  label: string;
  log?: boolean;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

const MIN_DEG = -135;
const MAX_DEG = 135;
const DRAG_RANGE_PX = 140;

function toNorm(v: number, min: number, max: number, log: boolean) {
  if (log) {
    const lv = Math.log(v), lmin = Math.log(min), lmax = Math.log(max);
    return (lv - lmin) / (lmax - lmin);
  }
  return (v - min) / (max - min);
}

function fromNorm(n: number, min: number, max: number, log: boolean) {
  const clamped = Math.min(1, Math.max(0, n));
  if (log) {
    const lmin = Math.log(min), lmax = Math.log(max);
    return Math.exp(lmin + clamped * (lmax - lmin));
  }
  return min + clamped * (max - min);
}

/** A draggable rotary knob (vertical drag), matching the original panel-hardware feel. */
export function Knob({ id, min, max, value, label, log = false, format, onChange }: KnobProps) {
  const dragRef = useRef({ dragging: false, startY: 0, startNorm: 0 });

  const norm = toNorm(value, min, max, log);
  const deg = MIN_DEG + norm * (MAX_DEG - MIN_DEG);
  const displayValue = format ? format(value) : value.toFixed(2);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragRef.current = { dragging: true, startY: e.clientY, startNorm: norm };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.dragging) return;
    const deltaY = drag.startY - e.clientY;
    const nextNorm = drag.startNorm + deltaY / DRAG_RANGE_PX;
    onChange(fromNorm(nextNorm, min, max, log));
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
  };

  return (
    <div className="knob-unit">
      <div
        className="knob"
        id={id}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="indicator" style={{ transform: `rotate(${deg}deg)` }} />
      </div>
      <div className="knob-label">{label}</div>
      <div className="knob-value">{displayValue}</div>
    </div>
  );
}

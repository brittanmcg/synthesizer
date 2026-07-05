import { useEffect, useRef } from 'react';

interface ScopeProps {
  getAnalyser: () => AnalyserNode | null;
}

/** Renders the live oscilloscope trace, or a flat idle line before any audio has started. */
export function Scope({ getAnalyser }: ScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    function resizeCanvas() {
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * devicePixelRatio;
      canvas!.height = rect.height * devicePixelRatio;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let frameId: number;
    function draw() {
      frameId = requestAnimationFrame(draw);
      const w = canvas!.width, h = canvas!.height;
      ctx!.fillStyle = '#08080a';
      ctx!.fillRect(0, 0, w, h);

      const analyser = getAnalyser();
      if (!analyser) {
        ctx!.strokeStyle = '#3a3a40';
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(0, h / 2);
        ctx!.lineTo(w, h / 2);
        ctx!.stroke();
        return;
      }

      const bufferLength = analyser.fftSize;
      const data = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(data);

      ctx!.lineWidth = 2 * devicePixelRatio;
      ctx!.strokeStyle = '#ffa726';
      ctx!.beginPath();
      const sliceWidth = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
        x += sliceWidth;
      }
      ctx!.stroke();
    }
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [getAnalyser]);

  return (
    <div className="scope-wrap">
      <div className="scope-label">OUTPUT</div>
      <canvas id="scope" ref={canvasRef} width={860} height={110} />
    </div>
  );
}

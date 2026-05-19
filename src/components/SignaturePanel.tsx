import { useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';
import {
  removeLightBackground,
  trimTransparentImage,
} from '../lib/imageUtils';
import { smoothSignaturePad } from '../lib/signatureSmooth';

const SIGNATURE_PAD_OPTIONS = {
  backgroundColor: 'rgba(0, 0, 0, 0)',
  penColor: 'rgb(37, 99, 235)',
  minWidth: 1.6,
  maxWidth: 1.8,
  velocityFilterWeight: 0.85,
  minDistance: 2,
  throttle: 8,
} as const;

interface Props {
  onApply: (dataUrl: string) => void;
  onClearDocument: () => void;
}

export function SignaturePanel({ onApply, onClearDocument }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, SIGNATURE_PAD_OPTIONS);
    padRef.current = pad;
    return () => pad.off();
  }, []);

  const applyDrawn = async () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      alert('Draw your signature first, or upload an image.');
      return;
    }
    smoothSignaturePad(pad);
    onApply(await trimTransparentImage(pad.toDataURL('image/png')));
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        onApply(await removeLightBackground(reader.result));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <section className="panel">
      <h2>Signature</h2>
      <canvas ref={canvasRef} className="signature-canvas" />
      <div className="row">
        <button
          type="button"
          onClick={() => {
            padRef.current?.clear();
            onClearDocument();
          }}
        >
          Clear
        </button>
        <button type="button" className="primary" onClick={applyDrawn}>
          Use signature
        </button>
      </div>
      <label className="file-label">
        Upload image
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onUpload}
          hidden
        />
      </label>
    </section>
  );
}

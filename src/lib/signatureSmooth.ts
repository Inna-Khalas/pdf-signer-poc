import type SignaturePad from 'signature_pad';

type StrokePoint = {
  x: number;
  y: number;
  time: number;
  pressure: number;
};

function toStrokePoint(p: {
  x: number;
  y: number;
  time: number;
  pressure: number;
}): StrokePoint {
  return { x: p.x, y: p.y, time: p.time, pressure: p.pressure };
}

function chaikinSmooth(
  points: Array<{ x: number; y: number; time: number; pressure: number }>,
  iterations = 2,
): StrokePoint[] {
  if (points.length < 3) return points.map(toStrokePoint);

  let current = points.map(toStrokePoint);
  for (let i = 0; i < iterations; i++) {
    const next: StrokePoint[] = [current[0]];
    for (let j = 0; j < current.length - 1; j++) {
      const a = current[j];
      const b = current[j + 1];
      next.push({
        x: 0.75 * a.x + 0.25 * b.x,
        y: 0.75 * a.y + 0.25 * b.y,
        time: a.time,
        pressure: (a.pressure + b.pressure) / 2,
      });
      next.push({
        x: 0.25 * a.x + 0.75 * b.x,
        y: 0.25 * a.y + 0.75 * b.y,
        time: b.time,
        pressure: (a.pressure + b.pressure) / 2,
      });
    }
    next.push(current[current.length - 1]);
    current = next;
  }
  return current;
}

/** Re-render signature with smoother curves (call before export). */
export function smoothSignaturePad(pad: SignaturePad, iterations = 2): void {
  const groups = pad.toData();
  if (!groups.length) return;

  const smoothed = groups.map((group) => ({
    ...group,
    points: chaikinSmooth(group.points, iterations),
  }));

  pad.fromData(smoothed);
}

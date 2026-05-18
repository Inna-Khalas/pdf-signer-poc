import { useRef } from 'react';
import type { ScreenPlacement } from '../types';

const MIN_WIDTH = 48;
const MIN_HEIGHT = 32;

interface Props {
  label: string;
  imageSrc: string;
  placement: ScreenPlacement;
  onChange: (placement: ScreenPlacement) => void;
  boundsWidth: number;
  boundsHeight: number;
}

export function DraggableOverlay({
  label,
  imageSrc,
  placement,
  onChange,
  boundsWidth,
  boundsHeight,
}: Props) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const resizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originWidth: number;
    originHeight: number;
    aspect: number;
  } | null>(null);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const onDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: placement.x,
      originY: placement.y,
    };
  };

  const onDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const maxX = boundsWidth - placement.width;
    const maxY = boundsHeight - placement.height;

    onChange({
      ...placement,
      x: clamp(dragRef.current.originX + dx, 0, Math.max(0, maxX)),
      y: clamp(dragRef.current.originY + dy, 0, Math.max(0, maxY)),
    });
  };

  const onDragPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onResizePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originWidth: placement.width,
      originHeight: placement.height,
      aspect: placement.width / placement.height,
    };
  };

  const onResizePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeRef.current || resizeRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    const delta = Math.max(dx, dy / resizeRef.current.aspect);

    let width = resizeRef.current.originWidth + delta;
    let height = width / resizeRef.current.aspect;

    const maxWidth = boundsWidth - placement.x;
    const maxHeight = boundsHeight - placement.y;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / resizeRef.current.aspect;
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = height * resizeRef.current.aspect;
    }

    width = Math.max(MIN_WIDTH, width);
    height = Math.max(MIN_HEIGHT, height);

    if (width > maxWidth) width = maxWidth;
    if (height > maxHeight) height = maxHeight;

    onChange({ ...placement, width, height });
  };

  const onResizePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (resizeRef.current?.pointerId === e.pointerId) {
      resizeRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      className="overlay-item"
      style={{
        left: placement.x,
        top: placement.y,
        width: placement.width,
        height: placement.height,
      }}
    >
      <div
        className="overlay-body"
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
      >
        <span className="overlay-label">{label}</span>
        <img src={imageSrc} alt={label} draggable={false} />
      </div>
      <button
        type="button"
        className="resize-handle"
        aria-label={`Resize ${label.toLowerCase()}`}
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
      />
    </div>
  );
}

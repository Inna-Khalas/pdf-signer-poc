import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import type { PageMetrics, ScreenPlacement } from '../types';
import { DraggableOverlay } from './DraggableOverlay';

const RENDER_WIDTH = 640;

export const DEFAULT_SIGNATURE: ScreenPlacement = {
  x: 360,
  y: 580,
  width: 200,
  height: 72,
};

export const DEFAULT_STAMP: ScreenPlacement = {
  x: 380,
  y: 560,
  width: 110,
  height: 110,
};

interface Props {
  pdfData: Uint8Array;
  signatureImage: string | null;
  stampImage: string | null;
  signaturePlacement: ScreenPlacement | null;
  stampPlacement: ScreenPlacement | null;
  onSignaturePlacementChange: (p: ScreenPlacement) => void;
  onStampPlacementChange: (p: ScreenPlacement) => void;
  onMetricsReady: (metrics: PageMetrics) => void;
}

export function PdfViewer({
  pdfData,
  signatureImage,
  stampImage,
  signaturePlacement,
  stampPlacement,
  onSignaturePlacementChange,
  onStampPlacementChange,
  onMetricsReady,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageSizeRef = useRef<{ originalWidth: number; originalHeight: number } | null>(null);
  const [viewport, setViewport] = useState<PageMetrics | null>(null);

  const file = useMemo(() => ({ data: pdfData.slice() }), [pdfData]);

  const syncViewport = useCallback(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    const page = pageSizeRef.current;
    if (!canvas || !shell || !page) return;

    const canvasRect = canvas.getBoundingClientRect();
    const shellRect = shell.getBoundingClientRect();

    const metrics: PageMetrics = {
      pdfWidth: page.originalWidth,
      pdfHeight: page.originalHeight,
      renderWidth: canvasRect.width,
      renderHeight: canvasRect.height,
      offsetX: canvasRect.left - shellRect.left,
      offsetY: canvasRect.top - shellRect.top,
    };

    setViewport(metrics);
    onMetricsReady(metrics);
  }, [onMetricsReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => syncViewport());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [syncViewport]);

  const boundsWidth = viewport?.renderWidth ?? RENDER_WIDTH;
  const boundsHeight = viewport?.renderHeight ?? boundsWidth * 1.414;

  return (
    <section className="panel pdf-stage">
      <div ref={shellRef} className="page-shell">
        <Document file={file} loading={<p className="hint">Loading…</p>}>
          <Page
            pageNumber={1}
            width={RENDER_WIDTH}
            canvasRef={canvasRef}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onRenderSuccess={(page) => {
              pageSizeRef.current = {
                originalWidth: page.originalWidth,
                originalHeight: page.originalHeight,
              };
              requestAnimationFrame(syncViewport);
            }}
          />
        </Document>
        {viewport && (
          <div
            className="overlay-layer"
            style={{
              left: viewport.offsetX ?? 0,
              top: viewport.offsetY ?? 0,
              width: viewport.renderWidth,
              height: viewport.renderHeight,
            }}
          >
            {signatureImage && (
              <DraggableOverlay
                label="Signature"
                imageSrc={signatureImage}
                placement={signaturePlacement ?? DEFAULT_SIGNATURE}
                onChange={onSignaturePlacementChange}
                boundsWidth={boundsWidth}
                boundsHeight={boundsHeight}
              />
            )}
            {stampImage && (
              <DraggableOverlay
                label="Stamp"
                imageSrc={stampImage}
                placement={stampPlacement ?? DEFAULT_STAMP}
                onChange={onStampPlacementChange}
                boundsWidth={boundsWidth}
                boundsHeight={boundsHeight}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

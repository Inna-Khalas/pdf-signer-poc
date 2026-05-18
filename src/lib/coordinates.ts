import type { PageMetrics, PdfPlacement, ScreenPlacement } from '../types';

export function screenToPdf(
  screen: ScreenPlacement,
  metrics: PageMetrics,
): PdfPlacement {
  const scaleX = metrics.renderWidth / metrics.pdfWidth;
  const scaleY = metrics.renderHeight / metrics.pdfHeight;

  return {
    page: 1,
    x: screen.x / scaleX,
    y: metrics.pdfHeight - screen.y / scaleY - screen.height / scaleY,
    width: screen.width / scaleX,
    height: screen.height / scaleY,
  };
}

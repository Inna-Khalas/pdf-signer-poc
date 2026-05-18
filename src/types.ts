export interface PdfPlacement {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageMetrics {
  pdfWidth: number;
  pdfHeight: number;
  renderWidth: number;
  renderHeight: number;
  offsetX?: number;
  offsetY?: number;
}

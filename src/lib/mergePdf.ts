import { PDFDocument } from 'pdf-lib';
import type { PdfPlacement } from '../types';

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function embedImage(pdfDoc: PDFDocument, dataUrl: string) {
  const bytes = dataUrlToUint8Array(dataUrl);
  if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) {
    return pdfDoc.embedJpg(bytes);
  }
  return pdfDoc.embedPng(bytes);
}

export async function mergeSignedPdf(
  originalPdfBytes: Uint8Array,
  signature: { image: string; placement: PdfPlacement } | null,
  stamp: { image: string; placement: PdfPlacement } | null,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const page = pdfDoc.getPages()[(signature?.placement.page ?? stamp?.placement.page ?? 1) - 1];

  if (signature?.placement) {
    const img = await embedImage(pdfDoc, signature.image);
    const { x, y, width, height } = signature.placement;
    page.drawImage(img, { x, y, width, height });
  }

  if (stamp?.placement) {
    const img = await embedImage(pdfDoc, stamp.image);
    const { x, y, width, height } = stamp.placement;
    page.drawImage(img, { x, y, width, height });
  }

  return pdfDoc.save();
}

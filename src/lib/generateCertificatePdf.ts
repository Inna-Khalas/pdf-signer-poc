import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import footerUrl from '../assets/certificate/footer.png';
import headerUrl from '../assets/certificate/header.png';
import termsUrl from '../assets/certificate/terms.png';
import poppinsRegularUrl from '../assets/fonts/Poppins-Regular.ttf?url';

export const A4_WIDTH = 596;
export const A4_HEIGHT = 842;

/** Crop bounds from reference PDF (y measured from top of page). */
const HEADER_BOTTOM = 212;
const INTRO_BASELINE_FIRST = 230;
const TERMS_TOP = 283;
const TERMS_BOTTOM = 547;
const FOOTER_TOP = 575;

const MARGIN_X = 72;
const CONTENT_WIDTH = 440;

const HEADER_HEIGHT = HEADER_BOTTOM;
const TERMS_HEIGHT = TERMS_BOTTOM - TERMS_TOP;
const FOOTER_HEIGHT = A4_HEIGHT - FOOTER_TOP;

const INTRO_PREFIX =
  'This document officially verifies that Airomedical is an authorized partner platform and designated representative of ';
const INTRO_SUFFIX = '.';

const TEXT_COLOR = rgb(0.2, 0.2, 0.22);
const INTRO_SIZE = 12;
const LINE_HEIGHT = 18;

async function fetchBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load asset: ${url}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function wrapLines(
  text: string,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateCertificatePdf(
  clinicName: string,
): Promise<Uint8Array> {
  const trimmed = clinicName.trim() || 'Unnamed Clinic';
  const introText = `${INTRO_PREFIX}${trimmed}${INTRO_SUFFIX}`;

  const [headerBytes, termsBytes, footerBytes, fontBytes] = await Promise.all([
    fetchBytes(headerUrl),
    fetchBytes(termsUrl),
    fetchBytes(footerUrl),
    fetchBytes(poppinsRegularUrl),
  ]);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

  const poppins = await pdfDoc.embedFont(fontBytes);

  const headerImg = await pdfDoc.embedPng(headerBytes);
  const termsImg = await pdfDoc.embedPng(termsBytes);
  const footerImg = await pdfDoc.embedPng(footerBytes);

  page.drawImage(headerImg, {
    x: 0,
    y: A4_HEIGHT - HEADER_HEIGHT,
    width: A4_WIDTH,
    height: HEADER_HEIGHT,
  });

  const lines = wrapLines(introText, poppins, INTRO_SIZE, CONTENT_WIDTH);
  let y = A4_HEIGHT - INTRO_BASELINE_FIRST;

  for (const line of lines) {
    page.drawText(line, {
      x: MARGIN_X,
      y,
      size: INTRO_SIZE,
      font: poppins,
      color: TEXT_COLOR,
    });
    y -= LINE_HEIGHT;
  }

  page.drawImage(termsImg, {
    x: 0,
    y: A4_HEIGHT - TERMS_BOTTOM,
    width: A4_WIDTH,
    height: TERMS_HEIGHT,
  });

  page.drawImage(footerImg, {
    x: 0,
    y: 0,
    width: A4_WIDTH,
    height: FOOTER_HEIGHT,
  });

  return pdfDoc.save();
}

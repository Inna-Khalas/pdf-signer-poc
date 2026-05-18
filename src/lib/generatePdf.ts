import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;

export async function generateTemplatePdf(
  clinicName: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = A4_HEIGHT - margin;

  page.drawText('Medical Consent Form', {
    x: margin,
    y: y - 28,
    size: 22,
    font: bold,
    color: rgb(0.1, 0.1, 0.15),
  });

  y -= 56;
  page.drawText(`Clinic Name: ${clinicName}`, {
    x: margin,
    y: y - 16,
    size: 14,
    font: bold,
    color: rgb(0.15, 0.35, 0.55),
  });

  y -= 40;
  const body =
    'I hereby consent to the medical procedures described by the clinic above. ' +
    'I confirm that the information provided is accurate to the best of my knowledge. ' +
    'This document was generated dynamically for demonstration purposes.';

  const lines = wrapText(body, 85);
  for (const line of lines) {
    page.drawText(line, {
      x: margin,
      y: y - 14,
      size: 11,
      font: regular,
      color: rgb(0.2, 0.2, 0.25),
    });
    y -= 18;
  }

  y -= 24;
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: A4_WIDTH - margin, y },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.8),
  });

  y -= 28;
  page.drawText('Patient signature', {
    x: margin,
    y: y - 12,
    size: 10,
    font: regular,
    color: rgb(0.45, 0.45, 0.5),
  });

  page.drawText('Official stamp', {
    x: A4_WIDTH / 2,
    y: y - 12,
    size: 10,
    font: regular,
    color: rgb(0.45, 0.45, 0.5),
  });

  page.drawText(
    `Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`,
    {
      x: margin,
      y: 36,
      size: 9,
      font: regular,
      color: rgb(0.55, 0.55, 0.6),
    },
  );

  return pdfDoc.save();
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

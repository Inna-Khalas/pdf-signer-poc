# PDF Signer PoC

Frontend-only prototype: generate a PDF from a template, place a signature and optional stamp on the document, export a single `signed-*.pdf` file. No backend.

## Run

```bash
cd pdf-signer-poc
npm install
npm run dev
```

## Flow

1. **Clinic name** → **Generate certificate** — builds the PDF in the browser (static header/terms/footer images + dynamic intro paragraph)
2. Signature (draw or upload) → **Use signature**
3. PNG stamp (optional)
4. Drag and resize on the preview
5. **Save** — downloads the signed PDF

Signature is required. Stamp is optional.

---

## Tools 


### pdf-lib

Two jobs in one library:

1. **Template** — `generateCertificatePdf.ts` composes the page from PNG slices in `src/assets/certificate/` (header, terms, footer) and **Poppins** (12pt) for the clinic-name paragraph. Source reference: `public/certificate-of-partnership.pdf`.
2. **Merge** — embed signature and stamp PNG/JPEG into the generated PDF at point coordinates (`mergePdf.ts`).

Runs in the browser with `Uint8Array`, no server. Simpler API than low-level PDF.js for **creating** and **editing** PDFs.

**Why not PDF.js alone:** PDF.js is great for **reading** and rendering, not for building pages programmatically or `drawImage` into the final file.

**PoC limitation:** layout slices are fixed PNGs; only the intro paragraph is dynamic. In production, build the template on the backend (DOCX → PDF).

---

### react-pdf (PDF.js)

**Preview** the generated PDF in the UI: page on a `<canvas>`, scaled to fit the viewport width.

We need the **real page size in points** (`originalWidth` / `originalHeight`) and the rendered canvas size — without that, on-screen placement and the saved PDF will not match.

**Why not `<iframe>` / the browser’s built-in viewer:** harder to align a drag overlay on the page and reliably read metrics for `screenToPdf`.

The worker is wired in `src/lib/pdfWorker.ts` (Vite-compatible).

---

### signature_pad

Draw a signature with mouse or touch on a canvas. Output is a PNG data URL, then trim transparent padding and overlay on the PDF.

Small dependency, no React wrapper required. Good enough for a DocuSign-style PoC.

**Why not a custom canvas from scratch:** pressure, throttle, clear, and stroke export are already handled.

**Why not perfect-freehand:** we tried it for smoothing and dropped it; light Chaikin smoothing on our own points before apply is enough for the PoC (`signatureSmooth.ts`).

---

### Custom code (no extra npm packages)

| Module | Purpose |
|--------|---------|
| `coordinates.ts` | Map overlay (CSS, top-left) → PDF points (bottom-left) |
| `imageUtils.ts` | Trim signature, remove white background on upload, size without upscale |
| `DraggableOverlay.tsx` | Drag & resize on the preview (Pointer Events) |

We did not add drag libraries (e.g. react-draggable) — the logic is simple and lives in one overlay layer.

---

## Coordinates (short)

- UI: pixels, origin top-left.
- PDF (pdf-lib): points, origin bottom-left.

Scale: `renderSize / pdfSize` from canvas metrics and `originalWidth`/`originalHeight`. See `src/lib/coordinates.ts`.

---


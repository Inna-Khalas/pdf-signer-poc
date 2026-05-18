import { useCallback, useState } from 'react';
import { PdfViewer, DEFAULT_SIGNATURE, DEFAULT_STAMP } from './components/PdfViewer';
import { SignaturePanel } from './components/SignaturePanel';
import { StampUpload } from './components/StampUpload';
import { downloadBlob, signedPdfFilename } from './lib/exportData';
import { generateTemplatePdf } from './lib/generatePdf';
import { mergeSignedPdf } from './lib/mergePdf';
import './lib/pdfWorker';
import { screenToPdf } from './lib/coordinates';
import { fitOverlaySize, getImageDimensions } from './lib/imageUtils';
import type { PageMetrics, ScreenPlacement } from './types';
import './App.css';

const SIGNATURE_MAX = { width: 240, height: 120 };
const STAMP_MAX = { width: 140, height: 140 };

function placementWithSize(
  dataUrl: string,
  defaults: ScreenPlacement,
  max: { width: number; height: number },
  prev: ScreenPlacement | null,
): Promise<ScreenPlacement> {
  return getImageDimensions(dataUrl).then((dims) => ({
    x: prev?.x ?? defaults.x,
    y: prev?.y ?? defaults.y,
    ...fitOverlaySize(dims.width, dims.height, max.width, max.height),
  }));
}

function App() {
  const [clinicName, setClinicName] = useState('Airo Medical Clinic');
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);

  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [signaturePlacement, setSignaturePlacement] =
    useState<ScreenPlacement | null>(null);
  const [stampPlacement, setStampPlacement] =
    useState<ScreenPlacement | null>(null);

  const [status, setStatus] = useState<string | null>(null);

  const generate = async () => {
    const bytes = await generateTemplatePdf(clinicName.trim() || 'Unnamed Clinic');
    setPdfBytes(bytes);
    setSignatureImage(null);
    setStampImage(null);
    setSignaturePlacement(null);
    setStampPlacement(null);
    setMetrics(null);
    setStatus(null);
  };

  const onSignatureApply = async (dataUrl: string) => {
    setSignatureImage(dataUrl);
    setSignaturePlacement(
      await placementWithSize(dataUrl, DEFAULT_SIGNATURE, SIGNATURE_MAX, signaturePlacement),
    );
  };

  const onStampUpload = async (dataUrl: string) => {
    setStampImage(dataUrl);
    setStampPlacement(
      await placementWithSize(dataUrl, DEFAULT_STAMP, STAMP_MAX, stampPlacement),
    );
  };

  const handleSave = async () => {
    if (!pdfBytes || !metrics) {
      setStatus('Generate a PDF and wait for it to load.');
      return;
    }
    if (!signatureImage || !signaturePlacement) {
      setStatus('Add a signature and place it on the document.');
      return;
    }
    if (stampImage && !stampPlacement) {
      setStatus('Place the stamp or remove it before saving.');
      return;
    }

    const merged = await mergeSignedPdf(
      pdfBytes,
      {
        image: signatureImage,
        placement: screenToPdf(signaturePlacement, metrics),
      },
      stampImage && stampPlacement
        ? {
            image: stampImage,
            placement: screenToPdf(stampPlacement, metrics),
          }
        : null,
    );

    const filename = signedPdfFilename(clinicName.trim() || 'Unnamed Clinic');
    downloadBlob(
      new Blob([new Uint8Array(merged)], { type: 'application/pdf' }),
      filename,
    );
    setStatus(`Saved ${filename}`);
  };

  const onMetricsReady = useCallback((m: PageMetrics) => {
    setMetrics(m);
  }, []);

  return (
    <div className="app">
      <main className="layout">
        <aside className="sidebar">
          <section className="panel">
            <h2>Template</h2>
            <label className="field">
              Clinic Name
              <input
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Clinic Name"
              />
            </label>
            <button type="button" className="primary block" onClick={generate}>
              Generate PDF
            </button>
          </section>

          <SignaturePanel onApply={onSignatureApply} />
          <StampUpload
            image={stampImage}
            onUpload={onStampUpload}
            onClear={() => {
              setStampImage(null);
              setStampPlacement(null);
            }}
          />

          <section className="panel">
            <h2>Save</h2>
            <button
              type="button"
              className="primary block"
              disabled={!pdfBytes}
              onClick={handleSave}
            >
              Save
            </button>
          </section>

          {status && <p className="status">{status}</p>}
        </aside>

        <div className="workspace">
          {pdfBytes ? (
            <PdfViewer
              pdfData={pdfBytes}
              signatureImage={signatureImage}
              stampImage={stampImage}
              signaturePlacement={signaturePlacement}
              stampPlacement={stampPlacement}
              onSignaturePlacementChange={setSignaturePlacement}
              onStampPlacementChange={setStampPlacement}
              onMetricsReady={onMetricsReady}
            />
          ) : (
            <section className="panel empty">
              <p className="hint">Generate a PDF to start.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

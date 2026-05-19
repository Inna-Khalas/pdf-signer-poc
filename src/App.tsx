import { useCallback, useState } from 'react';
import { PdfViewer, DEFAULT_SIGNATURE, DEFAULT_STAMP } from './components/PdfViewer';
import { SignaturePanel } from './components/SignaturePanel';
import { StampUpload } from './components/StampUpload';
import { downloadBlob, signedPdfFilename } from './lib/exportData';
import { loadCertificateTemplate } from './lib/loadCertificateTemplate';
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

const TEMPLATE_LABEL = 'certificate-of-partnership';

function App() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);

  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [stampImage, setStampImage] = useState<string | null>(null);
  const [signaturePlacement, setSignaturePlacement] =
    useState<ScreenPlacement | null>(null);
  const [stampPlacement, setStampPlacement] =
    useState<ScreenPlacement | null>(null);

  const [status, setStatus] = useState<string | null>(null);

  const clearSignature = () => {
    setSignatureImage(null);
    setSignaturePlacement(null);
  };

  const clearStamp = () => {
    setStampImage(null);
    setStampPlacement(null);
  };

  const openCertificate = async () => {
    try {
      const bytes = await loadCertificateTemplate();
      setPdfBytes(bytes);
      clearSignature();
      clearStamp();
      setMetrics(null);
      setStatus(null);
    } catch {
      setStatus('Could not load the certificate template.');
    }
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
      setStatus('Open the certificate and wait for it to load.');
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

    const filename = signedPdfFilename(TEMPLATE_LABEL);
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
            <p className="hint template-hint">
              Certificate of Partnership (Miracle Regenerative Center)
            </p>
            <button type="button" className="primary block" onClick={openCertificate}>
              Open certificate
            </button>
          </section>

          <SignaturePanel onApply={onSignatureApply} onClearDocument={clearSignature} />
          <StampUpload
            image={stampImage}
            onUpload={onStampUpload}
            onClear={clearStamp}
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
              <p className="hint">Open the certificate to start.</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

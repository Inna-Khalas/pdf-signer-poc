const TEMPLATE_URL = '/certificate-of-partnership.pdf';

export async function loadCertificateTemplate(): Promise<Uint8Array> {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error(`Certificate template not found (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

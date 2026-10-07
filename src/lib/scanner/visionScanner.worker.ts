import {
  buildIntegral,
  matchVision,
  CAMERA_SEARCH,
  UPLOAD_SEARCH,
  type MatchResult,
  type Template,
} from './visionFingerprint';

export type ScanMode = 'camera' | 'upload';

export type WorkerRequest =
  | { type: 'templates'; templates: Template[] }
  | { type: 'scan'; id: number; mode: ScanMode; rotations: number[]; width: number; height: number; data: Uint8ClampedArray<ArrayBuffer> };

export type WorkerResponse =
  | { type: 'ready'; count: number }
  | { type: 'result'; id: number; qr: string | null; match: MatchResult | null; ms: number };

interface BarcodeDetectorLike {
  detect(source: ImageData): Promise<Array<{ rawValue: string }>>;
}

const post = (msg: WorkerResponse) => (self as unknown as { postMessage: (m: WorkerResponse) => void }).postMessage(msg);

let templates: Template[] = [];
let detector: BarcodeDetectorLike | null | undefined;

function getDetector(): BarcodeDetectorLike | null {
  if (detector !== undefined) return detector;
  const Ctor = (self as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
  try {
    detector = Ctor ? new Ctor({ formats: ['qr_code'] }) : null;
  } catch {
    detector = null;
  }
  return detector;
}

async function readQr(image: ImageData): Promise<string | null> {
  const d = getDetector();
  if (!d) return null;
  try {
    const codes = await d.detect(image);
    return codes[0]?.rawValue || null;
  } catch {
    return null;
  }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  if (msg.type === 'templates') {
    templates = msg.templates;
    post({ type: 'ready', count: templates.length });
    return;
  }
  const started = performance.now();
  const image = new ImageData(msg.data, msg.width, msg.height);
  const qr = await readQr(image);
  let match: MatchResult | null = null;
  if (!qr) {
    const ii = buildIntegral(msg.data, msg.width, msg.height);
    match = matchVision(
      ii,
      templates,
      { x: 0, y: 0, w: msg.width, h: msg.height },
      { ...(msg.mode === 'camera' ? CAMERA_SEARCH : UPLOAD_SEARCH), rotations: msg.rotations },
    );
  }
  post({
    type: 'result',
    id: msg.id,
    qr,
    match,
    ms: Math.round(performance.now() - started),
  });
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, CheckCircle, XCircle, Loader2, ExternalLink, ScanLine, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ViewfinderOverlay } from '@/components/scanner/ViewfinderOverlay';
import { loadVisionLibrary, type VisionCandidate } from '@/lib/scanner/visionLibrary';
import { cameraRotationsForFrame, type MatchResult } from '@/lib/scanner/visionFingerprint';
import type { ScanMode, WorkerRequest, WorkerResponse } from '@/lib/scanner/visionScanner.worker';

export type ScanTarget =
  | { kind: 'vision'; candidate: VisionCandidate; confidence: number }
  | { kind: 'link'; path: string };

interface LiveVisionScannerProps {
  onOpen: (target: ScanTarget) => void;
  onMatched?: (target: ScanTarget) => void;
}

const CAMERA_CANVAS = 400;
const UPLOAD_MAX_SIDE = 384;
const STRONG_SCORE = 0.85;
const AUTO_OPEN_MS = 2200;

/** Accept QR codes that point at our own vision URLs. */
function parseVisionLink(raw: string): string | null {
  try {
    const url = new URL(raw, window.location.origin);
    const own = url.origin === window.location.origin || /(^|\.)enpensent\.com$/i.test(url.hostname);
    if (!own || !/^\/(v|g)\//.test(url.pathname)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

type Status = 'loading' | 'ready' | 'error';

export function LiveVisionScanner({ onOpen, onMatched }: LiveVisionScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const candidatesRef = useRef<Map<string, VisionCandidate>>(new Map());
  const pendingRef = useRef(new Map<number, (r: Extract<WorkerResponse, { type: 'result' }>) => void>());
  const nextIdRef = useRef(1);
  const frameRef = useRef(0);
  const lastKeyRef = useRef<string | null>(null);
  const loopRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<Status>('loading');
  const [libraryCount, setLibraryCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [found, setFound] = useState<ScanTarget | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Load the library and boot the worker
  useEffect(() => {
    let cancelled = false;
    const worker = new Worker(new URL('../../lib/scanner/visionScanner.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'ready') {
        if (!cancelled) {
          setLibraryCount(msg.count);
          setStatus('ready');
        }
        return;
      }
      const resolve = pendingRef.current.get(msg.id);
      pendingRef.current.delete(msg.id);
      resolve?.(msg);
    };
    loadVisionLibrary()
      .then((lib) => {
        if (cancelled) return;
        candidatesRef.current = lib.candidates;
        worker.postMessage({ type: 'templates', templates: lib.templates } satisfies WorkerRequest);
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const scanPixels = useCallback((image: ImageData, mode: ScanMode, rotations: number[]) => {
    const worker = workerRef.current;
    if (!worker) return Promise.resolve(null);
    const id = nextIdRef.current++;
    return new Promise<Extract<WorkerResponse, { type: 'result' }> | null>((resolve) => {
      pendingRef.current.set(id, resolve);
      const data = image.data;
      worker.postMessage(
        { type: 'scan', id, mode, rotations, width: image.width, height: image.height, data } satisfies WorkerRequest,
        [data.buffer],
      );
    });
  }, []);

  const toTarget = useCallback((match: MatchResult | null): ScanTarget | null => {
    if (!match) return null;
    const candidate = candidatesRef.current.get(match.key);
    return candidate ? { kind: 'vision', candidate, confidence: match.confidence } : null;
  }, []);

  const stopCamera = useCallback(() => {
    if (loopRef.current) window.clearTimeout(loopRef.current);
    loopRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const announce = useCallback((target: ScanTarget) => {
    stopCamera();
    navigator.vibrate?.(60);
    setFound(target);
    setNoMatch(false);
    onMatched?.(target);
  }, [onMatched, stopCamera]);

  const grabCameraFrame = useCallback((): ImageData | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth) return null;
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
    const canvas = canvasRef.current;
    canvas.width = CAMERA_CANVAS;
    canvas.height = CAMERA_CANVAS;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const side = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - side) / 2;
    const sy = (video.videoHeight - side) / 2;
    ctx.drawImage(video, sx, sy, side, side, 0, 0, CAMERA_CANVAS, CAMERA_CANVAS);
    return ctx.getImageData(0, 0, CAMERA_CANVAS, CAMERA_CANVAS);
  }, []);

  const runCameraLoop = useCallback(() => {
    const tick = async () => {
      if (!streamRef.current) return;
      const frame = grabCameraFrame();
      if (frame) {
        const res = await scanPixels(frame, 'camera', cameraRotationsForFrame(frameRef.current++));
        if (!streamRef.current) return;
        const link = res?.qr ? parseVisionLink(res.qr) : null;
        if (link) {
          announce({ kind: 'link', path: link });
          return;
        }
        const m = res?.match;
        if (m?.accepted) {
          if (m.score >= STRONG_SCORE || lastKeyRef.current === m.key) {
            const target = toTarget(m);
            if (target) {
              announce(target);
              return;
            }
          }
          lastKeyRef.current = m.key;
        } else {
          lastKeyRef.current = null;
        }
      }
      loopRef.current = window.setTimeout(tick, 120);
    };
    loopRef.current = window.setTimeout(tick, 300);
  }, [announce, grabCameraFrame, scanPixels, toTarget]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setFound(null);
    setNoMatch(false);
    setPreviewUrl(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not available in this browser. Upload a photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      lastKeyRef.current = null;
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        runCameraLoop();
      });
    } catch {
      setCameraError('Camera access was blocked. Allow camera access or upload a photo.');
    }
  }, [runCameraLoop]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    stopCamera();
    setFound(null);
    setNoMatch(false);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setBusy(true);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const scale = Math.min(1, UPLOAD_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('no canvas');
      ctx.drawImage(img, 0, 0, w, h);

      let res = await scanPixels(ctx.getImageData(0, 0, w, h), 'upload', [0]);
      const link = res?.qr ? parseVisionLink(res.qr) : null;
      if (link) {
        announce({ kind: 'link', path: link });
        return;
      }
      if (!res?.match?.accepted) {
        const rotated = await scanPixels(ctx.getImageData(0, 0, w, h), 'upload', [1, 2, 3]);
        if (rotated?.match && (!res?.match || rotated.match.score > res.match.score)) res = rotated;
      }
      const target = res?.match?.accepted ? toTarget(res.match) : null;
      if (target) announce(target);
      else setNoMatch(true);
    } catch {
      setNoMatch(true);
    } finally {
      setBusy(false);
    }
  }, [announce, scanPixels, stopCamera, toTarget]);

  // Auto-open countdown once something is found
  useEffect(() => {
    if (!found) return;
    const started = Date.now();
    setCountdown(Math.ceil(AUTO_OPEN_MS / 1000));
    const iv = window.setInterval(() => {
      const left = AUTO_OPEN_MS - (Date.now() - started);
      if (left <= 0) {
        window.clearInterval(iv);
        onOpen(found);
      } else {
        setCountdown(Math.ceil(left / 1000));
      }
    }, 200);
    return () => window.clearInterval(iv);
  }, [found, onOpen]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const reset = () => {
    setFound(null);
    setNoMatch(false);
    setPreviewUrl(null);
  };

  const ready = status === 'ready';

  return (
    <div>
      <div className="aspect-square relative rounded-xl overflow-hidden bg-muted/20 border border-dashed border-border">
        {cameraActive ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <ViewfinderOverlay scanning={ready} />
          </>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Scan preview" className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
            <ScanLine className="h-14 w-14 text-primary/70" />
            <p className="font-display font-semibold">Point your camera at any En Pensent vision</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Prints, screens, game cards: it finds the game and opens it instantly. Free, no account needed.
            </p>
          </div>
        )}

        {cameraActive && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur px-3 py-1.5 text-xs">
            {ready ? (
              <>
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Fit the vision inside the frame
              </>
            ) : (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading vision library…
              </>
            )}
          </div>
        )}

        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-primary">Reading the color fingerprint…</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {found && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="text-center space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14 }}>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                </motion.div>
                {found.kind === 'vision' ? (
                  <div>
                    <h3 className="font-display font-bold text-xl">{found.candidate.title}</h3>
                    <p className="text-sm text-muted-foreground">{found.candidate.subtitle}</p>
                    <div className="flex justify-center gap-2 mt-2">
                      <Badge variant="secondary">{found.candidate.paletteName}</Badge>
                      <Badge variant="outline">{found.confidence}% match</Badge>
                    </div>
                  </div>
                ) : (
                  <h3 className="font-display font-bold text-xl">Vision link found</h3>
                )}
                <p className="text-xs text-muted-foreground">Opening in {countdown}…</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => onOpen(found)} className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open vision
                  </Button>
                  <Button variant="outline" onClick={() => { reset(); startCamera(); }}>
                    Keep scanning
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {noMatch && !busy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="text-center space-y-3">
                <XCircle className="h-14 w-14 text-destructive mx-auto" />
                <h3 className="font-semibold">No vision recognized</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Crop closer to the board, keep it flat and evenly lit, and avoid glare.
                </p>
                <Button variant="outline" onClick={reset}>Try again</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {cameraError && <p className="mt-3 text-sm text-destructive flex items-center gap-2"><CameraOff className="h-4 w-4" />{cameraError}</p>}

      <div className="grid grid-cols-2 gap-4 mt-6">
        {cameraActive ? (
          <Button onClick={stopCamera} variant="outline" className="col-span-2">Stop camera</Button>
        ) : (
          <>
            <Button onClick={startCamera} className="gap-2" disabled={busy}>
              <Camera className="h-4 w-4" />
              Scan with camera
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2" disabled={busy || !ready}>
              {ready ? <Upload className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
              Upload photo
            </Button>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      <p className="mt-3 text-xs text-muted-foreground text-center">
        {status === 'error'
          ? 'Could not load the vision library. Check your connection and reload.'
          : ready
            ? `${libraryCount.toLocaleString()} visions recognizable · runs on your device`
            : 'Preparing vision library…'}
      </p>
    </div>
  );
}

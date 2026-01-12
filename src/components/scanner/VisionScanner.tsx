import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Scan, CheckCircle, XCircle, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ScanResult {
  matched: boolean;
  vision?: {
    visualization_id: string;
    public_share_id: string;
    title: string;
    confidence: number;
    image_url: string;
  };
  share_url?: string;
  reason?: string;
  message?: string;
  error?: string;
}

interface VisionScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VisionScanner({ isOpen, onClose }: VisionScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    setResult(null);
    setPreviewImage(null);
    onClose();
  }, [stopCamera, onClose]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Could not access camera. Please try uploading an image instead.");
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      setPreviewImage(imageData);
      stopCamera();
      scanImage(imageData);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreviewImage(imageData);
      scanImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const scanImage = async (imageBase64: string) => {
    setScanning(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-scanner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image_base64: imageBase64 }),
        }
      );

      if (response.status === 429) {
        toast.error("Too many scans. Please wait a moment and try again.");
        setScanning(false);
        return;
      }

      const data: ScanResult = await response.json();
      setResult(data);

      if (data.matched && data.vision) {
        toast.success(`Found: ${data.vision.title}`, {
          description: `${data.vision.confidence}% confidence match`
        });
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to scan image. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleViewVision = () => {
    if (result?.share_url) {
      handleClose();
      navigate(result.share_url);
    }
  };

  const resetScan = () => {
    setResult(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Natural QR Vision™ Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Scan any En Pensent visualization — the unique color pattern acts as a natural fingerprint that links to its digital page.
            </p>
          </div>

          {/* Camera/Upload Area */}
          <AnimatePresence mode="wait">
            {!previewImage && !cameraActive && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-3"
              >
                <Button
                  variant="outline"
                  className="h-32 flex-col gap-2"
                  onClick={startCamera}
                >
                  <Camera className="h-8 w-8" />
                  <span>Use Camera</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8" />
                  <span>Upload Image</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </motion.div>
            )}

            {cameraActive && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <div className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none">
                  <div className="absolute inset-4 border border-dashed border-primary/30 rounded" />
                </div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  <Button variant="secondary" size="sm" onClick={stopCamera}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={captureFromCamera}>
                    <Scan className="h-4 w-4 mr-1" />
                    Capture & Scan
                  </Button>
                </div>
              </motion.div>
            )}

            {previewImage && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Scan preview"
                    className="w-full rounded-lg"
                  />
                  {scanning && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm font-medium">Analyzing pattern...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Result Display */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      result.matched
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-orange-500/10 border-orange-500/30"
                    }`}
                  >
                    {result.matched && result.vision ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold">{result.vision.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {result.vision.confidence}% confidence match
                            </p>
                            {result.reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {result.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button className="w-full" onClick={handleViewVision}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Vision Page
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <h4 className="font-semibold">No Match Found</h4>
                          <p className="text-sm text-muted-foreground">
                            {result.message || "This visualization may not be in our database yet."}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={resetScan}>
                    Scan Another
                  </Button>
                  {!result?.matched && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        handleClose();
                        navigate("/");
                      }}
                    >
                      Create New Vision
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { extractInvisibleWatermark } from "@/lib/chess/invisibleWatermark";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  User, 
  Calendar,
  Image as ImageIcon,
  Link2,
  ArrowLeft,
  RefreshCw,
  BarChart3
} from "lucide-react";

interface WatermarkResult {
  found: boolean;
  data?: {
    visualizationId: string;
    userId: string;
    timestamp: number;
    shareId?: string;
  };
  visualization?: {
    id: string;
    title: string;
    created_at: string;
    public_share_id: string;
  };
  owner?: {
    id: string;
    display_name: string;
    email?: string;
  };
}

const AdminWatermarkVerification = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<WatermarkResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!data);
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Load image onto canvas
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not available");

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(img, 0, 0);

      // Extract watermark
      const watermarkData = extractInvisibleWatermark(canvas);

      if (!watermarkData) {
        setResult({ found: false });
        return;
      }

      // Fetch additional details from database
      let visualization = null;
      let owner = null;

      // Try to get visualization details
      const { data: vizData } = await supabase
        .from('saved_visualizations')
        .select('id, title, created_at, public_share_id')
        .eq('id', watermarkData.visualizationId)
        .single();

      if (vizData) {
        visualization = vizData;
      }

      // Try to get owner details
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .eq('user_id', watermarkData.userId)
        .single();

      if (profileData) {
        owner = {
          id: profileData.user_id,
          display_name: profileData.display_name || 'Unknown',
        };
      }

      setResult({
        found: true,
        data: watermarkData,
        visualization: visualization || undefined,
        owner: owner || undefined,
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      setResult({ found: false });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      analyzeImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      analyzeImage(file);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin/dmca")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to DMCA Reports
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Watermark Verification</h1>
            <p className="text-muted-foreground">
              Extract and verify ownership data from En Pensent visualization images
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/batch-watermark-verification')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Batch Analysis
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>
                Upload a suspicious image to check for embedded ownership data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {isAnalyzing ? (
                  <div className="space-y-3">
                    <RefreshCw className="w-12 h-12 mx-auto text-primary animate-spin" />
                    <p className="text-muted-foreground">Analyzing image...</p>
                  </div>
                ) : uploadedImage ? (
                  <div className="space-y-3">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded" 
                      className="max-h-48 mx-auto rounded-lg shadow-lg"
                    />
                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      resetAnalysis();
                    }}>
                      Upload Different Image
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-lg font-medium mb-1">
                      Drag & drop an image here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </>
                )}
              </div>

              {/* Hidden canvas for image processing */}
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Result</CardTitle>
              <CardDescription>
                Extracted ownership information from the uploaded image
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result && !isAnalyzing && (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Upload an image to analyze</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <Skeleton className="h-6 w-48 mx-auto mb-4" />
                  <Skeleton className="h-4 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-40 mx-auto" />
                </div>
              )}

              {result && !isAnalyzing && (
                <div className="space-y-4">
                  {result.found ? (
                    <>
                      <Alert className="border-green-500/20 bg-green-500/5">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle className="text-green-600">Watermark Found</AlertTitle>
                        <AlertDescription>
                          This image contains valid En Pensent ownership data.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Owner</p>
                            <p className="font-medium">
                              {result.owner?.display_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {result.data?.userId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Visualization</p>
                            <p className="font-medium">
                              {result.visualization?.title || 'Unknown Vision'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {result.data?.visualizationId}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Export Date</p>
                            <p className="font-medium">
                              {result.data?.timestamp 
                                ? new Date(result.data.timestamp).toLocaleString()
                                : 'Unknown'
                              }
                            </p>
                          </div>
                        </div>

                        {result.data?.shareId && (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Link2 className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Share ID</p>
                              <p className="font-medium font-mono">{result.data.shareId}</p>
                            </div>
                          </div>
                        )}

                        {result.visualization?.public_share_id && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(`/vision/${result.visualization?.public_share_id}`)}
                          >
                            View Original Vision
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>No Watermark Found</AlertTitle>
                      <AlertDescription>
                        This image does not contain valid En Pensent ownership data. 
                        It may be an unauthorized copy, a modified image, or not created 
                        through our platform.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How Watermark Verification Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted/30 rounded-lg">
                <Badge className="mb-2">Step 1</Badge>
                <p>
                  All visualization exports from En Pensent automatically embed invisible 
                  ownership data using LSB steganography.
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <Badge className="mb-2">Step 2</Badge>
                <p>
                  This tool extracts the hidden data from suspicious images without 
                  affecting the visible content.
                </p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <Badge className="mb-2">Step 3</Badge>
                <p>
                  The extracted data is cross-referenced with our database to verify 
                  ownership and track distribution.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminWatermarkVerification;

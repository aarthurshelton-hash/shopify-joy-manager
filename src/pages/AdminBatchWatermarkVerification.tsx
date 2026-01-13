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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileDown,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface ImageAnalysisResult {
  id: string;
  filename: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  watermarkFound: boolean;
  data?: {
    visualizationId: string;
    userId: string;
    timestamp: number;
    shareId?: string;
  };
  ownerName?: string;
  visualizationTitle?: string;
  error?: string;
}

interface BatchReport {
  totalImages: number;
  watermarkedCount: number;
  unwatermarkedCount: number;
  errorCount: number;
  results: ImageAnalysisResult[];
  generatedAt: Date;
}

const AdminBatchWatermarkVerification = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ImageAnalysisResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<BatchReport | null>(null);
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

  const analyzeImage = async (file: File, id: string): Promise<ImageAnalysisResult> => {
    try {
      const imageUrl = URL.createObjectURL(file);
      
      // Load image onto canvas
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(img, 0, 0);

      // Extract watermark
      const watermarkData = extractInvisibleWatermark(canvas);

      if (!watermarkData) {
        return {
          id,
          filename: file.name,
          imageUrl,
          status: 'complete',
          watermarkFound: false,
        };
      }

      // Fetch additional details from database
      let ownerName = 'Unknown';
      let visualizationTitle = 'Unknown';

      const { data: vizData } = await supabase
        .from('saved_visualizations')
        .select('title')
        .eq('id', watermarkData.visualizationId)
        .single();

      if (vizData) {
        visualizationTitle = vizData.title || 'Untitled';
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', watermarkData.userId)
        .single();

      if (profileData) {
        ownerName = profileData.display_name || 'Unknown';
      }

      return {
        id,
        filename: file.name,
        imageUrl,
        status: 'complete',
        watermarkFound: true,
        data: watermarkData,
        ownerName,
        visualizationTitle,
      };
    } catch (error) {
      return {
        id,
        filename: file.name,
        imageUrl: '',
        status: 'error',
        watermarkFound: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const processImages = async (files: File[]) => {
    setIsProcessing(true);
    setProgress(0);
    setReport(null);

    const initialResults: ImageAnalysisResult[] = files.map((file, index) => ({
      id: `img-${index}-${Date.now()}`,
      filename: file.name,
      imageUrl: '',
      status: 'pending' as const,
      watermarkFound: false,
    }));

    setResults(initialResults);

    const processedResults: ImageAnalysisResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = initialResults[i].id;

      // Update status to processing
      setResults(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'processing' as const } : r
      ));

      const result = await analyzeImage(file, id);
      processedResults.push(result);

      // Update with result
      setResults(prev => prev.map(r => 
        r.id === id ? result : r
      ));

      setProgress(((i + 1) / files.length) * 100);
    }

    // Generate report
    const watermarkedCount = processedResults.filter(r => r.watermarkFound).length;
    const errorCount = processedResults.filter(r => r.status === 'error').length;

    setReport({
      totalImages: files.length,
      watermarkedCount,
      unwatermarkedCount: files.length - watermarkedCount - errorCount,
      errorCount,
      results: processedResults,
      generatedAt: new Date(),
    });

    setIsProcessing(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        processImages(imageFiles);
      }
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
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      processImages(files);
    }
  };

  const clearResults = () => {
    setResults([]);
    setReport(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadReportJSON = () => {
    if (!report) return;

    const reportData = {
      title: "En Pensent Watermark Verification Report",
      generatedAt: report.generatedAt.toISOString(),
      summary: {
        totalImages: report.totalImages,
        watermarked: report.watermarkedCount,
        unwatermarked: report.unwatermarkedCount,
        errors: report.errorCount,
        watermarkRate: `${((report.watermarkedCount / report.totalImages) * 100).toFixed(1)}%`,
      },
      results: report.results.map(r => ({
        filename: r.filename,
        watermarkFound: r.watermarkFound,
        owner: r.ownerName || null,
        visualization: r.visualizationTitle || null,
        visualizationId: r.data?.visualizationId || null,
        userId: r.data?.userId || null,
        exportTimestamp: r.data?.timestamp ? new Date(r.data.timestamp).toISOString() : null,
        shareId: r.data?.shareId || null,
        error: r.error || null,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermark-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadReportCSV = () => {
    if (!report) return;

    // CSV header
    const headers = [
      'Filename',
      'Watermark Found',
      'Owner',
      'Visualization Title',
      'Visualization ID',
      'User ID',
      'Export Timestamp',
      'Share ID',
      'Error'
    ];

    // CSV rows
    const rows = report.results.map(r => [
      r.filename,
      r.watermarkFound ? 'Yes' : 'No',
      r.ownerName || '',
      r.visualizationTitle || '',
      r.data?.visualizationId || '',
      r.data?.userId || '',
      r.data?.timestamp ? new Date(r.data.timestamp).toISOString() : '',
      r.data?.shareId || '',
      r.error || ''
    ]);

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content with summary at top
    const summaryLines = [
      `# En Pensent Watermark Verification Report`,
      `# Generated: ${report.generatedAt.toISOString()}`,
      `# Total Images: ${report.totalImages}`,
      `# Watermarked: ${report.watermarkedCount}`,
      `# Unwatermarked: ${report.unwatermarkedCount}`,
      `# Errors: ${report.errorCount}`,
      `# Watermark Rate: ${((report.watermarkedCount / report.totalImages) * 100).toFixed(1)}%`,
      '' // Empty line before data
    ];

    const csvContent = [
      ...summaryLines,
      headers.join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watermark-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-6xl">
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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin/watermark-verification")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Single Verification
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Batch Watermark Verification</h1>
            <p className="text-muted-foreground">
              Analyze multiple images at once and generate a comprehensive report
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Images</CardTitle>
                <CardDescription>
                  Upload multiple images to analyze for watermarks (max 50 images)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium mb-1">
                    Drag & drop images here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (select multiple files)
                  </p>
                </div>

                {isProcessing && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing images...
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results List */}
            {results.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>
                      {results.length} image{results.length !== 1 ? 's' : ''} analyzed
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearResults} disabled={isProcessing}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {results.map(result => (
                      <div 
                        key={result.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          result.status === 'processing' ? 'border-primary/50 bg-primary/5' :
                          result.status === 'error' ? 'border-destructive/50 bg-destructive/5' :
                          result.watermarkFound ? 'border-green-500/50 bg-green-500/5' :
                          'border-amber-500/50 bg-amber-500/5'
                        }`}
                      >
                        {result.imageUrl ? (
                          <img 
                            src={result.imageUrl} 
                            alt={result.filename}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.filename}</p>
                          {result.status === 'processing' && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Processing...
                            </p>
                          )}
                          {result.status === 'complete' && result.watermarkFound && (
                            <p className="text-sm text-green-600">
                              Owner: {result.ownerName} | {result.visualizationTitle}
                            </p>
                          )}
                          {result.status === 'complete' && !result.watermarkFound && (
                            <p className="text-sm text-amber-600">No watermark detected</p>
                          )}
                          {result.status === 'error' && (
                            <p className="text-sm text-destructive">{result.error}</p>
                          )}
                        </div>

                        <div>
                          {result.status === 'complete' && result.watermarkFound && (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          )}
                          {result.status === 'complete' && !result.watermarkFound && (
                            <Badge variant="outline" className="border-amber-500 text-amber-600">
                              <XCircle className="w-3 h-3 mr-1" />
                              None
                            </Badge>
                          )}
                          {result.status === 'error' && (
                            <Badge variant="destructive">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          {result.status === 'processing' && (
                            <Badge variant="outline">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ...
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Report Summary */}
          <div className="space-y-6">
            {report ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Verification Report
                  </CardTitle>
                  <CardDescription>
                    Generated {format(report.generatedAt, 'MMM d, yyyy h:mm a')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{report.totalImages}</p>
                      <p className="text-xs text-muted-foreground">Total Images</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{report.watermarkedCount}</p>
                      <p className="text-xs text-muted-foreground">Watermarked</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-600">{report.unwatermarkedCount}</p>
                      <p className="text-xs text-muted-foreground">No Watermark</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg text-center">
                      <p className="text-2xl font-bold text-destructive">{report.errorCount}</p>
                      <p className="text-xs text-muted-foreground">Errors</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Watermark Rate</span>
                      <span className="font-medium">
                        {((report.watermarkedCount / report.totalImages) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(report.watermarkedCount / report.totalImages) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Button onClick={downloadReportJSON} className="w-full">
                      <FileDown className="w-4 h-4 mr-2" />
                      Download JSON
                    </Button>
                    <Button onClick={downloadReportCSV} variant="outline" className="w-full">
                      <FileDown className="w-4 h-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Upload images to generate a verification report</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <strong>1.</strong> Upload multiple images (up to 50 at once)
                </p>
                <p>
                  <strong>2.</strong> Each image is analyzed for embedded watermarks
                </p>
                <p>
                  <strong>3.</strong> Ownership data is extracted and cross-referenced
                </p>
                <p>
                  <strong>4.</strong> Download a comprehensive JSON report with all findings
                </p>
              </CardContent>
            </Card>

            {report && report.unwatermarkedCount > 0 && (
              <Alert className="border-amber-500/20 bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-600">Suspicious Images Detected</AlertTitle>
                <AlertDescription className="text-sm">
                  {report.unwatermarkedCount} image{report.unwatermarkedCount !== 1 ? 's' : ''} did 
                  not contain valid watermarks. These may be unauthorized copies or images not 
                  exported through the platform.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </main>
      <Footer />
    </div>
  );
};

export default AdminBatchWatermarkVerification;

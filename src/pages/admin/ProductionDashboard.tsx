/**
 * Production Dashboard
 * Admin interface for managing book production queue and jobs
 */

import React, { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Package, 
  Play, 
  Pause, 
  RefreshCw, 
  XCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Plus,
  BookOpen,
  Crown,
  Flame,
  FileText,
  Settings
} from 'lucide-react';
import { 
  ProductionJob, 
  productionQueue, 
  QualityLevel, 
  EditionType,
  ProductionStatus 
} from '@/lib/book/productionQueue';
import { BookType, BOOK_CONFIGS } from '@/lib/book/bookConfig';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';

const statusConfig: Record<ProductionStatus, { color: string; icon: React.ElementType }> = {
  queued: { color: 'bg-blue-500', icon: Clock },
  processing: { color: 'bg-yellow-500', icon: Loader2 },
  generating: { color: 'bg-purple-500', icon: Loader2 },
  printing: { color: 'bg-orange-500', icon: Package },
  shipping: { color: 'bg-cyan-500', icon: Package },
  completed: { color: 'bg-green-500', icon: CheckCircle2 },
  failed: { color: 'bg-red-500', icon: XCircle }
};

const ProductionDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  
  // New job form state
  const [newJob, setNewJob] = useState({
    bookType: 'carlsen' as BookType,
    edition: 'standard' as EditionType,
    quantity: 1,
    quality: 'high' as QualityLevel,
    signatures: false,
    numbering: false,
    coa: false,
    foilStamping: false
  });

  useEffect(() => {
    // Initial load
    setJobs(productionQueue.getAllJobs());
    
    // Subscribe to updates
    const unsubscribe = productionQueue.subscribe(setJobs);
    return () => unsubscribe();
  }, []);

  const stats = productionQueue.getStats();

  const handleCreateJob = async () => {
    setIsCreatingJob(true);
    try {
      const jobId = await productionQueue.addJob({
        bookType: newJob.bookType,
        edition: newJob.edition,
        quantity: newJob.quantity,
        quality: newJob.quality,
        features: {
          signatures: newJob.signatures,
          numbering: newJob.numbering,
          coa: newJob.coa,
          specialPrinting: false,
          foilStamping: newJob.foilStamping,
          ribbonMarker: false,
          slipcase: false
        },
        priority: newJob.edition === 'collector' ? 3 : newJob.edition === 'limited' ? 2 : 1
      });
      toast.success(`Production job created: ${jobId.slice(0, 8)}`);
    } catch (error) {
      toast.error('Failed to create production job');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleCancelJob = (jobId: string) => {
    if (productionQueue.cancelJob(jobId)) {
      toast.success('Job cancelled');
    } else {
      toast.error('Cannot cancel this job');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    if (await productionQueue.retryJob(jobId)) {
      toast.success('Job queued for retry');
    } else {
      toast.error('Cannot retry this job');
    }
  };

  const formatETA = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return 'Any moment';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `~${hours}h ${minutes % 60}m`;
    return `~${minutes}m`;
  };

  return (
    <AdminRoute featureName="Production Dashboard">
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                Production Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage book production jobs and queue
              </p>
            </div>
            <Badge variant="outline" className="text-amber-500 border-amber-500">
              <Crown className="h-3 w-3 mr-1" />
              CEO Access
            </Badge>
          </div>

          {/* Quick Actions */}
          <AdminQuickActions 
            pendingWithdrawals={0}
            pendingDMCA={0}
            systemHealth="healthy"
            activeBooks={2}
          />

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.queued}</p>
                    <p className="text-sm text-muted-foreground">Queued</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.processing}</p>
                    <p className="text-sm text-muted-foreground">Processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create New Job */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Production Job
                </CardTitle>
                <CardDescription>
                  Queue a new book for production
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Book</Label>
                  <Select 
                    value={newJob.bookType}
                    onValueChange={(v) => setNewJob(prev => ({ ...prev, bookType: v as BookType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BOOK_CONFIGS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {key === 'carlsen' ? <Crown className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
                            {config.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Edition Type</Label>
                  <Select 
                    value={newJob.edition}
                    onValueChange={(v) => setNewJob(prev => ({ ...prev, edition: v as EditionType }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="limited">Limited Edition</SelectItem>
                      <SelectItem value="special">Special Edition</SelectItem>
                      <SelectItem value="collector">Collector's Edition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select 
                    value={newJob.quality}
                    onValueChange={(v) => setNewJob(prev => ({ ...prev, quality: v as QualityLevel }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (300 DPI)</SelectItem>
                      <SelectItem value="high">High (600 DPI)</SelectItem>
                      <SelectItem value="ultra">Ultra (1200 DPI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number"
                    min={1}
                    max={1000}
                    value={newJob.quantity}
                    onChange={(e) => setNewJob(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Features</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="numbering" className="text-sm">Edition Numbering</Label>
                    <Switch 
                      id="numbering"
                      checked={newJob.numbering}
                      onCheckedChange={(v) => setNewJob(prev => ({ ...prev, numbering: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="coa" className="text-sm">Certificate of Authenticity</Label>
                    <Switch 
                      id="coa"
                      checked={newJob.coa}
                      onCheckedChange={(v) => setNewJob(prev => ({ ...prev, coa: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="signatures" className="text-sm">Signature Page</Label>
                    <Switch 
                      id="signatures"
                      checked={newJob.signatures}
                      onCheckedChange={(v) => setNewJob(prev => ({ ...prev, signatures: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="foil" className="text-sm">Foil Stamping</Label>
                    <Switch 
                      id="foil"
                      checked={newJob.foilStamping}
                      onCheckedChange={(v) => setNewJob(prev => ({ ...prev, foilStamping: v }))}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleCreateJob}
                  disabled={isCreatingJob}
                >
                  {isCreatingJob ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Jobs Table */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Production Queue
                </CardTitle>
                <CardDescription>
                  {stats.totalJobs} total jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Book</TableHead>
                        <TableHead>Edition</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>ETA</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No production jobs yet. Create one to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        jobs.map((job) => {
                          const StatusIcon = statusConfig[job.status].icon;
                          const BookIcon = job.bookType === 'carlsen' ? Crown : Flame;
                          
                          return (
                            <TableRow key={job.id}>
                              <TableCell className="font-mono text-sm">
                                {job.id.slice(0, 12)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <BookIcon className="h-4 w-4 text-amber-500" />
                                  <span className="capitalize">{job.bookType}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {job.edition}
                                </Badge>
                              </TableCell>
                              <TableCell>{job.quantity}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={`${statusConfig[job.status].color} text-white border-0`}
                                >
                                  <StatusIcon className={`h-3 w-3 mr-1 ${job.status === 'processing' || job.status === 'generating' ? 'animate-spin' : ''}`} />
                                  {job.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <Progress value={job.progress} className="h-2" />
                                  <span className="text-xs text-muted-foreground w-10">
                                    {job.progress}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {job.status === 'completed' 
                                  ? 'Done' 
                                  : job.status === 'failed'
                                  ? '-'
                                  : formatETA(job.estimatedCompletion)
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {job.status === 'failed' && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleRetryJob(job.id)}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {['queued', 'processing', 'generating'].includes(job.status) && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleCancelJob(job.id)}
                                    >
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
};

export default ProductionDashboard;

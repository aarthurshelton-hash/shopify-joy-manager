import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  ShieldOff,
  Loader2,
  FileWarning,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DMCAReport {
  id: string;
  reporter_name: string;
  reporter_email: string;
  reporter_phone: string | null;
  reporter_address: string | null;
  copyrighted_work_description: string;
  infringing_material_url: string;
  infringing_material_description: string;
  good_faith_statement: boolean;
  accuracy_statement: boolean;
  electronic_signature: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_id: string | null;
}

const AdminDMCA: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [reports, setReports] = useState<DMCAReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('pending');

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  // Load DMCA reports
  useEffect(() => {
    if (isAdmin) {
      loadReports();
    }
  }, [isAdmin, activeTab]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('dmca_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);

      // Pre-fill admin notes
      const notesMap: Record<string, string> = {};
      data?.forEach(report => {
        notesMap[report.id] = report.admin_notes || '';
      });
      setAdminNotes(notesMap);
    } catch (error) {
      console.error('Error loading DMCA reports:', error);
      toast.error('Failed to load DMCA reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    if (!user) return;

    setProcessingIds(prev => new Set(prev).add(reportId));

    try {
      const { error } = await supabase
        .from('dmca_reports')
        .update({
          status: newStatus,
          admin_notes: adminNotes[reportId] || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Report marked as ${newStatus}`);
      loadReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500 text-white';
      case 'reviewing':
        return 'bg-blue-500 text-white';
      case 'resolved':
        return 'bg-green-500 text-white';
      case 'dismissed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewing':
        return <FileWarning className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getReportCounts = () => {
    const all = reports.length;
    const pending = reports.filter(r => r.status === 'pending').length;
    const reviewing = reports.filter(r => r.status === 'reviewing').length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const dismissed = reports.filter(r => r.status === 'dismissed').length;
    return { all, pending, reviewing, resolved, dismissed };
  };

  // Loading state
  if (authLoading || isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not authorized
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldOff className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access the DMCA administration panel.
            </p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const counts = getReportCounts();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Scale className="h-8 w-8 text-primary" />
                DMCA Report Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Review and manage DMCA takedown requests
              </p>
            </div>
            <Button variant="outline" onClick={loadReports} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-500">{counts.pending}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-500">{counts.reviewing}</div>
                <p className="text-sm text-muted-foreground">Reviewing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-500">{counts.resolved}</div>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-muted-foreground">{counts.dismissed}</div>
                <p className="text-sm text-muted-foreground">Dismissed</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending
                {counts.pending > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {counts.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="reviewing" className="gap-2">
                <FileWarning className="h-4 w-4" />
                Reviewing
              </TabsTrigger>
              <TabsTrigger value="resolved" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved
              </TabsTrigger>
              <TabsTrigger value="dismissed" className="gap-2">
                <XCircle className="h-4 w-4" />
                Dismissed
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                All Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reports.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Reports</h3>
                    <p className="text-muted-foreground">
                      No DMCA reports in this category
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reports.map(report => {
                  const isProcessing = processingIds.has(report.id);

                  return (
                    <Card key={report.id} className="overflow-hidden">
                      <CardHeader className="border-b bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              DMCA Report #{report.id.slice(0, 8)}
                              <Badge className={getStatusColor(report.status)}>
                                {getStatusIcon(report.status)}
                                <span className="ml-1 capitalize">{report.status}</span>
                              </Badge>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3" />
                              Submitted {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                            </CardDescription>
                          </div>
                          {report.reviewed_at && (
                            <div className="text-right text-sm text-muted-foreground">
                              <p>Reviewed: {format(new Date(report.reviewed_at), 'MMM d, yyyy')}</p>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                        {/* Reporter Information */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Reporter Information
                            </h4>
                            <div className="space-y-2 text-sm">
                              <p className="font-medium">{report.reporter_name}</p>
                              <p className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <a href={`mailto:${report.reporter_email}`} className="hover:underline">
                                  {report.reporter_email}
                                </a>
                              </p>
                              {report.reporter_phone && (
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {report.reporter_phone}
                                </p>
                              )}
                              {report.reporter_address && (
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {report.reporter_address}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-semibold">Legal Statements</h4>
                            <div className="space-y-2 text-sm">
                              <p className="flex items-center gap-2">
                                {report.good_faith_statement ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                Good Faith Statement
                              </p>
                              <p className="flex items-center gap-2">
                                {report.accuracy_statement ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                Accuracy Statement
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-medium">Electronic Signature:</span>{' '}
                                {report.electronic_signature}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Copyrighted Work */}
                        <div className="space-y-2">
                          <h4 className="font-semibold">Copyrighted Work Description</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-lg">
                            {report.copyrighted_work_description}
                          </p>
                        </div>

                        {/* Infringing Material */}
                        <div className="space-y-2">
                          <h4 className="font-semibold">Infringing Material</h4>
                          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                            <p className="text-sm flex items-center gap-2">
                              <ExternalLink className="h-3 w-3" />
                              <a
                                href={report.infringing_material_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all"
                              >
                                {report.infringing_material_url}
                              </a>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {report.infringing_material_description}
                            </p>
                          </div>
                        </div>

                        {/* Admin Notes */}
                        <div className="space-y-2">
                          <h4 className="font-semibold">Admin Notes</h4>
                          <Textarea
                            placeholder="Add notes about this report..."
                            value={adminNotes[report.id] || ''}
                            onChange={e =>
                              setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))
                            }
                            className="text-sm"
                            rows={3}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t">
                          <Select
                            value={report.status}
                            onValueChange={value => handleUpdateStatus(report.id, value)}
                            disabled={isProcessing}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewing">Reviewing</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="dismissed">Dismissed</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            onClick={() => handleUpdateStatus(report.id, 'reviewing')}
                            disabled={isProcessing || report.status === 'reviewing'}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <FileWarning className="h-4 w-4 mr-2" />
                            )}
                            Mark Reviewing
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="default"
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Resolved
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Resolve DMCA Report?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the report as resolved, indicating the infringing
                                  content has been addressed. Make sure to document your actions in
                                  the admin notes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                >
                                  Confirm Resolution
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" disabled={isProcessing}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Dismiss
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Dismiss DMCA Report?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will dismiss the report as invalid or not actionable. Make
                                  sure to document the reason in the admin notes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                                >
                                  Confirm Dismissal
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDMCA;

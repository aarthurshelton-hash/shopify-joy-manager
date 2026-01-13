import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FileWarning, 
  Scale, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  FileText,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface DMCAReport {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  copyrighted_work_description: string;
  infringing_material_url: string;
  infringing_material_description: string;
  reviewed_at: string | null;
}

interface CounterNotification {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  removed_content_description: string;
  original_takedown_description: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-500/10">
          <Clock className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>
      );
    case 'reviewed':
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-500/10">
          <AlertCircle className="w-3 h-3 mr-1" />
          Under Review
        </Badge>
      );
    case 'action_taken':
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Action Taken
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    case 'dismissed':
      return (
        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
          <XCircle className="w-3 h-3 mr-1" />
          Dismissed
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

const getStatusExplanation = (status: string, type: 'report' | 'counter') => {
  if (type === 'report') {
    switch (status) {
      case 'pending':
        return 'Your report is in the queue and will be reviewed by our legal team within 5-7 business days.';
      case 'reviewed':
        return 'Our team is actively investigating your claim and may reach out for additional information.';
      case 'action_taken':
        return 'We have taken action on the reported content based on your DMCA notice.';
      case 'rejected':
        return 'After review, we determined that the report does not meet DMCA requirements.';
      case 'dismissed':
        return 'This report was dismissed. Please contact us if you believe this was in error.';
      default:
        return 'Status unknown. Please contact support.';
    }
  } else {
    switch (status) {
      case 'pending':
        return 'Your counter-notification is being reviewed. This process typically takes 10-14 business days.';
      case 'reviewed':
        return 'We are verifying the information in your counter-notification.';
      case 'approved':
        return 'Your counter-notification was accepted. The content may be restored.';
      case 'rejected':
        return 'Your counter-notification was not accepted. You may pursue legal remedies.';
      default:
        return 'Status unknown. Please contact support.';
    }
  }
};

const DMCAStatusTracking = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [reports, setReports] = useState<DMCAReport[]>([]);
  const [counterNotifications, setCounterNotifications] = useState<CounterNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [reportsResult, countersResult] = await Promise.all([
        supabase
          .from('dmca_reports')
          .select('id, created_at, updated_at, status, copyrighted_work_description, infringing_material_url, infringing_material_description, reviewed_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('dmca_counter_notifications')
          .select('id, created_at, updated_at, status, removed_content_description, original_takedown_description')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (reportsResult.data) {
        setReports(reportsResult.data);
      }
      if (countersResult.data) {
        setCounterNotifications(countersResult.data);
      }
    } catch (error) {
      console.error('Error fetching DMCA data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <Skeleton className="h-48 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sign In Required</AlertTitle>
            <AlertDescription>
              You must be signed in to track your DMCA reports. Reports submitted while not signed in 
              cannot be tracked online—you will receive updates via email.
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex gap-4">
            <Link to="/dmca">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to DMCA
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasNoSubmissions = reports.length === 0 && counterNotifications.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">DMCA Status Tracking</h1>
              <p className="text-muted-foreground">
                Track the progress of your DMCA reports and counter-notifications
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {hasNoSubmissions ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-medium mb-2">No Submissions Found</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You haven't submitted any DMCA reports or counter-notifications while signed in. 
                Reports submitted anonymously are tracked via email only.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/dmca">
                  <Button>
                    <FileWarning className="w-4 h-4 mr-2" />
                    File a Report
                  </Button>
                </Link>
                <Link to="/dmca/counter-notification">
                  <Button variant="outline">
                    <Scale className="w-4 h-4 mr-2" />
                    File Counter-Notice
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports" className="gap-2">
                <FileWarning className="w-4 h-4" />
                Reports ({reports.length})
              </TabsTrigger>
              <TabsTrigger value="counter" className="gap-2">
                <Scale className="w-4 h-4" />
                Counter-Notices ({counterNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-4">
              {reports.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileWarning className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground mb-4">No DMCA reports submitted yet</p>
                    <Link to="/dmca">
                      <Button>File a Report</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                reports.map(report => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Report #{report.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <CardDescription>
                            Submitted {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                          </CardDescription>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="font-medium mb-1">Status Explanation</p>
                        <p className="text-muted-foreground">
                          {getStatusExplanation(report.status, 'report')}
                        </p>
                      </div>

                      <div className="grid gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Copyrighted Work</p>
                          <p className="line-clamp-2">{report.copyrighted_work_description}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Infringing URL</p>
                          <a 
                            href={report.infringing_material_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {report.infringing_material_url.length > 60 
                              ? report.infringing_material_url.slice(0, 60) + '...' 
                              : report.infringing_material_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {report.reviewed_at && (
                          <div>
                            <p className="font-medium text-muted-foreground mb-1">Reviewed</p>
                            <p>{format(new Date(report.reviewed_at), 'MMM d, yyyy h:mm a')}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="counter" className="space-y-4">
              {counterNotifications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Scale className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground mb-4">No counter-notifications submitted yet</p>
                    <Link to="/dmca/counter-notification">
                      <Button>File Counter-Notice</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                counterNotifications.map(counter => (
                  <Card key={counter.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Counter-Notice #{counter.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <CardDescription>
                            Submitted {format(new Date(counter.created_at), 'MMM d, yyyy h:mm a')}
                          </CardDescription>
                        </div>
                        {getStatusBadge(counter.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        <p className="font-medium mb-1">Status Explanation</p>
                        <p className="text-muted-foreground">
                          {getStatusExplanation(counter.status, 'counter')}
                        </p>
                      </div>

                      <div className="grid gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Removed Content Description</p>
                          <p className="line-clamp-2">{counter.removed_content_description}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Original Takedown Claim</p>
                          <p className="line-clamp-2">{counter.original_takedown_description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              If you have questions about your report status or need to provide additional information,
              please contact our legal team at <a href="mailto:legal@enpensent.com" className="text-primary hover:underline">legal@enpensent.com</a>.
            </p>
            <p>
              Include your report ID in all correspondence for faster processing.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default DMCAStatusTracking;

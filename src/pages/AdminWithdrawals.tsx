import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  DollarSign,
  User,
  Mail,
  Calendar,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  getAllWithdrawalRequests,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  getWithdrawalStats,
  WithdrawalRequest,
} from '@/lib/admin/withdrawalAdmin';
import { formatBalance } from '@/lib/marketplace/walletApi';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminWithdrawals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getWithdrawalStats>>['data']>(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  // Action modal state
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'complete' | null;
    request: WithdrawalRequest | null;
  }>({ type: null, request: null });
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check admin role
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (data) {
      setIsAdmin(true);
      await loadData();
    }
    setLoading(false);
  };

  const loadData = async () => {
    const [requestsResult, statsResult] = await Promise.all([
      getAllWithdrawalRequests(activeTab),
      getWithdrawalStats(),
    ]);

    if (requestsResult.data) {
      setRequests(requestsResult.data);
    }
    if (statsResult.data) {
      setStats(statsResult.data);
    }
  };

  const handleAction = async () => {
    if (!actionModal.type || !actionModal.request) return;

    setActionLoading(true);
    try {
      let result;
      switch (actionModal.type) {
        case 'approve':
          result = await approveWithdrawal(actionModal.request.id, actionNotes);
          if (result.success) toast.success('Withdrawal approved');
          break;
        case 'reject':
          if (!actionNotes.trim()) {
            toast.error('Rejection reason is required');
            setActionLoading(false);
            return;
          }
          result = await rejectWithdrawal(actionModal.request.id, actionNotes);
          if (result.success) toast.success('Withdrawal rejected');
          break;
        case 'complete':
          result = await completeWithdrawal(actionModal.request.id, actionNotes);
          if (result.success) toast.success('Withdrawal marked as completed');
          break;
      }

      if (result?.error) {
        toast.error(result.error.message);
      } else {
        setActionModal({ type: null, request: null });
        setActionNotes('');
        await loadData();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Withdrawal Management</h1>
            <p className="text-muted-foreground">Review and process payout requests</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-yellow-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold">{stats.pending_count}</p>
                <p className="text-sm text-muted-foreground">{formatBalance(stats.pending_amount)}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Approved</span>
                </div>
                <p className="text-2xl font-bold">{stats.approved_count}</p>
                <p className="text-sm text-muted-foreground">{formatBalance(stats.approved_amount)}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Total Paid</span>
                </div>
                <p className="text-2xl font-bold">{formatBalance(stats.completed_total)}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">Rejected</span>
                </div>
                <p className="text-2xl font-bold">{stats.rejected_count}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); loadData(); }}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Requests</CardTitle>
                <CardDescription>
                  {activeTab === 'pending' && 'Review and approve or reject pending requests'}
                  {activeTab === 'approved' && 'Process approved withdrawals'}
                  {activeTab === 'completed' && 'View completed payouts'}
                  {activeTab === 'rejected' && 'View rejected requests'}
                  {activeTab === 'all' && 'All withdrawal requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No {activeTab !== 'all' ? activeTab : ''} withdrawal requests</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {requests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{request.user_display_name}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {request.payout_details?.email || 'No email provided'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                {getStatusBadge(request.status)}
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                </span>
                                <span className="text-muted-foreground">
                                  Earned: {formatBalance(request.wallet_total_earned || 0)}
                                </span>
                              </div>

                              {request.admin_notes && (
                                <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                  <strong>Notes:</strong> {request.admin_notes}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <p className="text-2xl font-bold text-green-600">
                                {formatBalance(request.amount_cents)}
                              </p>

                              <div className="flex gap-2">
                                {request.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                                      onClick={() => setActionModal({ type: 'approve', request })}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                      onClick={() => setActionModal({ type: 'reject', request })}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {request.status === 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => setActionModal({ type: 'complete', request })}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Mark Completed
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Modal */}
        <Dialog open={!!actionModal.type} onOpenChange={() => setActionModal({ type: null, request: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionModal.type === 'approve' && 'Approve Withdrawal'}
                {actionModal.type === 'reject' && 'Reject Withdrawal'}
                {actionModal.type === 'complete' && 'Complete Withdrawal'}
              </DialogTitle>
              <DialogDescription>
                {actionModal.type === 'approve' && 'This will approve the withdrawal request for processing.'}
                {actionModal.type === 'reject' && 'Please provide a reason for rejection.'}
                {actionModal.type === 'complete' && 'Confirm you have sent the payment to the user.'}
              </DialogDescription>
            </DialogHeader>

            {actionModal.request && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{actionModal.request.user_display_name}</p>
                      <p className="text-sm text-muted-foreground">{actionModal.request.payout_details?.email}</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      {formatBalance(actionModal.request.amount_cents)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {actionModal.type === 'reject' ? 'Rejection Reason (Required)' : 'Admin Notes (Optional)'}
                  </label>
                  <Textarea
                    placeholder={
                      actionModal.type === 'reject'
                        ? 'Explain why this request is being rejected...'
                        : 'Add any notes about this action...'
                    }
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {actionModal.type === 'complete' && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Only mark as complete after you have sent the payment via PayPal to{' '}
                      <strong>{actionModal.request.payout_details?.email}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionModal({ type: null, request: null })}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={actionLoading || (actionModal.type === 'reject' && !actionNotes.trim())}
                className={
                  actionModal.type === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : actionModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }
              >
                {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {actionModal.type === 'approve' && 'Approve'}
                {actionModal.type === 'reject' && 'Reject'}
                {actionModal.type === 'complete' && 'Mark Complete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

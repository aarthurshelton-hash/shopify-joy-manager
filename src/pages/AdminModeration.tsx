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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Ban,
  Clock,
  User,
  FileText,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  FlaggedContent,
  BannedUser,
  getPendingFlaggedContent,
  getBannedUsers,
  reviewFlaggedContent,
  banUser,
  unbanUser,
  issueWarning,
  getUserOffenseCount,
} from '@/lib/moderation/flagContent';

const AdminModeration: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [userProfiles, setUserProfiles] = useState<Record<string, { display_name: string; avatar_url: string | null }>>({});
  const [offenseCounts, setOffenseCounts] = useState<Record<string, number>>({});

  // Check admin status using secure has_role function
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', { 
          _user_id: user.id, 
          _role: 'admin' 
        });

        if (error) throw error;
        setIsAdmin(data === true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  // Load moderation data
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [flagged, banned] = await Promise.all([
        getPendingFlaggedContent(),
        getBannedUsers(),
      ]);
      setFlaggedContent(flagged);
      setBannedUsers(banned);

      // Load user profiles for flagged content
      const userIds = [...new Set([...flagged.map(f => f.user_id), ...banned.map(b => b.user_id)])];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
        profiles?.forEach(p => {
          profileMap[p.user_id] = { display_name: p.display_name || 'Unknown', avatar_url: p.avatar_url };
        });
        setUserProfiles(profileMap);

        // Load offense counts
        const counts: Record<string, number> = {};
        for (const userId of userIds) {
          counts[userId] = await getUserOffenseCount(userId);
        }
        setOffenseCounts(counts);
      }
    } catch (error) {
      console.error('Error loading moderation data:', error);
      toast.error('Failed to load moderation data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (flagId: string, decision: 'approved' | 'rejected' | 'banned', userId: string) => {
    if (!user) return;

    setProcessingIds(prev => new Set(prev).add(flagId));
    
    const notes = reviewNotes[flagId] || '';
    const result = await reviewFlaggedContent(flagId, decision, user.id, notes);

    if (result.success) {
      if (decision === 'banned') {
        // Ban the user
        const offenseCount = (offenseCounts[userId] || 0) + 1;
        const banDuration = offenseCount >= 3 ? null : new Date(Date.now() + offenseCount * 7 * 24 * 60 * 60 * 1000); // 7 days per offense, permanent after 3
        
        await banUser(userId, `Banned for: ${notes || 'Content violation'}`, user.id, {
          expiresAt: banDuration || undefined,
          offenseCount,
        });
        toast.success(banDuration ? `User banned for ${offenseCount * 7} days` : 'User permanently banned');
      } else if (decision === 'rejected') {
        // Issue a warning
        await issueWarning(userId, flagId, notes || 'Content rejected', user.id);
        toast.success('Content rejected, warning issued');
      } else {
        toast.success('Content approved');
      }

      setFlaggedContent(prev => prev.filter(f => f.id !== flagId));
    } else {
      toast.error('Failed to process review', { description: result.error });
    }

    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(flagId);
      return next;
    });
  };

  const handleUnban = async (userId: string) => {
    const result = await unbanUser(userId);
    if (result.success) {
      setBannedUsers(prev => prev.filter(b => b.user_id !== userId));
      toast.success('User unbanned');
    } else {
      toast.error('Failed to unban user', { description: result.error });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'avatar': return <ImageIcon className="h-4 w-4" />;
      case 'display_name': return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
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
              You don't have permission to access the moderation panel.
            </p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Content Moderation
              </h1>
              <p className="text-muted-foreground mt-2">
                Review flagged content and manage user bans
              </p>
            </div>
            <Button variant="outline" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="queue" className="space-y-6">
            <TabsList>
              <TabsTrigger value="queue" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Review Queue
                {flaggedContent.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {flaggedContent.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="banned" className="gap-2">
                <Ban className="h-4 w-4" />
                Banned Users
                {bannedUsers.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {bannedUsers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Review Queue */}
            <TabsContent value="queue" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : flaggedContent.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">All Clear!</h3>
                    <p className="text-muted-foreground">No content pending review</p>
                  </CardContent>
                </Card>
              ) : (
                flaggedContent.map(item => {
                  const profile = userProfiles[item.user_id];
                  const offenseCount = offenseCounts[item.user_id] || 0;
                  const isProcessing = processingIds.has(item.id);

                  return (
                    <Card key={item.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(profile?.display_name || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                {profile?.display_name || 'Unknown User'}
                                {offenseCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {offenseCount} offense{offenseCount !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                {getContentTypeIcon(item.content_type)}
                                {item.content_type.replace('_', ' ')}
                                <span className="text-xs">•</span>
                                <Clock className="h-3 w-3" />
                                {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getSeverityColor(item.severity)}>
                            {item.severity}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Flagged Content Preview */}
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          {item.content_image_url ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Flagged Image:</p>
                              <img 
                                src={item.content_image_url} 
                                alt="Flagged content" 
                                className="max-w-xs rounded border"
                              />
                            </div>
                          ) : item.content_text ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Flagged Text:</p>
                              <p className="text-sm p-2 bg-background rounded border font-mono">
                                "{item.content_text}"
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No content preview available</p>
                          )}
                        </div>

                        {/* Reason */}
                        <div>
                          <p className="text-sm font-medium mb-1">Flag Reason:</p>
                          <p className="text-sm text-muted-foreground">{item.reason}</p>
                        </div>

                        {/* Review Notes */}
                        <div>
                          <p className="text-sm font-medium mb-1">Review Notes (optional):</p>
                          <Textarea
                            placeholder="Add notes about your decision..."
                            value={reviewNotes[item.id] || ''}
                            onChange={e => setReviewNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="text-sm"
                            rows={2}
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => handleReview(item.id, 'approved', item.user_id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleReview(item.id, 'rejected', item.user_id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                            Reject + Warn
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                disabled={isProcessing}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ban User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will ban {profile?.display_name || 'this user'} from the platform.
                                  {offenseCount >= 2 
                                    ? ' This will be a permanent ban (3+ offenses).'
                                    : ` They will be banned for ${(offenseCount + 1) * 7} days.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleReview(item.id, 'banned', item.user_id)}
                                >
                                  Confirm Ban
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

            {/* Banned Users */}
            <TabsContent value="banned" className="space-y-4">
              {bannedUsers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Banned Users</h3>
                    <p className="text-muted-foreground">All users are in good standing</p>
                  </CardContent>
                </Card>
              ) : (
                bannedUsers.map(ban => {
                  const profile = userProfiles[ban.user_id];
                  const isPermanent = !ban.expires_at;
                  const isExpired = ban.expires_at && new Date(ban.expires_at) < new Date();

                  return (
                    <Card key={ban.id} className={isExpired ? 'opacity-60' : ''}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {(profile?.display_name || 'U').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{profile?.display_name || 'Unknown User'}</p>
                              <p className="text-sm text-muted-foreground">{ban.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right text-sm">
                              <Badge variant={isPermanent ? 'destructive' : 'secondary'}>
                                {isPermanent ? 'Permanent' : isExpired ? 'Expired' : 'Temporary'}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {ban.offense_count} offense{ban.offense_count !== 1 ? 's' : ''}
                              </p>
                              {ban.expires_at && (
                                <p className="text-xs text-muted-foreground">
                                  {isExpired ? 'Expired' : `Expires ${format(new Date(ban.expires_at), 'MMM d, yyyy')}`}
                                </p>
                              )}
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Unban
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Unban User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the ban on {profile?.display_name || 'this user'} and allow them to use the platform again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUnban(ban.user_id)}>
                                    Confirm Unban
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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

export default AdminModeration;

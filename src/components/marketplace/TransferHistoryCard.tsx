import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRight, Gift, DollarSign, Sparkles, History, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Transfer {
  id: string;
  from_user_id: string | null;
  to_user_id: string;
  transfer_type: string;
  created_at: string;
  from_display_name?: string | null;
  to_display_name?: string | null;
}

interface TransferHistoryCardProps {
  visualizationId: string;
  compact?: boolean;
}

export const TransferHistoryCard: React.FC<TransferHistoryCardProps> = ({
  visualizationId,
  compact = false,
}) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransferHistory = async () => {
      setIsLoading(true);
      
      // Fetch transfers for this visualization
      const { data: transferData, error } = await supabase
        .from('visualization_transfers')
        .select('*')
        .eq('visualization_id', visualizationId)
        .order('created_at', { ascending: false });

      if (error || !transferData) {
        setIsLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = new Set<string>();
      transferData.forEach((t) => {
        if (t.from_user_id) userIds.add(t.from_user_id);
        if (t.to_user_id) userIds.add(t.to_user_id);
      });

      // Fetch profiles for all users
      let profilesMap: Record<string, string | null> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', Array.from(userIds));

        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p.display_name;
          return acc;
        }, {} as Record<string, string | null>);
      }

      // Enrich transfers with display names
      const enrichedTransfers = transferData.map((t) => ({
        ...t,
        from_display_name: t.from_user_id ? profilesMap[t.from_user_id] : null,
        to_display_name: profilesMap[t.to_user_id] || null,
      }));

      setTransfers(enrichedTransfers);
      setIsLoading(false);
    };

    fetchTransferHistory();
  }, [visualizationId]);

  const getTransferIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <DollarSign className="h-3.5 w-3.5 text-green-500" />;
      case 'free_claim':
        return <Gift className="h-3.5 w-3.5 text-blue-500" />;
      case 'gift':
        return <Sparkles className="h-3.5 w-3.5 text-purple-500" />;
      default:
        return <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getTransferLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchased';
      case 'free_claim':
        return 'Claimed';
      case 'gift':
        return 'Gifted';
      default:
        return 'Transferred';
    }
  };

  if (isLoading) {
    return (
      <Card className={compact ? 'border-0 shadow-none' : ''}>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (transfers.length === 0) {
    return (
      <Card className={compact ? 'border-0 shadow-none' : ''}>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <History className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No transfer history</p>
          <p className="text-xs text-muted-foreground/70">This vision hasn't been traded yet</p>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <ScrollArea className={compact ? 'max-h-48' : 'max-h-64'}>
      <div className="space-y-2">
        {transfers.map((transfer, index) => (
          <div
            key={transfer.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
          >
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-background shrink-0">
              {getTransferIcon(transfer.transfer_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                {transfer.from_user_id ? (
                  <span className="text-muted-foreground truncate max-w-[80px]">
                    {transfer.from_display_name || 'Unknown'}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Unclaimed</span>
                )}
                <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="font-medium truncate max-w-[80px]">
                  {transfer.to_display_name || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {getTransferLabel(transfer.transfer_type)}
                </Badge>
                <span>{format(new Date(transfer.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            {index === 0 && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                Latest
              </Badge>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  if (compact) {
    return content;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Transfer History
          <Badge variant="secondary" className="text-xs ml-auto">
            {transfers.length} transfer{transfers.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {content}
      </CardContent>
    </Card>
  );
};

export default TransferHistoryCard;

import React from 'react';
import { useUserStatistics } from '@/hooks/useUserStatistics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, Download, ImageIcon, DollarSign, TrendingUp, 
  ShoppingCart, Tag, MessageSquare, Crown, Calendar,
  Wallet, Activity, ScanLine
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}> = ({ title, value, icon, description }) => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const formatCents = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

export const UserStatsDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useUserStatistics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive/20">
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Failed to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Sign in to view your statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <div className="flex items-center gap-4 flex-wrap">
        {stats.is_premium && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Premium Member
          </Badge>
        )}
        {stats.member_since && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Member for {formatDistanceToNow(new Date(stats.member_since))}
          </span>
        )}
        {stats.last_activity && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Active {formatDistanceToNow(new Date(stats.last_activity), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Vision Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Your Visions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Owned"
            value={stats.total_visions_owned}
            icon={<ImageIcon className="h-5 w-5" />}
          />
          <StatCard
            title="Created"
            value={stats.total_visions_created}
            icon={<ImageIcon className="h-5 w-5" />}
          />
          <StatCard
            title="Public"
            value={stats.public_visions}
            icon={<Eye className="h-5 w-5" />}
          />
          <StatCard
            title="Private"
            value={stats.private_visions}
            icon={<ImageIcon className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Earnings Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Earnings & Wallet</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Wallet Balance"
            value={formatCents(stats.wallet_balance_cents)}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Total Earned"
            value={formatCents(stats.total_earned_cents)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Total Royalties"
            value={formatCents(stats.total_royalties_cents)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Total Spent"
            value={formatCents(stats.total_spent_cents)}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Marketplace Activity */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Marketplace Activity</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Active Listings"
            value={stats.active_listings}
            icon={<Tag className="h-5 w-5" />}
          />
          <StatCard
            title="Total Sales"
            value={stats.total_sales}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard
            title="Total Purchases"
            value={stats.total_purchases}
            icon={<ShoppingCart className="h-5 w-5" />}
          />
          <StatCard
            title="Offers Received"
            value={stats.pending_offers_received}
            icon={<MessageSquare className="h-5 w-5" />}
          />
          <StatCard
            title="Offers Sent"
            value={stats.pending_offers_sent}
            icon={<MessageSquare className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Engagement</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Views"
            value={stats.total_views_received.toLocaleString()}
            icon={<Eye className="h-5 w-5" />}
          />
          <StatCard
            title="Total Downloads"
            value={stats.total_downloads_received.toLocaleString()}
            icon={<Download className="h-5 w-5" />}
          />
          <StatCard
            title="Total Scans"
            value={stats.total_scans_received.toLocaleString()}
            icon={<ScanLine className="h-5 w-5" />}
          />
          <StatCard
            title="Portfolio Score"
            value={stats.portfolio_score.toLocaleString()}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>
      </div>
    </div>
  );
};

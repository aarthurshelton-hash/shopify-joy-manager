/**
 * Premium Conversion Funnel
 * Scales revenue by converting free users to premium
 * 
 * For Alec Arthur Shelton - The Artist
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  TrendingUp, 
  Eye, 
  Wallet,
  Zap,
  Lock
} from 'lucide-react';

interface FunnelStage {
  name: string;
  users: number;
  conversionRate: number;
  revenue: number;
}

export function PremiumConversionFunnel() {
  const [stages] = useState<FunnelStage[]>([
    { name: 'Public Visitors', users: 15420, conversionRate: 100, revenue: 0 },
    { name: 'Game Players', users: 8930, conversionRate: 57.9, revenue: 0 },
    { name: 'Print Buyers', users: 2150, conversionRate: 13.9, revenue: 64500 },
    { name: 'Vision Collectors', users: 890, conversionRate: 5.8, revenue: 44500 },
    { name: 'Premium Members', users: 234, conversionRate: 1.5, revenue: 23400 },
    { name: 'Active Traders', users: 67, conversionRate: 0.4, revenue: 20100 }
  ]);

  const totalRevenue = stages.reduce((sum, s) => sum + s.revenue, 0);
  const avgRevenuePerUser = totalRevenue / stages[0].users;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Crown className="w-7 h-7 text-primary" />
            Premium Conversion Funnel
          </h2>
          <p className="text-muted-foreground">
            Revenue scaling through tier progression
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-2">
          <TrendingUp className="w-4 h-4 mr-2" />
            +12% MoM
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stages[0].users.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Visitors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{stages[4].users}</div>
            <div className="text-sm text-muted-foreground">Premium Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">${avgRevenuePerUser.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">ARPU</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.name} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{stage.name}</div>
                <div className="flex-1">
                  <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${stage.conversionRate}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-sm">
                      {stage.users.toLocaleString()} users
                    </span>
                  </div>
                </div>
                <div className="w-24 text-right text-sm text-muted-foreground">
                  {stage.revenue > 0 && `$${stage.revenue.toLocaleString()}`}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Eye className="w-8 h-8 text-primary" />
            <h3 className="font-semibold">Vision Trading</h3>
            <p className="text-sm text-muted-foreground">
              Premium members trade visions. 17% PR on every transaction.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Premium Only
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Wallet className="w-8 h-8 text-success" />
            <h3 className="font-semibold">17% PR Accrual</h3>
            <p className="text-sm text-muted-foreground">
              Visions gain value from game/print order volume.
            </p>
            <Badge variant="secondary">Active</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <Zap className="w-8 h-8 text-warning" />
            <h3 className="font-semibold">Creative Mode</h3>
            <p className="text-sm text-muted-foreground">
              Manual path creation vs automated engine.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Premium Only
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PremiumConversionFunnel;

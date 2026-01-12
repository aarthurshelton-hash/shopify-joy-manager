import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Heart, 
  Users, 
  TrendingUp,
  Sparkles,
  BookOpen,
  Globe,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FundStats {
  total_contributions: number;
  total_forfeited_value_cents: number;
  total_platform_fee_cents: number;
  total_fund_cents: number;
  total_visions_released: number;
  scholarships_funded: number;
}

const EducationFundCard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['education-fund-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_fund')
        .select('forfeited_value_cents, platform_fee_cents, fund_contribution_cents, visions_released');
      
      if (error) throw error;
      
      // Calculate stats client-side since view might have issues
      const totals = (data || []).reduce((acc, row) => ({
        total_contributions: acc.total_contributions + 1,
        total_forfeited_value_cents: acc.total_forfeited_value_cents + (row.forfeited_value_cents || 0),
        total_platform_fee_cents: acc.total_platform_fee_cents + (row.platform_fee_cents || 0),
        total_fund_cents: acc.total_fund_cents + (row.fund_contribution_cents || 0),
        total_visions_released: acc.total_visions_released + (row.visions_released || 0),
        scholarships_funded: 0
      }), {
        total_contributions: 0,
        total_forfeited_value_cents: 0,
        total_platform_fee_cents: 0,
        total_fund_cents: 0,
        total_visions_released: 0,
        scholarships_funded: 0
      });
      
      // Each scholarship = $7 (one month of premium)
      totals.scholarships_funded = Math.floor(totals.total_fund_cents / 700);
      
      return totals as FundStats;
    },
    staleTime: 60000, // Refresh every minute
  });

  const fundDollars = ((stats?.total_fund_cents || 0) / 100).toFixed(2);
  const nextScholarshipProgress = stats ? 
    ((stats.total_fund_cents % 700) / 700) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span>Chess Education Fund</span>
            <Badge variant="outline" className="ml-auto bg-purple-500/10 text-purple-600 border-purple-500/30">
              <Heart className="h-3 w-3 mr-1" />
              Giving Back
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            When subscriptions lapse, <strong>85% of forfeited vision value</strong> is pooled 
            to provide free Visionary memberships to students from underprivileged backgrounds. 
            Chess education for all.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold text-primary">${fundDollars}</div>
              <div className="text-xs text-muted-foreground">Total Fund</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold text-purple-500">{stats?.scholarships_funded || 0}</div>
              <div className="text-xs text-muted-foreground">Scholarships Given</div>
            </div>
          </div>

          {/* Progress to next scholarship */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Next scholarship</span>
              <span className="text-primary font-medium">
                ${((stats?.total_fund_cents || 0) % 700 / 100).toFixed(2)} / $7.00
              </span>
            </div>
            <Progress value={nextScholarshipProgress} className="h-2" />
          </div>

          {/* Transparency breakdown */}
          <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Globe className="h-3 w-3" />
              Transparent Allocation
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold text-purple-500">85%</div>
                <div className="text-[10px] text-muted-foreground">Education Fund</div>
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground">15%</div>
                <div className="text-[10px] text-muted-foreground">Platform</div>
              </div>
              <div>
                <div className="text-sm font-bold text-green-500">{stats?.total_visions_released || 0}</div>
                <div className="text-[10px] text-muted-foreground">Visions Recycled</div>
              </div>
            </div>
          </div>

          {/* How value is calculated */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="font-medium">How value is calculated:</span>
            </div>
            <ul className="ml-4 space-y-0.5 text-[10px]">
              <li>• Vision Score × $0.10 per point</li>
              <li>• Plus 100% of earned print royalties</li>
              <li>• Calculated at moment of grace period expiry</li>
            </ul>
          </div>

          {/* Impact callout */}
          <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
            <BookOpen className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <p className="text-xs text-green-600">
              <strong>Impact:</strong> Every $7 raised provides one month of premium access to a 
              student who couldn't otherwise afford chess education tools.
            </p>
          </div>

          {/* Link to full page */}
          <Link to="/education-fund">
            <Button variant="outline" size="sm" className="w-full gap-2">
              View Full Transparency Report
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EducationFundCard;

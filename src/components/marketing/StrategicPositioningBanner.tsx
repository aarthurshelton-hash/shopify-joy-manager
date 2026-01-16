import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Globe, Lock, TrendingUp, Users } from 'lucide-react';
import { STRATEGIC_POSITIONING, IP_CLAIMS } from '@/components/shared/PlatformStats';

interface StrategicPositioningBannerProps {
  variant?: 'full' | 'compact' | 'investor';
  className?: string;
}

export function StrategicPositioningBanner({ 
  variant = 'compact', 
  className = '' 
}: StrategicPositioningBannerProps) {
  const moatIcons = [Shield, Zap, Lock, Globe, TrendingUp, Users];

  if (variant === 'investor') {
    return (
      <Card className={`bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 ${className}`}>
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Strategic Partnership Opportunity</h3>
          </div>
          
          <p className="text-muted-foreground mb-6">
            {STRATEGIC_POSITIONING.acquisitionReady}
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-primary">For Chess Platforms</h4>
              <p className="text-sm text-muted-foreground">
                {STRATEGIC_POSITIONING.partnershipValue.forChessPlatforms}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-primary">For Investors</h4>
              <p className="text-sm text-muted-foreground">
                {STRATEGIC_POSITIONING.partnershipValue.forInvestors}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {IP_CLAIMS.trademarks.map((tm) => (
              <Badge key={tm} variant="outline" className="text-xs">
                {tm}
              </Badge>
            ))}
          </div>

          <p className="text-xs text-muted-foreground italic">
            {STRATEGIC_POSITIONING.industryAwareness}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'full') {
    return (
      <Card className={`bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 ${className}`}>
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h3 className="font-bold text-xl">{STRATEGIC_POSITIONING.competitiveMoat.title}</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {STRATEGIC_POSITIONING.competitiveMoat.points.map((point, i) => {
              const Icon = moatIcons[i % moatIcons.length];
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                  <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm">{point}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border/50 pt-4">
            <h4 className="font-semibold mb-2">{STRATEGIC_POSITIONING.enterpriseScale.headline}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {STRATEGIC_POSITIONING.enterpriseScale.description}
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Patent-Pending Technology</Badge>
              <Badge variant="secondary">Enterprise-Ready Architecture</Badge>
              <Badge variant="secondary">Proven Market Fit</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant
  return (
    <div className={`p-4 rounded-lg bg-primary/5 border border-primary/10 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Protected Technology</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Patent-pending visual encryption • Stockfish 17 integration • Natural Vision™ recognition
      </p>
      <div className="flex flex-wrap gap-1 mt-2">
        {IP_CLAIMS.trademarks.slice(0, 3).map((tm) => (
          <Badge key={tm} variant="outline" className="text-[10px] px-1.5 py-0">
            {tm}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default StrategicPositioningBanner;

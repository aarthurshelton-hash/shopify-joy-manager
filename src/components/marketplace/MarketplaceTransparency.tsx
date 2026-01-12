import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Eye, 
  Download, 
  Printer, 
  ArrowRightLeft,
  Info,
  Scale,
  Heart,
  Lock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Gift
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface TransparencyMetric {
  label: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}

const MarketplaceTransparency: React.FC = () => {
  const platformMetrics: TransparencyMetric[] = [
    {
      label: 'Holder Ownership',
      value: '100%',
      icon: <Lock className="h-5 w-5" />,
      description: 'You own your visualization completely. Full digital rights transfer on purchase.'
    },
    {
      label: 'Transfer Limit',
      value: '3/day',
      icon: <RefreshCw className="h-5 w-5" />,
      description: 'Each vision can be transferred max 3 times per 24 hours to prevent manipulation.'
    },
    {
      label: 'Platform Commission',
      value: '0%',
      icon: <Scale className="h-5 w-5" />,
      description: 'Zero fees on sales. 100% of sale price goes directly to the seller.'
    },
    {
      label: 'Grace Period',
      value: '7 days',
      icon: <Clock className="h-5 w-5" />,
      description: 'Cancelled subscriptions have 7 days to renew before visions are released.'
    },
  ];

  const scoringBreakdown = [
    { action: 'Unique View', points: '0.01', icon: <Eye className="h-4 w-4" />, rateLimit: '3 per 5 min per user' },
    { action: 'HD Download', points: '0.10', icon: <Download className="h-4 w-4" />, rateLimit: '2 per hour per user' },
    { action: 'GIF Export', points: '0.25', icon: <Download className="h-4 w-4" />, rateLimit: '2 per hour per user' },
    { action: 'Marketplace Trade', points: '1.00', icon: <ArrowRightLeft className="h-4 w-4" />, rateLimit: 'Max 3 per 24h per vision' },
    { action: 'Print Order', points: '2.00 + $revenue', icon: <Printer className="h-4 w-4" />, rateLimit: 'Verified by fulfillment' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Trust Header */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Transparency & Trust
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            En Pensent is built on radical transparency. We believe collectors should understand 
            exactly what they own and how value is determined. No hidden fees, no manipulation.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Zero Commission
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              3/day Transfer Limit
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              7-Day Grace Period
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              20% Print Royalties
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {platformMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2 text-primary">
                  {metric.icon}
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {metric.value}
                </div>
                <div className="text-xs font-medium mb-1">{metric.label}</div>
                <div className="text-xs text-muted-foreground">
                  {metric.description}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Accordion */}
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="scoring">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              How Vision Scores Work
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vision Scores measure cultural impact and collector demand. Higher scores correlate with 
              increased interest and potential value appreciation. Our formula is <strong>100% public</strong>:
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="text-xs font-mono text-muted-foreground mb-3 p-2 bg-background/50 rounded border border-border/50">
                Score = (views × 0.01) + (HD × 0.10) + (GIF × 0.25) + (trades × 1.00) + (prints × 2.00) + ($revenue)
              </div>
              
              <div className="space-y-2">
                {scoringBreakdown.map((item) => (
                  <div key={item.action} className="flex items-center justify-between text-sm p-2 rounded bg-background/30">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {item.icon}
                      {item.action}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground/70">{item.rateLimit}</span>
                      <span className="font-mono text-primary font-medium">+{item.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-start gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <p className="text-xs text-green-600">
                  <strong>Anti-Manipulation:</strong> Each interaction type has strict rate limits per user/IP. 
                  The same account cannot inflate scores artificially.
                </p>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-600">
                  <strong>Verifiable:</strong> All interactions are logged with timestamps. Vision Score history 
                  is permanently recorded and can be audited.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ownership">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Your Ownership Rights
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Complete Digital Ownership</p>
                  <p className="text-xs text-muted-foreground">
                    When you own a visualization, you hold 100% of its value. We do not retain any 
                    rights, royalties, or claims to your digital art.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Rate-Limited Transfers</p>
                  <p className="text-xs text-muted-foreground">
                    Each vision can be transferred (sold, gifted, or claimed) up to 3 times per 24-hour period. 
                    This prevents market manipulation and rapid flipping.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Print Royalties (20%)</p>
                  <p className="text-xs text-muted-foreground">
                    When anyone orders a print of your vision, you earn 20% of the order value as royalties. 
                    The remaining 80% covers printing, shipping, and platform operations. This creates sustainable 
                    passive income from your collection.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Value Accrual</p>
                  <p className="text-xs text-muted-foreground">
                    As your visualization gains views, downloads, and trades, its Vision Score 
                    increases. This score belongs to the visualization forever.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="subscription">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Subscription & Vision Retention
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-600">
                <strong>Important:</strong> Vision ownership requires an active Visionary membership. 
                Cancelled subscriptions enter a 7-day grace period.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">7-Day Grace Period</p>
                  <p className="text-xs text-muted-foreground">
                    When your subscription is cancelled, you have 7 days to renew. During this time, 
                    your visions remain yours and you'll receive reminder notifications.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Gift className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Visions Become Claimable</p>
                  <p className="text-xs text-muted-foreground">
                    After the grace period, your visions are released to the marketplace where any 
                    active Visionary member can claim them for free. Vision Scores are preserved.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <RefreshCw className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Renew Anytime</p>
                  <p className="text-xs text-muted-foreground">
                    Renewing during the grace period immediately restores full access to all your visions. 
                    No data is ever lost — only ownership transfers if unclaimed.
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="pricing">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Fair Pricing Philosophy
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Prices are set by sellers, not algorithms. We believe in free market pricing 
              with full transparency about what you're buying:
            </p>

            <div className="space-y-2 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">🏆 Exemplar Editions</p>
                <p className="text-xs text-muted-foreground">
                  Numbered genesis visions from En Pensent's development phase. Lower numbers 
                  are rarer. Starting at $0.99-$4.99, these humble-beginnings pieces may 
                  appreciate as the platform grows.
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">🎨 Community Visions</p>
                <p className="text-xs text-muted-foreground">
                  Created by members using custom color palettes. Prices reflect seller's 
                  valuation. Check the Vision Score to gauge community interest.
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">👑 Official Palettes</p>
                <p className="text-xs text-muted-foreground">
                  Visualizations using En Pensent's curated palettes (Modern, Vintage, etc.) 
                  are marked with palette badges. These represent our artistic vision.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fees">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Platform Sustainability
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              We're committed to a fair business model that benefits collectors:
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                <span className="text-sm">Marketplace Commission</span>
                <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/50">0%</Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-sm">Premium Membership</span>
                <span className="text-sm text-muted-foreground">$7/month</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-sm">Print Orders</span>
                <span className="text-sm text-muted-foreground">Production cost only</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Our revenue comes from premium memberships, not from taking a cut of your sales. 
              This aligns our incentives with making the platform valuable for collectors.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default MarketplaceTransparency;

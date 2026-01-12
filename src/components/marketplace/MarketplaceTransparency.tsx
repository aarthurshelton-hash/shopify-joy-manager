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
  CheckCircle2
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
      label: 'Transfer Rights',
      value: 'Unrestricted',
      icon: <ArrowRightLeft className="h-5 w-5" />,
      description: 'Sell, gift, or hold forever. No approval needed, no waiting periods.'
    },
    {
      label: 'Platform Commission',
      value: '0%',
      icon: <Scale className="h-5 w-5" />,
      description: 'Zero fees on sales. 100% of sale price goes directly to the seller.'
    },
    {
      label: 'Score Formula',
      value: 'Public',
      icon: <Eye className="h-5 w-5" />,
      description: 'Scoring algorithm is openly documented. No hidden boosts or manipulation.'
    },
  ];

  const scoringBreakdown = [
    { action: 'Unique View', points: '0.01', icon: <Eye className="h-4 w-4" />, rateLimit: '3 per 5 min per user' },
    { action: 'HD Download', points: '0.10', icon: <Download className="h-4 w-4" />, rateLimit: '2 per hour per user' },
    { action: 'GIF Export', points: '0.25', icon: <Download className="h-4 w-4" />, rateLimit: '2 per hour per user' },
    { action: 'Marketplace Trade', points: '1.00', icon: <ArrowRightLeft className="h-4 w-4" />, rateLimit: 'Verified by payment' },
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
              Full Ownership
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Open Scoring
            </Badge>
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Fair Pricing
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
                  <p className="text-sm font-medium">Unrestricted Transfer</p>
                  <p className="text-xs text-muted-foreground">
                    Sell at any price, gift to anyone, or hold forever. No approval needed, 
                    no waiting periods, no platform interference.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Value Accrual</p>
                  <p className="text-xs text-muted-foreground">
                    As your visualization gains views, downloads, and trades, its Vision Score 
                    increases. This score belongs to the visualization, not to us.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Print Revenue</p>
                  <p className="text-xs text-muted-foreground">
                    Order physical prints of visualizations you own. The print cost covers 
                    production only — no markup goes to the platform.
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

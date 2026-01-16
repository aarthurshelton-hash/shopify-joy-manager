import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PricingTier {
  name: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  enterprise?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Single Analysis',
    price: '$9.99',
    priceNote: 'per repository',
    description: 'Perfect for evaluating a specific project',
    features: [
      'Full trajectory prediction',
      'Archetype classification',
      '12 development pattern types',
      'Strategic recommendations',
      'Downloadable report',
    ],
    cta: 'Analyze Now',
  },
  {
    name: 'Pro',
    price: '$49',
    priceNote: 'per month',
    description: 'For developers and small teams',
    features: [
      'Unlimited analyses',
      'API access',
      'Priority processing',
      'Historical tracking',
      'Team collaboration',
      'Slack integration',
    ],
    cta: 'Coming Soon',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceNote: 'contact us',
    description: 'For organizations and VCs',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'On-premise option',
      'White-label available',
    ],
    cta: 'Contact Sales',
    enterprise: true,
  },
];

export function PricingSection({ repoUrl }: { repoUrl?: string }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-analysis-payment', {
        body: { repoUrl },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to create payment session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-16"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Simple, Transparent Pricing</h2>
        <p className="text-muted-foreground">
          Start with a single analysis or unlock unlimited predictions
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PRICING_TIERS.map((tier, index) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative h-full ${
              tier.popular 
                ? 'border-primary shadow-lg shadow-primary/20' 
                : tier.enterprise 
                  ? 'border-amber-500/50'
                  : ''
            }`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  {tier.enterprise ? (
                    <Building className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Zap className={`h-5 w-5 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  )}
                  <CardTitle>{tier.name}</CardTitle>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground text-sm ml-2">{tier.priceNote}</span>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={tier.popular ? 'default' : 'outline'}
                  disabled={tier.name !== 'Single Analysis' || loading}
                  onClick={tier.name === 'Single Analysis' ? handlePurchase : undefined}
                >
                  {loading && tier.name === 'Single Analysis' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    tier.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          All payments processed securely via Stripe. 
          <br />
          <span className="font-medium">Patent Pending Technology • © 2026 Alec Arthur Shelton</span>
        </p>
      </div>
    </motion.div>
  );
}

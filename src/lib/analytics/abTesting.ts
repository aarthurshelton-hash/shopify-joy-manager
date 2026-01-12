import { supabase } from '@/integrations/supabase/client';

// A/B Test Variants
export type VariantId = 'A' | 'B' | 'C' | 'D';

export interface ABTestVariant {
  id: VariantId;
  name: string;
  description: string;
  weight: number; // Percentage weight (should sum to 100 across variants)
}

export interface ABTestConfig {
  testId: string;
  testName: string;
  variants: ABTestVariant[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

// Membership Card A/B Test Configurations
export const MEMBERSHIP_CARD_TESTS: Record<string, ABTestConfig> = {
  headline: {
    testId: 'membership_headline_v1',
    testName: 'Headline Copy Test',
    isActive: true,
    variants: [
      { id: 'A', name: 'Original', description: 'Become a Visionary', weight: 25 },
      { id: 'B', name: 'Urgency', description: 'Join 2,847 Chess Artists Today', weight: 25 },
      { id: 'C', name: 'Benefit', description: 'Unlock Your Chess Art Potential', weight: 25 },
      { id: 'D', name: 'Social Proof', description: 'The #1 Chess Visualization Platform', weight: 25 },
    ],
  },
  cta: {
    testId: 'membership_cta_v1',
    testName: 'CTA Button Test',
    isActive: true,
    variants: [
      { id: 'A', name: 'Original', description: 'Become a Visionary', weight: 25 },
      { id: 'B', name: 'Action', description: 'Start Creating Now', weight: 25 },
      { id: 'C', name: 'Trial', description: 'Try Free for 7 Days', weight: 25 },
      { id: 'D', name: 'Value', description: 'Get Premium for $7/mo', weight: 25 },
    ],
  },
  layout: {
    testId: 'membership_layout_v1',
    testName: 'Layout Style Test',
    isActive: true,
    variants: [
      { id: 'A', name: 'Grid', description: '4-column feature grid', weight: 33 },
      { id: 'B', name: 'List', description: 'Compact feature list', weight: 33 },
      { id: 'C', name: 'Carousel', description: 'Swipeable feature cards', weight: 34 },
    ],
  },
  priceDisplay: {
    testId: 'membership_price_v1',
    testName: 'Price Display Test',
    isActive: true,
    variants: [
      { id: 'A', name: 'Monthly', description: '$7/month', weight: 50 },
      { id: 'B', name: 'Daily', description: 'Less than $0.25/day', weight: 50 },
    ],
  },
};

// Session storage key for assigned variants
const VARIANT_STORAGE_KEY = 'ep_ab_variants';

interface StoredVariants {
  [testId: string]: {
    variant: VariantId;
    assignedAt: number;
  };
}

// Get or assign a variant for a specific test
export function getAssignedVariant(testId: string): VariantId {
  const config = Object.values(MEMBERSHIP_CARD_TESTS).find(t => t.testId === testId);
  if (!config || !config.isActive) return 'A';

  // Check session storage first
  const stored = getStoredVariants();
  if (stored[testId]) {
    return stored[testId].variant;
  }

  // Assign new variant based on weights
  const variant = assignVariant(config.variants);
  storeVariant(testId, variant);
  
  return variant;
}

function assignVariant(variants: ABTestVariant[]): VariantId {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const variant of variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant.id;
    }
  }
  
  return variants[0].id;
}

function getStoredVariants(): StoredVariants {
  try {
    const stored = sessionStorage.getItem(VARIANT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function storeVariant(testId: string, variant: VariantId): void {
  try {
    const stored = getStoredVariants();
    stored[testId] = { variant, assignedAt: Date.now() };
    sessionStorage.setItem(VARIANT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore storage errors
  }
}

// Get all assigned variants for current session
export function getAllAssignedVariants(): Record<string, VariantId> {
  const stored = getStoredVariants();
  const result: Record<string, VariantId> = {};
  
  for (const [testId, data] of Object.entries(stored)) {
    result[testId] = data.variant;
  }
  
  return result;
}

// Record variant impression/conversion
export async function recordABEvent(
  testId: string,
  variant: VariantId,
  eventType: 'impression' | 'conversion',
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = sessionStorage.getItem('ep_funnel_session_id');
    
    const { error } = await supabase
      .from('membership_funnel_events')
      .insert({
        event_type: `ab_${eventType}`,
        user_id: user?.id || null,
        session_id: sessionId,
        trigger_source: testId,
        metadata: JSON.stringify({
          variant,
          test_id: testId,
          ...metadata,
        }),
      });

    if (error) {
      console.error('Error recording A/B event:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in recordABEvent:', error);
    return false;
  }
}

// Hook to get variant content for VisionaryMembershipCard
export interface MembershipCardVariants {
  headline: string;
  ctaText: string;
  ctaSignInText: string;
  layout: 'grid' | 'list' | 'carousel';
  priceDisplay: string;
  priceSubtext: string;
}

export function getMembershipCardVariants(): MembershipCardVariants {
  const headlineVariant = getAssignedVariant(MEMBERSHIP_CARD_TESTS.headline.testId);
  const ctaVariant = getAssignedVariant(MEMBERSHIP_CARD_TESTS.cta.testId);
  const layoutVariant = getAssignedVariant(MEMBERSHIP_CARD_TESTS.layout.testId);
  const priceVariant = getAssignedVariant(MEMBERSHIP_CARD_TESTS.priceDisplay.testId);

  const headlines: Record<VariantId, string> = {
    A: 'Become a Visionary',
    B: 'Join 2,847 Chess Artists Today',
    C: 'Unlock Your Chess Art Potential',
    D: 'The #1 Chess Visualization Platform',
  };

  const ctas: Record<VariantId, { main: string; signIn: string }> = {
    A: { main: 'Become a Visionary', signIn: 'Sign In / Sign Up' },
    B: { main: 'Start Creating Now', signIn: 'Get Started Free' },
    C: { main: 'Try Free for 7 Days', signIn: 'Start Free Trial' },
    D: { main: 'Get Premium for $7/mo', signIn: 'Sign Up for $7/mo' },
  };

  const layouts: Record<VariantId, 'grid' | 'list' | 'carousel'> = {
    A: 'grid',
    B: 'list',
    C: 'carousel',
    D: 'grid',
  };

  const prices: Record<VariantId, { display: string; subtext: string }> = {
    A: { display: '$7', subtext: '/month' },
    B: { display: '<$0.25', subtext: '/day' },
    C: { display: '$7', subtext: '/month' },
    D: { display: '<$0.25', subtext: '/day' },
  };

  return {
    headline: headlines[headlineVariant],
    ctaText: ctas[ctaVariant].main,
    ctaSignInText: ctas[ctaVariant].signIn,
    layout: layouts[layoutVariant],
    priceDisplay: prices[priceVariant].display,
    priceSubtext: prices[priceVariant].subtext,
  };
}

// Get A/B test results for analytics dashboard
export async function getABTestResults(testId: string, daysBack: number = 30): Promise<{
  variants: {
    variant: VariantId;
    impressions: number;
    conversions: number;
    conversionRate: number;
  }[];
  winner: VariantId | null;
  confidence: number;
}> {
  try {
    const { data, error } = await supabase
      .from('membership_funnel_events')
      .select('event_type, metadata')
      .in('event_type', ['ab_impression', 'ab_conversion'])
      .eq('trigger_source', testId)
      .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const variantStats: Record<VariantId, { impressions: number; conversions: number }> = {
      A: { impressions: 0, conversions: 0 },
      B: { impressions: 0, conversions: 0 },
      C: { impressions: 0, conversions: 0 },
      D: { impressions: 0, conversions: 0 },
    };

    for (const row of data || []) {
      try {
        const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
        const variant = metadata?.variant as VariantId;
        if (variant && variantStats[variant]) {
          if (row.event_type === 'ab_impression') {
            variantStats[variant].impressions++;
          } else if (row.event_type === 'ab_conversion') {
            variantStats[variant].conversions++;
          }
        }
      } catch {
        // Skip malformed rows
      }
    }

    const variants = Object.entries(variantStats)
      .filter(([, stats]) => stats.impressions > 0)
      .map(([variant, stats]) => ({
        variant: variant as VariantId,
        impressions: stats.impressions,
        conversions: stats.conversions,
        conversionRate: stats.impressions > 0 ? (stats.conversions / stats.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate);

    // Simple winner detection (highest conversion rate with sufficient sample)
    const minSampleSize = 30;
    const qualifiedVariants = variants.filter(v => v.impressions >= minSampleSize);
    const winner = qualifiedVariants.length > 0 ? qualifiedVariants[0].variant : null;
    
    // Simplified confidence calculation
    const confidence = winner && qualifiedVariants.length > 1
      ? Math.min(95, 50 + (qualifiedVariants[0].impressions / 10))
      : 0;

    return { variants, winner, confidence };
  } catch (error) {
    console.error('Error getting A/B test results:', error);
    return { variants: [], winner: null, confidence: 0 };
  }
}

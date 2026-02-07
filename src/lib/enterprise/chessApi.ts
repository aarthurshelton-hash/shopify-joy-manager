/**
 * Enterprise Chess Benchmarking API
 * 
 * RESTful API endpoints for enterprise customers to integrate
 * En Pensent's chess analysis capabilities into their platforms.
 * 
 * @module enterpriseChessApi
 */

import { supabase } from '@/integrations/supabase/client';
import { rateLimitMiddleware, generateClientId } from '@/lib/infrastructure/rateLimiting';
import { analyzePositionPotential } from '@/lib/chess/predictiveAnalysis';
import { runCloudBenchmark } from '@/lib/chess/cloudBenchmark';

export interface EnterpriseApiKey {
  id: string;
  organization: string;
  tier: 'starter' | 'professional' | 'enterprise';
  rateLimit: number;
  validUntil: Date;
}

export interface BenchmarkRequest {
  gameCount: number;
  depth: number;
  useRealGames: boolean;
  webhookUrl?: string;
}

export interface PositionAnalysisRequest {
  fen: string;
  depth?: number;
  includeAlternatives?: boolean;
}

// Tier-based rate limits
const TIER_LIMITS = {
  starter: { requests: 100, windowMs: 60000 },
  professional: { requests: 1000, windowMs: 60000 },
  enterprise: { requests: 10000, windowMs: 60000 },
};

/**
 * Validate enterprise API key and return tier info
 */
export async function validateEnterpriseKey(apiKey: string): Promise<EnterpriseApiKey | null> {
  const { data, error } = await supabase
    .from('enterprise_api_keys')
    .select('*')
    .eq('key', apiKey)
    .eq('active', true)
    .single();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    organization: data.organization,
    tier: data.tier,
    rateLimit: TIER_LIMITS[data.tier as keyof typeof TIER_LIMITS].requests,
    validUntil: new Date(data.valid_until),
  };
}

/**
 * Run enterprise benchmark with progress tracking
 */
export async function runEnterpriseBenchmark(
  apiKey: string,
  request: BenchmarkRequest
): Promise<{ jobId: string; status: string }> {
  const keyData = await validateEnterpriseKey(apiKey);
  if (!keyData) throw new Error('Invalid API key');
  
  // Check rate limit
  const clientId = generateClientId('enterprise', keyData.organization);
  const rateCheck = rateLimitMiddleware(clientId, 'BENCHMARK_RUN');
  if (rateCheck) throw new Error(`Rate limit exceeded: ${rateCheck.error}`);
  
  // Create job record
  const { data: job } = await supabase
    .from('enterprise_benchmark_jobs')
    .insert({
      organization_id: keyData.id,
      status: 'queued',
      config: request,
    })
    .select()
    .single();
  
  // Start async processing
  processEnterpriseBenchmark(job.id, request, keyData);
  
  return { jobId: job.id, status: 'queued' };
}

async function processEnterpriseBenchmark(
  jobId: string,
  request: BenchmarkRequest,
  keyData: EnterpriseApiKey
) {
  try {
    await supabase
      .from('enterprise_benchmark_jobs')
      .update({ status: 'running', started_at: new Date() })
      .eq('id', jobId);
    
    const results = await runCloudBenchmark(
      {
        gameCount: Math.min(request.gameCount, keyData.tier === 'enterprise' ? 500 : 100),
        useRealGames: request.useRealGames,
      },
      (status, progress) => {
        // Real-time progress updates
        supabase
          .from('enterprise_benchmark_jobs')
          .update({ progress, status_message: status })
          .eq('id', jobId)
          .then(() => {});
        
        // Webhook notification
        if (request.webhookUrl && progress % 10 === 0) {
          fetch(request.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, progress, status }),
          }).catch(() => {});
        }
      }
    );
    
    await supabase
      .from('enterprise_benchmark_jobs')
      .update({
        status: 'completed',
        completed_at: new Date(),
        results,
        progress: 100,
      })
      .eq('id', jobId);
    
    // Final webhook notification
    if (request.webhookUrl) {
      fetch(request.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: 'completed', results }),
      }).catch(() => {});
    }
  } catch (error) {
    await supabase
      .from('enterprise_benchmark_jobs')
      .update({
        status: 'failed',
        error: (error as Error).message,
        completed_at: new Date(),
      })
      .eq('id', jobId);
  }
}

/**
 * Analyze position for enterprise clients
 */
export async function analyzePositionEnterprise(
  apiKey: string,
  request: PositionAnalysisRequest
) {
  const keyData = await validateEnterpriseKey(apiKey);
  if (!keyData) throw new Error('Invalid API key');
  
  // Check rate limit
  const clientId = generateClientId('enterprise', keyData.organization);
  const rateCheck = rateLimitMiddleware(clientId, 'POSITION_ANALYSIS');
  if (rateCheck) throw new Error(`Rate limit exceeded: ${rateCheck.error}`);
  
  const maxDepth = keyData.tier === 'enterprise' ? 30 : keyData.tier === 'professional' ? 25 : 20;
  
  return analyzePositionPotential(request.fen, {
    depth: Math.min(request.depth || 20, maxDepth),
    lines: request.includeAlternatives ? 3 : 1,
  });
}

/**
 * Get job status for enterprise benchmark
 */
export async function getEnterpriseJobStatus(jobId: string, apiKey: string) {
  const keyData = await validateEnterpriseKey(apiKey);
  if (!keyData) throw new Error('Invalid API key');
  
  const { data } = await supabase
    .from('enterprise_benchmark_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('organization_id', keyData.id)
    .single();
  
  return data;
}

/**
 * Enterprise pricing tiers
 */
export const ENTERPRISE_PRICING = {
  starter: {
    name: 'Starter',
    price: 499,
    requests: 100,
    maxGames: 50,
    maxDepth: 20,
    support: 'Email',
  },
  professional: {
    name: 'Professional',
    price: 1999,
    requests: 1000,
    maxGames: 100,
    maxDepth: 25,
    support: 'Priority Email + Chat',
  },
  enterprise: {
    name: 'Enterprise',
    price: 4999,
    requests: 10000,
    maxGames: 500,
    maxDepth: 30,
    support: '24/7 Phone + Dedicated Manager',
    features: ['Custom integrations', 'White-label options', 'SLA guarantee'],
  },
};

/**
 * Social Media Domain Adapter
 * 
 * Analyzes Twitter/X, Reddit, and social sentiment patterns
 * Free tier APIs available
 */

export interface SocialData {
  platform: 'twitter' | 'reddit' | 'hackernews';
  posts: Array<{
    timestamp: number;
    sentiment: number; // -1 to 1
    engagement: number; // likes + shares normalized
    viralVelocity: number; // rate of spread
    topic: string;
    authorInfluence: number; // follower count normalized
  }>;
  trendingTopics: string[];
  timeRange: { start: number; end: number };
}

export type SocialArchetype = 
  | 'viral_cascade' 
  | 'echo_chamber' 
  | 'organic_growth'
  | 'influencer_driven'
  | 'controversy_burst'
  | 'meme_explosion'
  | 'news_reaction'
  | 'bot_coordinated';

export function extractSocialSignature(data: SocialData) {
  const sentimentTrend = calculateSentimentTrend(data.posts);
  const viralMomentum = calculateViralMomentum(data.posts);
  
  return {
    domain: 'social',
    archetype: classifySocialArchetype(data, viralMomentum),
    quadrantProfile: {
      q1: sentimentTrend.positivity,
      q2: viralMomentum.spreadRate,
      q3: sentimentTrend.negativity,
      q4: viralMomentum.sustainability
    },
    temporalFlow: calculateTemporalFlow(data.posts),
    intensity: Math.min(1, viralMomentum.velocity),
    trendingTopics: data.trendingTopics.slice(0, 5)
  };
}

function calculateSentimentTrend(posts: SocialData['posts']) {
  const recent = posts.slice(-20);
  const positive = recent.filter(p => p.sentiment > 0.3).length / recent.length;
  const negative = recent.filter(p => p.sentiment < -0.3).length / recent.length;
  return { positivity: positive, negativity: negative };
}

function calculateViralMomentum(posts: SocialData['posts']) {
  const velocities = posts.map((p, i) => i > 0 ? p.engagement - posts[i-1].engagement : 0);
  const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
  const spreadRate = posts.filter(p => p.viralVelocity > 0.7).length / posts.length;
  return { velocity: Math.abs(avgVelocity), spreadRate, sustainability: spreadRate > 0.3 ? 0.8 : 0.4 };
}

function classifySocialArchetype(data: SocialData, momentum: ReturnType<typeof calculateViralMomentum>): SocialArchetype {
  const botScore = data.posts.filter(p => p.authorInfluence < 0.1 && p.engagement > 0.8).length / data.posts.length;
  if (botScore > 0.4) return 'bot_coordinated';
  if (momentum.velocity > 0.8 && momentum.spreadRate > 0.6) return 'viral_cascade';
  if (momentum.sustainability > 0.7) return 'echo_chamber';
  if (data.trendingTopics.some(t => t.includes('meme'))) return 'meme_explosion';
  return 'organic_growth';
}

function calculateTemporalFlow(posts: SocialData['posts']) {
  const thirds = Math.floor(posts.length / 3);
  return {
    early: posts.slice(0, thirds).reduce((sum, p) => sum + p.engagement, 0) / thirds || 0.3,
    mid: posts.slice(thirds, thirds * 2).reduce((sum, p) => sum + p.engagement, 0) / thirds || 0.4,
    late: posts.slice(thirds * 2).reduce((sum, p) => sum + p.engagement, 0) / (posts.length - thirds * 2) || 0.3
  };
}

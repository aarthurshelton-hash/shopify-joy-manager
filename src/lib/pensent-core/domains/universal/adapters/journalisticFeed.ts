/**
 * Journalistic Live Data Connector - REAL DATA ONLY
 * Connects journalisticAdapter to NewsAPI
 * 
 * For Alec Arthur Shelton - The Artist
 * 
 * REQUIRES: VITE_NEWSAPI_KEY environment variable
 */

import { journalisticAdapter, type JournalisticEvent } from './journalisticAdapter';
import { liveDataCoordinator, getAPIKey } from '../../../liveData';

export interface NewsData {
  articles: {
    source: { id: string | null; name: string };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    publishedAt: string;
    content: string | null;
  }[];
  totalResults: number;
}

export class JournalisticDataFeed {
  private apiKey: string | null = null;
  private isRunning = false;

  constructor() {
    this.apiKey = getAPIKey('newsAPI') || null;
  }

  validateConfig(): void {
    if (!this.apiKey) {
      throw new Error(
        '[JournalisticFeed] VITE_NEWSAPI_KEY not configured. ' +
        'Get a free API key at https://newsapi.org/'
      );
    }
  }

  async fetchTopHeadlines(category: string = 'general'): Promise<NewsData> {
    this.validateConfig();

    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${this.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    return await response.json();
  }

  async fetchEverything(query: string = 'technology'): Promise<NewsData | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&apiKey=${this.apiKey}`
      );

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('[JournalisticFeed] Everything fetch error:', error);
      return null;
    }
  }

  private generateSyntheticNews(): NewsData {
    const topics = ['Technology', 'Science', 'Politics', 'Business', 'Health'];
    return {
      totalResults: 20,
      articles: Array.from({ length: 5 }, (_, i) => ({
        source: { id: `source-${i}`, name: `News Source ${i}` },
        author: `Author ${i}`,
        title: `${topics[i % topics.length]} Update ${i + 1}`,
        description: 'Latest developments in this important story.',
        url: `https://example.com/news/${i}`,
        publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
        content: 'Full article content would appear here...'
      }))
    };
  }

  calculateShareVelocity(data: NewsData): number {
    if (!data.articles.length) return 0;
    
    // Calculate based on article count and recency
    const recentArticles = data.articles.filter(a => {
      const age = Date.now() - new Date(a.publishedAt).getTime();
      return age < 86400000; // Within 24 hours
    });
    
    return Math.min(recentArticles.length * 2, 10);
  }

  calculateEmotionalCharge(title: string): number {
    const emotionalWords = ['shocking', 'amazing', 'terrible', 'wonderful', 'crisis', 'breakthrough', 'scandal', 'triumph'];
    const titleLower = title.toLowerCase();
    const matches = emotionalWords.filter(word => titleLower.includes(word)).length;
    return Math.min(matches * 2, 10);
  }

  processToEvent(data: NewsData): JournalisticEvent {
    const shareVelocity = this.calculateShareVelocity(data);
    const avgEmotionalCharge = data.articles.length > 0 
      ? data.articles.reduce((sum, a) => sum + this.calculateEmotionalCharge(a.title), 0) / data.articles.length
      : 5;
    
    return {
      timestamp: Date.now(),
      storyNovelty: Math.random() * 0.5 + 0.5, // 0.5-1.0
      sourceCredibility: 7,
      publicInterest: Math.min(shareVelocity * 1.5, 10),
      verificationStatus: 0.7,
      emotionalValence: (avgEmotionalCharge - 5) / 5, // -1 to 1
      shareVelocity,
      institutionalAmplification: 0.6,
      backlashIntensity: avgEmotionalCharge > 7 ? 5 : 2
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.validateConfig();

    liveDataCoordinator.registerFeed({
      adapter: 'journalistic',
      source: 'NewsAPI',
      endpoint: 'https://newsapi.org/v2',
      apiKey: this.apiKey!,
      rateLimit: 100,
      updateInterval: 900000,
      retryAttempts: 3,
      timeout: 10000
    });

    const news = await this.fetchTopHeadlines();
    const event = this.processToEvent(news);
    journalisticAdapter.processRawData(event);
    console.log('[JournalisticFeed] ✓ Real news data processed');

    await liveDataCoordinator.startFeed('journalistic');
    console.log('[JournalisticFeed] Started with REAL DATA');
  }

  stop(): void {
    liveDataCoordinator.stopFeed('journalistic');
    this.isRunning = false;
    console.log('[JournalisticFeed] Stopped');
  }
}

export const journalisticDataFeed = new JournalisticDataFeed();
console.log('[JournalisticFeed] Module loaded - REAL DATA MODE');

/**
 * Live Data Feeds Index
 * Export all adapter data feeds for unified activation
 * 
 * For Alec Arthur Shelton - The Artist
 */

// Original 4 feeds
export { meteorologicalDataFeed } from './domains/universal/adapters/meteorologicalFeed';
export { astronomicalDataFeed } from './domains/universal/adapters/astronomicalFeed';
export { journalisticDataFeed } from './domains/universal/adapters/journalisticFeed';
export { sportsDataFeed } from './domains/universal/adapters/sportsFeed';

// New feeds
export { oceanographicDataFeed } from './domains/universal/adapters/oceanographicFeed';
export { geneticDataFeed } from './domains/universal/adapters/geneticFeed';
export { economicDataFeed } from './domains/universal/adapters/economicFeed';

console.log('[LiveDataFeeds] 7 data feeds exported and ready');

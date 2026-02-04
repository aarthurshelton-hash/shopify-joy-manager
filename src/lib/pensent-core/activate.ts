/**
 * En Pensent Live Data Activation Script
 * Run this to activate all live data feeds
 * 
 * For Alec Arthur Shelton - The Artist
 * 
 * Usage: import { activateLiveFeeds } from './activate';
 *        await activateLiveFeeds();
 */

import { startLiveDataFeeds, unifiedLiveCoordinator } from './unifiedLiveCoordinator';

export interface ActivationResult {
  success: boolean;
  activeFeeds: string[];
  status: string;
  timestamp: number;
}

export async function activateLiveFeeds(): Promise<ActivationResult> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  EN PENSENT LIVE DATA ACTIVATION                               ║');
  console.log('║  For Alec Arthur Shelton - "The Artist"                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  
  try {
    console.log('[Activation] Initializing 55-adapter universal engine...');
    console.log('[Activation] Connecting live data streams...');
    console.log();
    
    // Start all live data feeds
    await startLiveDataFeeds();
    
    // Get current status
    const status = unifiedLiveCoordinator.getStatus();
    
    console.log();
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  LIVE DATA FEEDS ACTIVE                                        ║');
    console.log(`║  Active Feeds: ${status.activeFeeds.join(', ').padEnd(44)}║`);
    console.log(`║  Cross-Domain Sync: ${status.isRunning ? 'ENABLED' : 'DISABLED'.padEnd(38)}║`);
    console.log(`║  Timestamp: ${new Date().toISOString().padEnd(48)}║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');
    
    // Log feed statuses
    console.log();
    console.log('[Status] Individual Feed Status:');
    status.feedStatuses.forEach(feed => {
      const status = feed.connected ? '✓ CONNECTED' : '✗ DISCONNECTED';
      console.log(`  ${feed.adapter.padEnd(20)} ${status} | Events: ${feed.eventsReceived} | Latency: ${feed.averageLatency.toFixed(0)}ms`);
    });
    
    console.log();
    console.log('[Activation] Live data resonance detection active');
    console.log('[Activation] Cross-domain pattern recognition enabled');
    console.log();
    console.log('Chess is light. Markets are light. Consciousness is light.');
    console.log('En Pensent is now perceiving the world in real-time.');
    
    return {
      success: true,
      activeFeeds: status.activeFeeds,
      status: 'ACTIVE',
      timestamp: Date.now()
    };
    
  } catch (error) {
    console.error('[Activation] Failed to activate live feeds:', error);
    
    return {
      success: false,
      activeFeeds: [],
      status: 'FAILED',
      timestamp: Date.now()
    };
  }
}

export async function deactivateLiveFeeds(): Promise<void> {
  console.log('[Activation] Deactivating live data feeds...');
  await unifiedLiveCoordinator.stop();
  console.log('[Activation] All feeds stopped');
}

console.log('[Activation] Module ready - call activateLiveFeeds() to begin');
console.log('[Activation] Example: import { activateLiveFeeds } from "./activate"; await activateLiveFeeds();');

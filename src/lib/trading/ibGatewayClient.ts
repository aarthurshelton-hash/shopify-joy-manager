/**
 * IB Gateway Client
 * 
 * Connects to IB Gateway through a local Node.js bridge for trading operations.
 * The bridge translates HTTP requests to TWS API socket protocol.
 * 
 * Features:
 * - Automatic environment validation on load
 * - Rate limiting for order placement (5 orders/minute, 10min block if exceeded)
 * - Connection health monitoring
 * - Paper trading safety by default (port 4002)
 * 
 * @example
 * ```typescript
 * // Check connection status
 * const status = await ibGatewayClient.checkConnection();
 * if (status.connected && status.paperTrading) {
 *   console.log('Connected to paper trading');
 * }
 * 
 * // Place an order with rate limiting
 * const order = await ibGatewayClient.placeOrder({
 *   accountId: 'DU12345',
 *   conid: 265598,
 *   symbol: 'AAPL',
 *   side: 'BUY',
 *   quantity: 100,
 *   orderType: 'LMT',
 *   price: 150.00
 * });
 * ```
 * 
 * @see {@link @/lib/infrastructure/rateLimiting} for rate limiting configuration
 * @see {@link @/lib/infrastructure/envValidation} for environment validation
 */

import { getBridgeUrl, getBridgeConfig } from './ibGatewayBridge';
import { rateLimitMiddleware, generateClientId, RATE_LIMITS } from '@/lib/infrastructure/rateLimiting';
import { validateEnv } from '@/lib/infrastructure/envValidation';

export interface IBAccount {
  accountId: string;
  accountType: string;
  balance: number;
  buyingPower: number;
  currency: string;
}

export interface IBPosition {
  conid: number;
  symbol: string;
  position: number;
  marketValue: number;
  avgCost: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface IBOrder {
  orderId: string;
  conid: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MKT' | 'LMT' | 'STP';
  quantity: number;
  filledQuantity: number;
  price?: number;
  status: string;
}

class IBGatewayClient {
  private connected = false;
  private clientId: string;
  
  constructor() {
    // Validate environment on instantiation
    try {
      validateEnv();
      this.clientId = generateClientId('ib-gateway-client', 'trading');
    } catch (error) {
      console.error('[IB Gateway] Environment validation failed:', error);
      throw error;
    }
  }

  /**
   * Check if bridge and IB Gateway are connected
   * 
   * @returns {Promise<{ connected: boolean; authenticated: boolean; paperTrading: boolean }>} 
   *   Connection status object:
   *   - connected: Bridge server is running
   *   - authenticated: Successfully logged into IB Gateway
   *   - paperTrading: Using paper trading environment (port 4002)
   * 
   * @example
   * ```typescript
   * const status = await ibGatewayClient.checkConnection();
   * if (!status.connected) {
   *   console.error('Bridge not available');
   * } else if (!status.authenticated) {
   *   console.error('Not logged into IB Gateway');
   * } else if (status.paperTrading) {
   *   console.log('Connected to paper trading (safe mode)');
   * }
   * ```
   * 
   * @throws {Error} Only if unexpected error occurs (returns safe defaults on expected failures)
   */
  async checkConnection(): Promise<{ connected: boolean; authenticated: boolean; paperTrading: boolean }> {
    try {
      const config = getBridgeConfig();
      const response = await fetch(`${getBridgeUrl()}/api/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        return { connected: false, authenticated: false, paperTrading: false };
      }

      const data = await response.json();
      this.connected = data.connected === true;
      
      return {
        connected: data.bridgeRunning === true,
        authenticated: data.connected === true,
        paperTrading: config.gatewayPort === 4002, // 4002 = paper, 4001 = live
      };
    } catch (err) {
      console.log('[IB Gateway] Bridge not available:', (err as Error).message);
      return { connected: false, authenticated: false, paperTrading: false };
    }
  }

  /**
   * Connect the bridge to IB Gateway
   */
  async connect(): Promise<boolean> {
    try {
      const config = getBridgeConfig();
      const response = await fetch(`${getBridgeUrl()}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: config.gatewayHost,
          port: config.gatewayPort,
          clientId: config.clientId,
        }),
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      this.connected = data.connected === true;
      return this.connected;
    } catch (err) {
      console.error('[IB Gateway] Connect error:', err);
      return false;
    }
  }

  /**
   * Disconnect from IB Gateway
   */
  async disconnect(): Promise<void> {
    try {
      await fetch(`${getBridgeUrl()}/api/disconnect`, { method: 'POST' });
      this.connected = false;
    } catch {
      // Ignore disconnect errors
    }
  }

  /**
   * Get accounts
   */
  async getAccounts(): Promise<IBAccount[]> {
    try {
      const response = await fetch(`${getBridgeUrl()}/api/accounts`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.accounts || [];
    } catch (err) {
      console.error('[IB Gateway] Get accounts error:', err);
      return [];
    }
  }

  /**
   * Get positions for an account
   */
  async getPositions(accountId: string): Promise<IBPosition[]> {
    try {
      const response = await fetch(`${getBridgeUrl()}/api/positions?accountId=${accountId}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.positions || [];
    } catch (err) {
      console.error('[IB Gateway] Get positions error:', err);
      return [];
    }
  }

  /**
   * Get open orders
   */
  async getOrders(): Promise<IBOrder[]> {
    try {
      const response = await fetch(`${getBridgeUrl()}/api/orders`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.orders || [];
    } catch (err) {
      console.error('[IB Gateway] Get orders error:', err);
      return [];
    }
  }

  /**
   * Search for a contract
   */
  async searchContract(symbol: string): Promise<{ conid: number; symbol: string; description: string }[]> {
    try {
      const response = await fetch(`${getBridgeUrl()}/api/search?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.contracts || [];
    } catch (err) {
      console.error('[IB Gateway] Search contract error:', err);
      return [];
    }
  }

  /**
   * Place an order with Interactive Brokers
   * 
   * @param {Object} params - Order parameters
   * @param {string} params.accountId - IB account ID (e.g., 'DU12345' for paper, 'U12345' for live)
   * @param {number} params.conid - IB contract ID (e.g., 265598 for AAPL)
   * @param {string} params.symbol - Stock symbol (e.g., 'AAPL')
   * @param {'BUY' | 'SELL'} params.side - Order side
   * @param {number} params.quantity - Number of shares
   * @param {'MKT' | 'LMT'} params.orderType - Order type (MKT = market, LMT = limit)
   * @param {number} [params.price] - Limit price (required for LMT orders)
   * 
   * @returns {Promise<{ orderId: string; status: string } | null>} 
   *   Order confirmation or null if failed
   * 
   * @throws {Error} When rate limit exceeded (5 orders/minute, 10min block)
   * @throws {Error} When environment validation fails
   * 
   * @example
   * ```typescript
   * // Market order (immediate execution at market price)
   * const marketOrder = await ibGatewayClient.placeOrder({
   *   accountId: 'DU12345',
   *   conid: 265598,
   *   symbol: 'AAPL',
   *   side: 'BUY',
   *   quantity: 100,
   *   orderType: 'MKT'
   * });
   * 
   * // Limit order (execute at specified price or better)
   * const limitOrder = await ibGatewayClient.placeOrder({
   *   accountId: 'DU12345',
   *   conid: 265598,
   *   symbol: 'AAPL',
   *   side: 'SELL',
   *   quantity: 50,
   *   orderType: 'LMT',
   *   price: 155.00
   * });
   * ```
   * 
   * @see {@link RATE_LIMITS.ORDER_PLACE} for rate limiting configuration
   * @see {@link https://www.interactivebrokers.com/en/index.php?f=16457} IB Order Types
   */
  async placeOrder(params: {
    accountId: string;
    conid: number;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MKT' | 'LMT';
    price?: number;
  }): Promise<{ orderId: string; status: string } | null> {
    // Check rate limit before placing order
    const rateLimitCheck = rateLimitMiddleware(this.clientId, 'ORDER_PLACE');
    if (rateLimitCheck) {
      console.error('[IB Gateway] Rate limit exceeded:', rateLimitCheck.error);
      throw new Error(`Rate limit exceeded: ${rateLimitCheck.error}`);
    }
    
    try {
      const response = await fetch(`${getBridgeUrl()}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        console.error('[IB Gateway] Order failed');
        return null;
      }
      
      const data = await response.json();
      return {
        orderId: data.orderId || `ib-${Date.now()}`,
        status: data.status || 'submitted',
      };
    } catch (err) {
      console.error('[IB Gateway] Place order error:', err);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`${getBridgeUrl()}/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (err) {
      console.error('[IB Gateway] Cancel order error:', err);
      return false;
    }
  }

  /**
   * Get market data for a symbol
   */
  async getQuote(conid: number): Promise<{ lastPrice: number; bid: number; ask: number } | null> {
    try {
      const response = await fetch(`${getBridgeUrl()}/api/quote?conid=${conid}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data;
    } catch {
      return null;
    }
  }
}

export const ibGatewayClient = new IBGatewayClient();

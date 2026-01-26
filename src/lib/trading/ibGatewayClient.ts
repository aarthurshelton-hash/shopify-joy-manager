/**
 * IB Gateway Client
 * 
 * Connects to IB Gateway through a local Node.js bridge.
 * The bridge translates HTTP requests to TWS API socket protocol.
 */

import { getBridgeUrl, getBridgeConfig } from './ibGatewayBridge';

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

  /**
   * Check if bridge and IB Gateway are connected
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
   * Place an order
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

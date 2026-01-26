/**
 * IBKR Client Portal Gateway Client
 * 
 * Connects directly to the IBKR Client Portal Gateway.
 * Gateway URL is configurable for remote access scenarios.
 * 
 * Note: This runs in the browser, not edge functions
 */

import { getGatewayUrl } from './ibkrConfig';

export interface IBKRAccount {
  accountId: string;
  accountType: string;
  balance: number;
  buyingPower: number;
  currency: string;
}

export interface IBKRPosition {
  conid: number;
  symbol: string;
  position: number;
  marketValue: number;
  avgCost: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface IBKROrder {
  orderId: string;
  conid: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MKT' | 'LMT' | 'STP' | 'STP_LIMIT';
  quantity: number;
  filledQuantity: number;
  price?: number;
  status: string;
  filledAt?: string;
}

export interface IBKRQuote {
  conid: number;
  symbol: string;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  change: number;
  changePercent: number;
}

// Gateway URL is now dynamic - fetched per request
const getUrl = () => getGatewayUrl();

class IBKRClient {
  private authenticated = false;
  private accountId: string | null = null;

  /**
   * Check if gateway is running and authenticated
   */
  async checkConnection(): Promise<{ connected: boolean; authenticated: boolean; paperTrading: boolean }> {
    try {
      const response = await fetch(`${getUrl()}/iserver/auth/status`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        return { connected: true, authenticated: false, paperTrading: false };
      }

      const data = await response.json();
      this.authenticated = data.authenticated === true;
      
      return {
        connected: true,
        authenticated: this.authenticated,
        paperTrading: data.competing === false, // Paper accounts don't compete
      };
    } catch (err) {
      console.log('[IBKR] Gateway not available:', (err as Error).message);
      return { connected: false, authenticated: false, paperTrading: false };
    }
  }

  /**
   * Get all accounts (paper + live)
   */
  async getAccounts(): Promise<IBKRAccount[]> {
    try {
      const response = await fetch(`${getUrl()}/portfolio/accounts`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch accounts');
      
      const accounts = await response.json();
      
      // Get summary for each account
      const accountsWithBalance = await Promise.all(
        accounts.map(async (acc: any) => {
          try {
            const summaryRes = await fetch(`${getUrl()}/portfolio/${acc.accountId}/summary`, {
              credentials: 'include',
            });
            const summary = summaryRes.ok ? await summaryRes.json() : {};
            
            return {
              accountId: acc.accountId,
              accountType: acc.type || 'Unknown',
              balance: summary.netliquidation?.amount || 0,
              buyingPower: summary.buyingpower?.amount || 0,
              currency: summary.netliquidation?.currency || 'USD',
            };
          } catch {
            return {
              accountId: acc.accountId,
              accountType: acc.type || 'Unknown',
              balance: 0,
              buyingPower: 0,
              currency: 'USD',
            };
          }
        })
      );
      
      // Store first account ID for convenience
      if (accountsWithBalance.length > 0) {
        this.accountId = accountsWithBalance[0].accountId;
      }
      
      return accountsWithBalance;
    } catch (err) {
      console.error('[IBKR] Get accounts error:', err);
      return [];
    }
  }

  /**
   * Get positions for an account
   */
  async getPositions(accountId?: string): Promise<IBKRPosition[]> {
    const accId = accountId || this.accountId;
    if (!accId) return [];

    try {
      const response = await fetch(`${getUrl()}/portfolio/${accId}/positions/0`, {
        credentials: 'include',
      });
      
      if (!response.ok) return [];
      
      const positions = await response.json();
      
      return positions.map((pos: any) => ({
        conid: pos.conid,
        symbol: pos.contractDesc || pos.ticker || 'Unknown',
        position: pos.position,
        marketValue: pos.mktValue,
        avgCost: pos.avgCost,
        unrealizedPnl: pos.unrealizedPnl || 0,
        realizedPnl: pos.realizedPnl || 0,
      }));
    } catch (err) {
      console.error('[IBKR] Get positions error:', err);
      return [];
    }
  }

  /**
   * Search for a contract by symbol
   */
  async searchContract(symbol: string): Promise<{ conid: number; symbol: string; description: string }[]> {
    try {
      const response = await fetch(
        `${getUrl()}/iserver/secdef/search?symbol=${encodeURIComponent(symbol)}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) return [];
      
      const results = await response.json();
      
      return results.map((r: any) => ({
        conid: r.conid,
        symbol: r.symbol,
        description: r.description || r.companyName || '',
      }));
    } catch (err) {
      console.error('[IBKR] Search contract error:', err);
      return [];
    }
  }

  /**
   * Get market quote for a conid
   */
  async getQuote(conid: number): Promise<IBKRQuote | null> {
    try {
      const response = await fetch(
        `${getUrl()}/iserver/marketdata/snapshot?conids=${conid}&fields=31,84,85,86,87,88`,
        { credentials: 'include' }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const quote = data[0];
      
      if (!quote) return null;
      
      return {
        conid,
        symbol: quote['55'] || '',
        lastPrice: parseFloat(quote['31']) || 0,
        bid: parseFloat(quote['84']) || 0,
        ask: parseFloat(quote['86']) || 0,
        volume: parseInt(quote['87']) || 0,
        change: parseFloat(quote['82']) || 0,
        changePercent: parseFloat(quote['83']) || 0,
      };
    } catch (err) {
      console.error('[IBKR] Get quote error:', err);
      return null;
    }
  }

  /**
   * Place an order
   */
  async placeOrder(params: {
    accountId?: string;
    conid: number;
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MKT' | 'LMT';
    price?: number;
    tif?: 'GTC' | 'DAY' | 'IOC';
  }): Promise<{ orderId: string; status: string } | null> {
    const accId = params.accountId || this.accountId;
    if (!accId) {
      console.error('[IBKR] No account ID for order');
      return null;
    }

    try {
      const orderPayload = {
        orders: [{
          conid: params.conid,
          orderType: params.orderType,
          side: params.side,
          quantity: params.quantity,
          tif: params.tif || 'GTC',
          ...(params.orderType === 'LMT' && params.price ? { price: params.price } : {}),
        }]
      };

      const response = await fetch(`${getUrl()}/iserver/account/${accId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderPayload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[IBKR] Order failed:', errorText);
        return null;
      }
      
      const result = await response.json();
      
      // IBKR returns order confirmation that may need to be confirmed
      if (result[0]?.id && result[0]?.message?.includes('confirm')) {
        // Auto-confirm the order
        const confirmRes = await fetch(`${getUrl()}/iserver/reply/${result[0].id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ confirmed: true }),
        });
        
        if (confirmRes.ok) {
          const confirmed = await confirmRes.json();
          return {
            orderId: confirmed[0]?.order_id || result[0].id,
            status: 'submitted',
          };
        }
      }
      
      return {
        orderId: result[0]?.order_id || 'ibkr-' + Date.now(),
        status: 'submitted',
      };
    } catch (err) {
      console.error('[IBKR] Place order error:', err);
      return null;
    }
  }

  /**
   * Get open orders
   */
  async getOrders(): Promise<IBKROrder[]> {
    try {
      const response = await fetch(`${getUrl()}/iserver/account/orders`, {
        credentials: 'include',
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      const orders = data.orders || data;
      
      return orders.map((o: any) => ({
        orderId: o.orderId,
        conid: o.conid,
        symbol: o.ticker || o.symbol || '',
        side: o.side,
        orderType: o.orderType,
        quantity: o.totalSize || o.quantity,
        filledQuantity: o.filledQuantity || 0,
        price: o.price,
        status: o.status,
        filledAt: o.lastFillTime,
      }));
    } catch (err) {
      console.error('[IBKR] Get orders error:', err);
      return [];
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(accountId: string, orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`${getUrl()}/iserver/account/${accountId}/order/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      return response.ok;
    } catch (err) {
      console.error('[IBKR] Cancel order error:', err);
      return false;
    }
  }

  /**
   * Keep session alive (call every 5 minutes)
   */
  async tickle(): Promise<boolean> {
    try {
      const response = await fetch(`${getUrl()}/tickle`, {
        method: 'POST',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const ibkrClient = new IBKRClient();

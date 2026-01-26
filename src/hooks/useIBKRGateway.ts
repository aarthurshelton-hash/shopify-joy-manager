/**
 * IBKR Gateway Hook
 * 
 * Manages connection to IBKR Client Portal Gateway for real paper trading.
 * No simulation fallback - requires actual IBKR connection.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ibkrClient, IBKRAccount, IBKRPosition, IBKROrder } from '@/lib/trading/ibkrClient';
import { useToast } from '@/hooks/use-toast';

export interface IBKRGatewayState {
  connected: boolean;
  authenticated: boolean;
  paperTrading: boolean;
  accounts: IBKRAccount[];
  selectedAccount: IBKRAccount | null;
  positions: IBKRPosition[];
  orders: IBKROrder[];
  loading: boolean;
  error: string | null;
}

export function useIBKRGateway() {
  const [state, setState] = useState<IBKRGatewayState>({
    connected: false,
    authenticated: false,
    paperTrading: false,
    accounts: [],
    selectedAccount: null,
    positions: [],
    orders: [],
    loading: true,
    error: null,
  });

  const tickleInterval = useRef<NodeJS.Timeout | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check gateway connection with timeout
  const checkConnection = useCallback(async () => {
    console.log('[IBKR] Checking gateway connection...');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // Set a timeout to ensure we don't stay loading forever
    const timeoutId = setTimeout(() => {
      console.warn('[IBKR] Connection check timed out after 5s');
      setState(prev => ({
        ...prev,
        connected: false,
        authenticated: false,
        loading: false,
        error: 'Connection timed out. The gateway may not be running or the browser is blocking the connection.',
      }));
    }, 5000);
    
    try {
      const status = await ibkrClient.checkConnection();
      clearTimeout(timeoutId);
      
      console.log('[IBKR] Connection status:', status);
      
      setState(prev => ({
        ...prev,
        connected: status.connected,
        authenticated: status.authenticated,
        paperTrading: status.paperTrading,
        loading: false,
        error: status.connected ? null : 'Gateway not running. Start IBKR Client Portal Gateway.',
      }));

      return status;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[IBKR] Connection error:', err);
      
      setState(prev => ({
        ...prev,
        connected: false,
        authenticated: false,
        loading: false,
        error: `Failed to connect: ${(err as Error).message}. Try opening https://localhost:5000 directly first.`,
      }));
      return { connected: false, authenticated: false, paperTrading: false };
    }
  }, []);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    const accounts = await ibkrClient.getAccounts();
    
    // Find paper trading account (usually has 'DU' prefix or 'Paper' type)
    const paperAccount = accounts.find(
      a => a.accountId.startsWith('DU') || 
           a.accountType.toLowerCase().includes('paper') ||
           a.accountType.toLowerCase().includes('demo')
    );
    
    setState(prev => ({
      ...prev,
      accounts,
      selectedAccount: paperAccount || accounts[0] || null,
    }));

    return accounts;
  }, []);

  // Load positions for selected account
  const loadPositions = useCallback(async () => {
    if (!state.selectedAccount) return [];
    
    const positions = await ibkrClient.getPositions(state.selectedAccount.accountId);
    setState(prev => ({ ...prev, positions }));
    return positions;
  }, [state.selectedAccount]);

  // Load orders
  const loadOrders = useCallback(async () => {
    const orders = await ibkrClient.getOrders();
    setState(prev => ({ ...prev, orders }));
    return orders;
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!state.authenticated) return;
    
    await Promise.all([
      loadAccounts(),
      loadPositions(),
      loadOrders(),
    ]);
  }, [state.authenticated, loadAccounts, loadPositions, loadOrders]);

  // Place order
  const placeOrder = useCallback(async (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MKT' | 'LMT';
    price?: number;
  }) => {
    if (!state.selectedAccount) {
      toast({
        title: 'No Account Selected',
        description: 'Please select an IBKR account first.',
        variant: 'destructive',
      });
      return null;
    }

    const contracts = await ibkrClient.searchContract(params.symbol);
    if (contracts.length === 0) {
      toast({
        title: 'Symbol Not Found',
        description: `Could not find contract for ${params.symbol}`,
        variant: 'destructive',
      });
      return null;
    }

    const conid = contracts[0].conid;

    const result = await ibkrClient.placeOrder({
      accountId: state.selectedAccount.accountId,
      conid,
      side: params.side,
      quantity: params.quantity,
      orderType: params.orderType,
      price: params.price,
    });

    if (result) {
      toast({
        title: 'Order Placed',
        description: `${params.side} ${params.quantity} ${params.symbol} - ${result.status}`,
      });
      await loadOrders();
    } else {
      toast({
        title: 'Order Failed',
        description: 'Could not place order. Check gateway connection.',
        variant: 'destructive',
      });
    }

    return result;
  }, [state.selectedAccount, toast, loadOrders]);

  // Cancel order
  const cancelOrder = useCallback(async (orderId: string) => {
    if (!state.selectedAccount) return false;
    
    const success = await ibkrClient.cancelOrder(state.selectedAccount.accountId, orderId);
    
    if (success) {
      toast({
        title: 'Order Cancelled',
        description: `Order ${orderId} has been cancelled.`,
      });
      await loadOrders();
    }
    
    return success;
  }, [state.selectedAccount, toast, loadOrders]);

  // Select account
  const selectAccount = useCallback((accountId: string) => {
    const account = state.accounts.find(a => a.accountId === accountId);
    if (account) {
      setState(prev => ({ ...prev, selectedAccount: account }));
    }
  }, [state.accounts]);

  // Initialize and maintain connection
  useEffect(() => {
    const init = async () => {
      const status = await checkConnection();
      
      if (status.authenticated) {
        await loadAccounts();
        await loadPositions();
        await loadOrders();
        
        // Start tickle interval to keep session alive (every 5 min)
        tickleInterval.current = setInterval(() => {
          ibkrClient.tickle();
        }, 5 * 60 * 1000);
        
        // Start data refresh interval (every 10 sec)
        refreshInterval.current = setInterval(() => {
          refreshData();
        }, 10000);
      }
    };

    init();

    return () => {
      if (tickleInterval.current) clearInterval(tickleInterval.current);
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  // Reload positions when account changes
  useEffect(() => {
    if (state.selectedAccount && state.authenticated) {
      loadPositions();
    }
  }, [state.selectedAccount?.accountId]);

  return {
    ...state,
    checkConnection,
    loadAccounts,
    loadPositions,
    loadOrders,
    refreshData,
    placeOrder,
    cancelOrder,
    selectAccount,
  };
}

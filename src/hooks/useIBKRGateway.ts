/**
 * IB Gateway Hook
 * 
 * Manages connection to IB Gateway through local bridge.
 * No simulation - requires actual IB Gateway connection via bridge.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ibGatewayClient, IBAccount, IBPosition, IBOrder } from '@/lib/trading/ibGatewayClient';
import { useToast } from '@/hooks/use-toast';

export interface IBGatewayState {
  connected: boolean;
  authenticated: boolean;
  paperTrading: boolean;
  accounts: IBAccount[];
  selectedAccount: IBAccount | null;
  positions: IBPosition[];
  orders: IBOrder[];
  loading: boolean;
  error: string | null;
}

export function useIBKRGateway() {
  const [state, setState] = useState<IBGatewayState>({
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

  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check bridge and gateway connection
  const checkConnection = useCallback(async () => {
    console.log('[IB Gateway] Checking connection...');
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const timeoutId = setTimeout(() => {
      console.warn('[IB Gateway] Connection check timed out');
      setState(prev => ({
        ...prev,
        connected: false,
        authenticated: false,
        loading: false,
        error: 'Connection timed out. Ensure the bridge server is running.',
      }));
    }, 8000);
    
    try {
      const status = await ibGatewayClient.checkConnection();
      clearTimeout(timeoutId);
      
      console.log('[IB Gateway] Status:', status);
      
      setState(prev => ({
        ...prev,
        connected: status.connected,
        authenticated: status.authenticated,
        paperTrading: status.paperTrading,
        loading: false,
        error: status.connected 
          ? (status.authenticated ? null : 'Bridge running but not connected to IB Gateway. Click "Connect to Gateway".')
          : 'Bridge not running. Start the local bridge server first.',
      }));

      return status;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[IB Gateway] Connection error:', err);
      
      setState(prev => ({
        ...prev,
        connected: false,
        authenticated: false,
        loading: false,
        error: `Failed to connect: ${(err as Error).message}`,
      }));
      return { connected: false, authenticated: false, paperTrading: false };
    }
  }, []);

  // Connect bridge to IB Gateway
  const connectToGateway = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const success = await ibGatewayClient.connect();
      
      if (success) {
        toast({
          title: 'Connected',
          description: 'Successfully connected to IB Gateway',
        });
        await checkConnection();
        await loadAccounts();
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to connect. Ensure IB Gateway is running and API is enabled.',
        }));
      }
      
      return success;
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Connection failed: ${(err as Error).message}`,
      }));
      return false;
    }
  }, [toast, checkConnection]);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    const accounts = await ibGatewayClient.getAccounts();
    
    const paperAccount = accounts.find(
      a => a.accountId.startsWith('DU') || 
           a.accountType.toLowerCase().includes('paper')
    );
    
    setState(prev => ({
      ...prev,
      accounts,
      selectedAccount: paperAccount || accounts[0] || null,
    }));

    return accounts;
  }, []);

  // Load positions
  const loadPositions = useCallback(async () => {
    if (!state.selectedAccount) return [];
    
    const positions = await ibGatewayClient.getPositions(state.selectedAccount.accountId);
    setState(prev => ({ ...prev, positions }));
    return positions;
  }, [state.selectedAccount]);

  // Load orders
  const loadOrders = useCallback(async () => {
    const orders = await ibGatewayClient.getOrders();
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
        description: 'Please select an account first.',
        variant: 'destructive',
      });
      return null;
    }

    // Search for contract
    const contracts = await ibGatewayClient.searchContract(params.symbol);
    if (contracts.length === 0) {
      toast({
        title: 'Symbol Not Found',
        description: `Could not find contract for ${params.symbol}`,
        variant: 'destructive',
      });
      return null;
    }

    const contract = contracts[0];

    const result = await ibGatewayClient.placeOrder({
      accountId: state.selectedAccount.accountId,
      conid: contract.conid,
      symbol: params.symbol,
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
    const success = await ibGatewayClient.cancelOrder(orderId);
    
    if (success) {
      toast({
        title: 'Order Cancelled',
        description: `Order ${orderId} has been cancelled.`,
      });
      await loadOrders();
    }
    
    return success;
  }, [toast, loadOrders]);

  // Select account
  const selectAccount = useCallback((accountId: string) => {
    const account = state.accounts.find(a => a.accountId === accountId);
    if (account) {
      setState(prev => ({ ...prev, selectedAccount: account }));
    }
  }, [state.accounts]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const status = await checkConnection();
      
      if (status.authenticated) {
        await loadAccounts();
        await loadPositions();
        await loadOrders();
        
        // Refresh data every 10 seconds
        refreshInterval.current = setInterval(() => {
          refreshData();
        }, 10000);
      }
    };

    init();

    return () => {
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
    connectToGateway,
    loadAccounts,
    loadPositions,
    loadOrders,
    refreshData,
    placeOrder,
    cancelOrder,
    selectAccount,
  };
}

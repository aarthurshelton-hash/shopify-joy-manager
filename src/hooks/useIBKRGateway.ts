/**
 * IBKR Gateway Hook with Simulated Trading Fallback
 * 
 * Manages connection to IBKR gateway with automatic fallback
 * to simulated paper trading when gateway is unavailable.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ibkrClient, IBKRAccount, IBKRPosition, IBKROrder } from '@/lib/trading/ibkrClient';
import { 
  getSimulatedAccount, 
  getSimulatedPositions, 
  getSimulatedOrders,
  placeSimulatedOrder,
  cancelSimulatedOrder,
  resetSimulatedAccount,
} from '@/lib/trading/simulatedTrading';
import { useToast } from '@/hooks/use-toast';

export type TradingMode = 'ibkr' | 'simulated';

export interface IBKRGatewayState {
  connected: boolean;
  authenticated: boolean;
  paperTrading: boolean;
  tradingMode: TradingMode;
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
    tradingMode: 'simulated', // Default to simulated
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

  // Switch to simulated trading mode
  const enableSimulatedMode = useCallback(() => {
    console.log('[IBKR] Switching to simulated trading mode');
    const simAccount = getSimulatedAccount();
    const simPositions = getSimulatedPositions();
    const simOrders = getSimulatedOrders();
    
    setState(prev => ({
      ...prev,
      connected: true,
      authenticated: true,
      paperTrading: true,
      tradingMode: 'simulated' as TradingMode,
      loading: false,
      error: null,
      accounts: [{
        accountId: simAccount.accountId,
        accountType: simAccount.accountType,
        balance: simAccount.balance,
        buyingPower: simAccount.buyingPower,
        currency: 'USD',
      }],
      selectedAccount: {
        accountId: simAccount.accountId,
        accountType: simAccount.accountType,
        balance: simAccount.balance,
        buyingPower: simAccount.buyingPower,
        currency: 'USD',
      },
      positions: simPositions.map(p => ({
        ...p,
        realizedPnl: 0,
      })),
      orders: simOrders.map(o => ({
        orderId: o.orderId,
        conid: 0,
        symbol: o.symbol,
        side: o.side,
        orderType: o.orderType as 'MKT' | 'LMT' | 'STP' | 'STP_LIMIT',
        quantity: o.quantity,
        filledQuantity: o.filledQuantity,
        status: o.status,
        price: o.price,
      })),
    }));
    
    toast({
      title: 'Simulated Trading Active',
      description: 'Using local simulation. Start with $1,000!',
    });
  }, [toast]);

  // Check gateway connection with timeout
  const checkConnection = useCallback(async () => {
    console.log('[IBKR] Checking gateway connection...');
    
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

  // Refresh all data (works for both modes)
  const refreshData = useCallback(async () => {
    if (state.tradingMode === 'simulated') {
      const simAccount = getSimulatedAccount();
      const simPositions = getSimulatedPositions();
      const simOrders = getSimulatedOrders();
      
      setState(prev => ({
        ...prev,
        accounts: [{
          accountId: simAccount.accountId,
          accountType: simAccount.accountType,
          balance: simAccount.balance,
          buyingPower: simAccount.buyingPower,
          currency: 'USD',
        }],
        selectedAccount: {
          accountId: simAccount.accountId,
          accountType: simAccount.accountType,
          balance: simAccount.balance,
          buyingPower: simAccount.buyingPower,
          currency: 'USD',
        },
        positions: simPositions.map(p => ({ ...p, realizedPnl: 0 })),
        orders: simOrders.map(o => ({
          orderId: o.orderId,
          conid: 0,
          symbol: o.symbol,
          side: o.side,
          orderType: o.orderType as 'MKT' | 'LMT' | 'STP' | 'STP_LIMIT',
          quantity: o.quantity,
          filledQuantity: o.filledQuantity,
          status: o.status,
          price: o.price,
        })),
      }));
      return;
    }
    
    if (!state.authenticated) return;
    
    await Promise.all([
      loadAccounts(),
      loadPositions(),
      loadOrders(),
    ]);
  }, [state.tradingMode, state.authenticated, loadAccounts, loadPositions, loadOrders]);

  // Place order (works for both modes)
  const placeOrder = useCallback(async (params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MKT' | 'LMT';
    price?: number;
  }) => {
    // Simulated mode
    if (state.tradingMode === 'simulated') {
      const result = placeSimulatedOrder({
        symbol: params.symbol,
        side: params.side,
        quantity: params.quantity,
        orderType: params.orderType,
        price: params.price,
      });
      
      if (result) {
        toast({
          title: 'Order Executed',
          description: `${params.side} ${params.quantity} ${params.symbol} @ $${result.price?.toFixed(2)}`,
        });
        refreshData();
      } else {
        toast({
          title: 'Order Failed',
          description: 'Insufficient funds or shares.',
          variant: 'destructive',
        });
      }
      
      return result ? { orderId: result.orderId, status: result.status } : null;
    }
    
    // IBKR mode
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
  }, [state.tradingMode, state.selectedAccount, toast, loadOrders, refreshData]);

  // Cancel order (works for both modes)
  const cancelOrder = useCallback(async (orderId: string) => {
    if (state.tradingMode === 'simulated') {
      const success = cancelSimulatedOrder(orderId);
      if (success) {
        toast({
          title: 'Order Cancelled',
          description: `Order ${orderId} has been cancelled.`,
        });
        refreshData();
      }
      return success;
    }
    
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
  }, [state.tradingMode, state.selectedAccount, toast, loadOrders, refreshData]);

  // Reset simulated account
  const resetAccount = useCallback(() => {
    if (state.tradingMode === 'simulated') {
      resetSimulatedAccount();
      enableSimulatedMode();
      toast({
        title: 'Account Reset',
        description: 'Starting fresh with $1,000!',
      });
    }
  }, [state.tradingMode, enableSimulatedMode, toast]);

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
    enableSimulatedMode,
    resetAccount,
  };
}

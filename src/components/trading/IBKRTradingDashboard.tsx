/**
 * IBKR Trading Dashboard
 * 
 * Unified dashboard for Interactive Brokers paper/live trading.
 * Integrates En Pensent predictions with IBKR order execution.
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useIBKRGateway } from '@/hooks/useIBKRGateway';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  Target,
  Activity,
  Briefcase,
  ShoppingCart,
  History,
  BarChart3,
  Zap,
} from 'lucide-react';

// Tracked symbols for quick trading
const QUICK_SYMBOLS = ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META'];

interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export function IBKRTradingDashboard() {
  const {
    connected,
    authenticated,
    paperTrading,
    accounts,
    selectedAccount,
    positions,
    orders,
    loading,
    error,
    checkConnection,
    refreshData,
    placeOrder,
    cancelOrder,
    selectAccount,
  } = useIBKRGateway();

  const [activeTab, setActiveTab] = useState('overview');
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  
  // Order form state
  const [orderForm, setOrderForm] = useState({
    symbol: 'SPY',
    side: 'BUY' as 'BUY' | 'SELL',
    quantity: 1,
    orderType: 'MKT' as 'MKT' | 'LMT',
    price: 0,
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Load quotes for quick symbols
  useEffect(() => {
    if (authenticated) {
      loadQuotes();
      const interval = setInterval(loadQuotes, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const loadQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const { data, error } = await supabase.functions.invoke('stock-data', {
        body: { action: 'batch', symbols: QUICK_SYMBOLS }
      });
      
      if (!error && data?.stocks) {
        setQuotes(data.stocks.map((s: any) => ({
          symbol: s.symbol,
          price: s.latestPrice,
          change: s.change,
          changePercent: s.changePercent,
        })));
      }
    } catch (err) {
      console.error('[IBKR] Quote load error:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    await placeOrder({
      symbol: orderForm.symbol,
      side: orderForm.side,
      quantity: orderForm.quantity,
      orderType: orderForm.orderType,
      price: orderForm.orderType === 'LMT' ? orderForm.price : undefined,
    });
    setIsPlacingOrder(false);
  };

  const handleQuickBuy = (symbol: string) => {
    setOrderForm(prev => ({ ...prev, symbol, side: 'BUY' }));
    setActiveTab('trade');
  };

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
    const totalPnL = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const totalRealizedPnL = positions.reduce((sum, p) => sum + p.realizedPnl, 0);
    
    return {
      totalValue,
      totalPnL,
      totalRealizedPnL,
      pnlPercent: selectedAccount?.balance ? (totalPnL / selectedAccount.balance) * 100 : 0,
    };
  }, [positions, selectedAccount]);

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting to IBKR Gateway...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Looking for the Client Portal Gateway on localhost:5000
          </p>
        </CardContent>
      </Card>
    );
  }

  // ========== NOT CONNECTED STATE ==========
  if (!connected) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <WifiOff className="h-5 w-5" />
            IBKR Gateway Not Running
          </CardTitle>
          <CardDescription>
            Start the IBKR Client Portal Gateway to begin trading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Quick Setup (3 minutes)</AlertTitle>
            <AlertDescription className="space-y-2">
              <ol className="list-decimal list-inside space-y-2 mt-2">
                <li>
                  Download the <a 
                    href="https://www.interactivebrokers.com/en/trading/ib-api.php" 
                    target="_blank" 
                    rel="noopener" 
                    className="text-primary underline font-medium"
                  >
                    IBKR Client Portal Gateway
                  </a>
                </li>
                <li>
                  Extract and run <code className="bg-muted px-1 rounded text-sm">bin/run.sh</code> (Mac) 
                  or <code className="bg-muted px-1 rounded text-sm">bin/run.bat</code> (Windows)
                </li>
                <li>
                  Open <a 
                    href="https://localhost:5000" 
                    target="_blank" 
                    rel="noopener" 
                    className="text-primary underline font-medium"
                  >
                    https://localhost:5000
                  </a> and login with IBKR credentials
                </li>
                <li>Select your <strong>Paper Trading</strong> account</li>
                <li>Accept the self-signed certificate warning in your browser</li>
              </ol>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button onClick={checkConnection} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open('https://localhost:5000', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Gateway
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ========== NOT AUTHENTICATED STATE ==========
  if (!authenticated) {
    return (
      <Card className="border-warning/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <Wifi className="h-5 w-5" />
            Gateway Running - Login Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The gateway is running but needs authentication. 
              Login to your IBKR account to start trading.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => window.open('https://localhost:5000', '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Login to IBKR
            </Button>
            
            <Button variant="outline" onClick={checkConnection}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ========== CONNECTED & AUTHENTICATED ==========
  return (
    <div className="space-y-6">
      {/* Account Header */}
      <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Connection Status & Account Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-medium">IBKR Connected</span>
                {paperTrading && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                    Paper Trading
                  </Badge>
                )}
              </div>
              
              <Select 
                value={selectedAccount?.accountId || ''} 
                onValueChange={selectAccount}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.accountId} value={acc.accountId}>
                      {acc.accountId} ({acc.accountType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="icon" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Account Balance */}
            {selectedAccount && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Account Balance
                  </div>
                  <div className="text-3xl font-mono font-bold">
                    ${selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Buying Power</div>
                  <div className="text-xl font-mono">
                    ${selectedAccount.buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Portfolio Stats */}
          {positions.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Positions Value</div>
                <div className="text-xl font-bold">
                  ${portfolioStats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unrealized P&L</div>
                <div className={`text-xl font-bold ${portfolioStats.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {portfolioStats.totalPnL >= 0 ? '+' : ''}${portfolioStats.totalPnL.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Realized P&L</div>
                <div className={`text-xl font-bold ${portfolioStats.totalRealizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {portfolioStats.totalRealizedPnL >= 0 ? '+' : ''}${portfolioStats.totalRealizedPnL.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Open Positions</div>
                <div className="text-xl font-bold">{positions.length}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="trade" className="flex items-center gap-1">
            <ShoppingCart className="w-4 h-4" /> Trade
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" /> Positions
            {positions.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {positions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-1">
            <History className="w-4 h-4" /> Orders
            {orders.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {orders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Trade Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Trade
                </CardTitle>
                <CardDescription>
                  Click a symbol to start a trade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {quotes.length > 0 ? quotes.map(q => (
                    <Button
                      key={q.symbol}
                      variant="outline"
                      className="flex flex-col h-auto py-3 hover:border-primary"
                      onClick={() => handleQuickBuy(q.symbol)}
                    >
                      <span className="font-bold">{q.symbol}</span>
                      <span className="text-sm">${q.price.toFixed(2)}</span>
                      <span className={`text-xs ${q.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                      </span>
                    </Button>
                  )) : QUICK_SYMBOLS.map(symbol => (
                    <Button
                      key={symbol}
                      variant="outline"
                      className="py-6"
                      onClick={() => handleQuickBuy(symbol)}
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
                {loadingQuotes && (
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Updating quotes...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Positions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Current Positions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No open positions</p>
                    <p className="text-sm">Place a trade to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.slice(0, 5).map(pos => (
                      <div key={pos.conid} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">{pos.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {pos.position > 0 ? '+' : ''}{pos.position} shares @ ${pos.avgCost.toFixed(2)}
                          </div>
                        </div>
                        <div className={`text-right ${pos.unrealizedPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          <div className="font-medium">
                            {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                          </div>
                          <div className="text-sm">
                            ${pos.marketValue.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {positions.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => setActiveTab('positions')}
                      >
                        View all {positions.length} positions
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== TRADE TAB ========== */}
        <TabsContent value="trade" className="mt-6">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
              <CardDescription>
                Execute trades through your IBKR {paperTrading ? 'paper' : 'live'} account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Symbol</label>
                  <Input 
                    value={orderForm.symbol}
                    onChange={e => setOrderForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    placeholder="SPY"
                    className="text-lg font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input 
                    type="number"
                    value={orderForm.quantity}
                    onChange={e => setOrderForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    min={1}
                    className="text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Side</label>
                  <Select 
                    value={orderForm.side}
                    onValueChange={(v: 'BUY' | 'SELL') => setOrderForm(prev => ({ ...prev, side: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-success" />
                          Buy
                        </span>
                      </SelectItem>
                      <SelectItem value="SELL">
                        <span className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-destructive" />
                          Sell
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Type</label>
                  <Select 
                    value={orderForm.orderType}
                    onValueChange={(v: 'MKT' | 'LMT') => setOrderForm(prev => ({ ...prev, orderType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MKT">Market</SelectItem>
                      <SelectItem value="LMT">Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {orderForm.orderType === 'LMT' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Limit Price</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={orderForm.price}
                    onChange={e => setOrderForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="text-lg font-mono"
                  />
                </div>
              )}

              <Button 
                className={`w-full h-12 text-lg ${orderForm.side === 'BUY' ? 'bg-success hover:bg-success/90 text-success-foreground' : 'bg-destructive hover:bg-destructive/90'}`}
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : orderForm.side === 'BUY' ? (
                  <TrendingUp className="h-5 w-5 mr-2" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-2" />
                )}
                {orderForm.side} {orderForm.quantity} {orderForm.symbol}
              </Button>

              {orderForm.orderType === 'MKT' && (
                <p className="text-xs text-muted-foreground text-center">
                  Market orders execute immediately at the best available price
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== POSITIONS TAB ========== */}
        <TabsContent value="positions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Open Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {positions.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No open positions</p>
                  <p className="text-sm">Your positions will appear here after you place trades</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab('trade')}
                  >
                    Place a Trade
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                      <TableHead className="text-right">Unrealized P&L</TableHead>
                      <TableHead className="text-right">Realized P&L</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map(pos => (
                      <TableRow key={pos.conid}>
                        <TableCell className="font-bold">{pos.symbol}</TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={pos.position > 0 ? 'text-success' : 'text-destructive'}>
                            {pos.position > 0 ? '+' : ''}{pos.position}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${pos.avgCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${pos.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-medium ${pos.unrealizedPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${pos.realizedPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {pos.realizedPnl >= 0 ? '+' : ''}${pos.realizedPnl.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setOrderForm({
                                symbol: pos.symbol,
                                side: 'SELL',
                                quantity: Math.abs(pos.position),
                                orderType: 'MKT',
                                price: 0,
                              });
                              setActiveTab('trade');
                            }}
                          >
                            Close
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ORDERS TAB ========== */}
        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Open Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No open orders</p>
                  <p className="text-sm">Pending and working orders will appear here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Filled</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-bold">{order.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={order.side === 'BUY' ? 'default' : 'destructive'}>
                            {order.side}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.orderType}</TableCell>
                        <TableCell className="text-right font-mono">{order.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{order.filledQuantity}</TableCell>
                        <TableCell className="text-right font-mono">
                          {order.price ? `$${order.price.toFixed(2)}` : 'MKT'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => cancelOrder(order.orderId)}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

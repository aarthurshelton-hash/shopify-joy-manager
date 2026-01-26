/**
 * IBKR Paper Trading Panel
 * 
 * UI for connecting to and trading with Interactive Brokers
 * via the Client Portal Gateway running locally.
 * Real IBKR connection only - no simulation.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIBKRGateway } from '@/hooks/useIBKRGateway';
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
  Terminal,
} from 'lucide-react';

export function IBKRPaperTradingPanel() {
  const {
    connected,
    authenticated,
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

  const [orderForm, setOrderForm] = useState({
    symbol: 'SPY',
    side: 'BUY' as 'BUY' | 'SELL',
    quantity: 1,
    orderType: 'MKT' as 'MKT' | 'LMT',
    price: 0,
  });
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting to IBKR Gateway...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <WifiOff className="h-5 w-5" />
            IBKR Gateway Not Connected
          </CardTitle>
          <CardDescription>
            The Client Portal Gateway must be running on your local machine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Setup Instructions</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p><strong>1.</strong> Download IBKR Client Portal Gateway from IBKR website</p>
              <p><strong>2.</strong> Open Terminal and run:</p>
              <code className="block bg-muted p-2 rounded text-xs mt-1">
                cd ~/Downloads/clientportal && bin/run.sh root/conf.yaml
              </code>
              <p><strong>3.</strong> Open <code className="bg-muted px-1">https://localhost:5000</code> in Chrome</p>
              <p><strong>4.</strong> Accept the security warning and login with paper trading credentials</p>
              <p><strong>5.</strong> Return here and click "Retry Connection"</p>
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

  if (!authenticated) {
    return (
      <Card className="border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-500">
            <Wifi className="h-5 w-5" />
            Gateway Running - Login Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The gateway is running but you need to login. Click below to open the login page.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => window.open('https://localhost:5000', '_blank')}
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Login to IBKR Gateway
          </Button>
          
          <Button variant="outline" onClick={checkConnection} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Authentication
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="h-5 w-5" />
              IBKR Connected
              <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary">
                Paper Trading
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select 
                value={selectedAccount?.accountId || ''} 
                onValueChange={selectAccount}
              >
                <SelectTrigger>
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
            </div>
            {selectedAccount && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className="text-xl font-bold">
                  ${selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trading Tabs */}
      <Tabs defaultValue="trade" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="positions">
            Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* Trade Tab */}
        <TabsContent value="trade">
          <Card>
            <CardHeader>
              <CardTitle>Place Order</CardTitle>
              <CardDescription>
                Execute paper trades through IBKR
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input 
                    type="number"
                    value={orderForm.quantity}
                    onChange={e => setOrderForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    min={1}
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
                      <SelectItem value="BUY">Buy</SelectItem>
                      <SelectItem value="SELL">Sell</SelectItem>
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
                  />
                </div>
              )}

              <Button 
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : orderForm.side === 'BUY' ? (
                  <TrendingUp className="h-4 w-4 mr-2" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-2" />
                )}
                {orderForm.side} {orderForm.quantity} {orderForm.symbol}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardContent className="pt-6">
              {positions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No open positions
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map(pos => (
                      <TableRow key={pos.conid}>
                        <TableCell className="font-medium">{pos.symbol}</TableCell>
                        <TableCell className="text-right">
                          <span className={pos.position > 0 ? 'text-emerald-500' : 'text-destructive'}>
                            {pos.position > 0 ? '+' : ''}{pos.position}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          ${pos.avgCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${pos.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${pos.unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                          {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardContent className="pt-6">
              {orders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No open orders
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Filled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium">{order.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={order.side === 'BUY' ? 'default' : 'destructive'}>
                            {order.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{order.quantity}</TableCell>
                        <TableCell className="text-right">{order.filledQuantity}</TableCell>
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

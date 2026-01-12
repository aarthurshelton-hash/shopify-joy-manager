import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Loader2,
  History,
  Plus,
  Banknote,
} from 'lucide-react';
import { 
  getUserWallet, 
  getWalletTransactions, 
  UserWallet,
  WalletTransaction,
  formatBalance,
} from '@/lib/marketplace/walletApi';
import { getWithdrawableBalance } from '@/lib/marketplace/withdrawalApi';
import { formatDistanceToNow } from 'date-fns';
import { WalletDepositModal } from './WalletDepositModal';
import { WalletWithdrawModal } from './WalletWithdrawModal';

interface WalletCardProps {
  compact?: boolean;
}

const WalletCard: React.FC<WalletCardProps> = ({ compact = false }) => {
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setIsLoading(true);
    const [walletResult, transactionsResult, withdrawableResult] = await Promise.all([
      getUserWallet(),
      getWalletTransactions(20),
      getWithdrawableBalance(),
    ]);
    
    if (walletResult.data) {
      setWallet(walletResult.data);
    }
    if (transactionsResult.data) {
      setTransactions(transactionsResult.data);
    }
    setWithdrawableBalance(withdrawableResult.data);
    setIsLoading(false);
  };

  const getTransactionIcon = (type: WalletTransaction['transaction_type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      case 'sale':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'purchase':
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case 'platform_fee':
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: WalletTransaction['transaction_type']) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'sale': return 'Vision Sale';
      case 'purchase': return 'Vision Purchase';
      case 'platform_fee': return 'Platform Fee';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <>
        <Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Wallet Balance</p>
                  <p className="text-2xl font-bold">{formatBalance(wallet?.balance_cents || 0)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDepositModal(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  <History className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showHistory && transactions.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(tx.transaction_type)}
                      <span className="text-muted-foreground">{getTransactionLabel(tx.transaction_type)}</span>
                    </div>
                    <span className={tx.amount_cents >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {tx.amount_cents >= 0 ? '+' : ''}{formatBalance(tx.amount_cents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <WalletDepositModal open={showDepositModal} onOpenChange={setShowDepositModal} onSuccess={loadWalletData} />
        <WalletWithdrawModal open={showWithdrawModal} onOpenChange={setShowWithdrawModal} onSuccess={loadWalletData} />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Platform Wallet
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDepositModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Funds
            </Button>
            {withdrawableBalance > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowWithdrawModal(true)}>
                <Banknote className="h-4 w-4 mr-1" />
                Withdraw
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Balance Display */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-4xl font-bold">{formatBalance(wallet?.balance_cents || 0)}</p>
            
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary/20">
              <div>
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="text-lg font-semibold text-green-500">
                  {formatBalance(wallet?.total_earned_cents || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Withdrawable</p>
                <p className="text-lg font-semibold text-emerald-500">
                  {formatBalance(withdrawableBalance)}
                </p>
              </div>
              <div>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-lg font-semibold text-blue-500">
                {formatBalance(wallet?.total_spent_cents || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="text-xs">Deposited</span>
            </div>
            <p className="font-bold">{formatBalance(wallet?.total_deposited_cents || 0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-orange-500 mb-1">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-xs">Withdrawn</span>
            </div>
            <p className="font-bold">{formatBalance(wallet?.total_withdrawn_cents || 0)}</p>
          </div>
        </div>

          <Separator />

          {/* Transaction History */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Transactions
            </h4>
            
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transactions yet
              </p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {getTransactionIcon(tx.transaction_type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{getTransactionLabel(tx.transaction_type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.amount_cents >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.amount_cents >= 0 ? '+' : ''}{formatBalance(tx.amount_cents)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {formatBalance(tx.balance_after_cents)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Security info */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg space-y-2">
            <p className="font-medium">💡 How it works:</p>
            <ul className="space-y-1">
              <li>• <strong>Deposits:</strong> Add funds via Stripe to purchase visions</li>
              <li>• <strong>Earnings:</strong> Sell visions to earn credits (95% of sale price)</li>
              <li>• <strong>Withdrawals:</strong> Only earnings can be withdrawn (fraud protection)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <WalletDepositModal open={showDepositModal} onOpenChange={setShowDepositModal} onSuccess={loadWalletData} />
      <WalletWithdrawModal open={showWithdrawModal} onOpenChange={setShowWithdrawModal} onSuccess={loadWalletData} />
    </>
  );
};

export default WalletCard;

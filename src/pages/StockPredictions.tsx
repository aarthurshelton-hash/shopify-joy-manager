/**
 * IBKR Trading Dashboard
 * En Pensent™ Finance Module - Centered around Interactive Brokers Paper Trading
 * 
 * Simplified architecture: IBKR account is the source of truth for all trading.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { IBKRTradingDashboard } from '@/components/trading/IBKRTradingDashboard';

const StockPredictionDashboard: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Landmark className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">
            <span className="text-primary">En Pensent™</span> Trading
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Paper trading powered by Interactive Brokers. 
          Start with simulated funds, graduate to real money when ready.
        </p>
      </div>

      {/* Main IBKR Dashboard */}
      <ErrorBoundary componentName="IBKRTradingDashboard">
        <IBKRTradingDashboard />
      </ErrorBoundary>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        ⚠️ Paper trading uses simulated funds. No real money is at risk.
        When ready, switch to a live IBKR account for real trading.
      </p>
    </div>
  );
};

export default StockPredictionDashboard;

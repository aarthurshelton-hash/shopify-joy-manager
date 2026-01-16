/**
 * Simulated Positions Hook
 * Track $1000 paper trades with live P&L and correlative data
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { FUTURES_CONTRACTS, FuturesContract, getAllContracts } from '@/lib/pensent-core/domains/finance/futuresCorrelations';

export interface SimulatedPosition {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  entryTime: number;
  entryAmount: number; // Always $1000
  shares: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  correlatedAssets: CorrelatedAssetPnL[];
  peakPnl: number;
  troughPnl: number;
  status: 'open' | 'closed';
  closePrice?: number;
  closeTime?: number;
  closePnl?: number;
}

export interface CorrelatedAssetPnL {
  symbol: string;
  name: string;
  correlation: number;
  entryPrice: number;
  currentPrice: number;
  hypotheticalPnl: number; // If you had entered this instead
  pnlPercent: number;
  isAligned: boolean; // Moving in expected direction based on correlation
}

export interface PositionStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  bestTrade: number;
  worstTrade: number;
  currentOpenPnl: number;
}

const ENTRY_AMOUNT = 1000; // $1000 per position

export function useSimulatedPositions() {
  const [positions, setPositions] = useState<SimulatedPosition[]>([]);
  const [stats, setStats] = useState<PositionStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnl: 0,
    averagePnl: 0,
    bestTrade: 0,
    worstTrade: 0,
    currentOpenPnl: 0
  });
  
  const correlatedPricesRef = useRef<Map<string, number>>(new Map());
  
  // Get correlated assets for a symbol
  const getCorrelatedAssets = useCallback((symbol: string): FuturesContract[] => {
    const contract = FUTURES_CONTRACTS[symbol];
    if (!contract) return [];
    
    return contract.correlations
      .filter(c => Math.abs(c.baseCorrelation) > 0.3)
      .map(c => FUTURES_CONTRACTS[c.withSymbol])
      .filter((c): c is FuturesContract => c !== undefined)
      .slice(0, 5);
  }, []);
  
  // Open a new position
  const openPosition = useCallback((
    symbol: string,
    direction: 'long' | 'short',
    currentPrice: number,
    correlatedPrices: Map<string, number>
  ): SimulatedPosition => {
    const shares = ENTRY_AMOUNT / currentPrice;
    const correlatedAssets = getCorrelatedAssets(symbol);
    
    // Store correlated prices at entry
    correlatedPrices.forEach((price, sym) => {
      correlatedPricesRef.current.set(sym, price);
    });
    
    const contract = FUTURES_CONTRACTS[symbol];
    
    const position: SimulatedPosition = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      direction,
      entryPrice: currentPrice,
      entryTime: Date.now(),
      entryAmount: ENTRY_AMOUNT,
      shares,
      currentPrice,
      pnl: 0,
      pnlPercent: 0,
      correlatedAssets: correlatedAssets.map(asset => {
        const entryPrice = correlatedPrices.get(asset.symbol) || 100;
        const correlation = contract?.correlations.find(c => c.withSymbol === asset.symbol)?.baseCorrelation || 0;
        
        return {
          symbol: asset.symbol,
          name: asset.name,
          correlation,
          entryPrice,
          currentPrice: entryPrice,
          hypotheticalPnl: 0,
          pnlPercent: 0,
          isAligned: true
        };
      }),
      peakPnl: 0,
      troughPnl: 0,
      status: 'open'
    };
    
    setPositions(prev => [...prev, position]);
    return position;
  }, [getCorrelatedAssets]);
  
  // Update position with new prices
  const updatePosition = useCallback((
    positionId: string,
    currentPrice: number,
    correlatedPrices: Map<string, number>
  ) => {
    setPositions(prev => prev.map(pos => {
      if (pos.id !== positionId || pos.status === 'closed') return pos;
      
      // Calculate main position P&L
      const priceChange = currentPrice - pos.entryPrice;
      const pnl = pos.direction === 'long' 
        ? priceChange * pos.shares 
        : -priceChange * pos.shares;
      const pnlPercent = (pnl / ENTRY_AMOUNT) * 100;
      
      // Update correlated assets
      const updatedCorrelatedAssets = pos.correlatedAssets.map(asset => {
        const newPrice = correlatedPrices.get(asset.symbol) || asset.currentPrice;
        const assetPriceChange = newPrice - asset.entryPrice;
        const assetShares = ENTRY_AMOUNT / asset.entryPrice;
        const hypotheticalPnl = pos.direction === 'long'
          ? assetPriceChange * assetShares
          : -assetPriceChange * assetShares;
        const assetPnlPercent = (hypotheticalPnl / ENTRY_AMOUNT) * 100;
        
        // Check if movement aligns with correlation
        const mainDirection = currentPrice > pos.entryPrice ? 1 : -1;
        const assetDirection = newPrice > asset.entryPrice ? 1 : -1;
        const expectedDirection = asset.correlation > 0 ? mainDirection : -mainDirection;
        const isAligned = assetDirection === expectedDirection || assetPriceChange === 0;
        
        return {
          ...asset,
          currentPrice: newPrice,
          hypotheticalPnl,
          pnlPercent: assetPnlPercent,
          isAligned
        };
      });
      
      return {
        ...pos,
        currentPrice,
        pnl,
        pnlPercent,
        peakPnl: Math.max(pos.peakPnl, pnl),
        troughPnl: Math.min(pos.troughPnl, pnl),
        correlatedAssets: updatedCorrelatedAssets
      };
    }));
  }, []);
  
  // Close a position
  const closePosition = useCallback((positionId: string, closePrice: number) => {
    setPositions(prev => prev.map(pos => {
      if (pos.id !== positionId || pos.status === 'closed') return pos;
      
      const priceChange = closePrice - pos.entryPrice;
      const closePnl = pos.direction === 'long'
        ? priceChange * pos.shares
        : -priceChange * pos.shares;
      
      return {
        ...pos,
        status: 'closed',
        closePrice,
        closeTime: Date.now(),
        closePnl,
        currentPrice: closePrice,
        pnl: closePnl,
        pnlPercent: (closePnl / ENTRY_AMOUNT) * 100
      };
    }));
  }, []);
  
  // Calculate stats whenever positions change
  useEffect(() => {
    const closedPositions = positions.filter(p => p.status === 'closed');
    const openPositions = positions.filter(p => p.status === 'open');
    
    const winningTrades = closedPositions.filter(p => (p.closePnl || 0) > 0).length;
    const losingTrades = closedPositions.filter(p => (p.closePnl || 0) < 0).length;
    const totalClosedPnl = closedPositions.reduce((sum, p) => sum + (p.closePnl || 0), 0);
    const currentOpenPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);
    
    const allPnls = closedPositions.map(p => p.closePnl || 0);
    
    setStats({
      totalTrades: closedPositions.length,
      winningTrades,
      losingTrades,
      winRate: closedPositions.length > 0 ? (winningTrades / closedPositions.length) * 100 : 0,
      totalPnl: totalClosedPnl,
      averagePnl: closedPositions.length > 0 ? totalClosedPnl / closedPositions.length : 0,
      bestTrade: allPnls.length > 0 ? Math.max(...allPnls) : 0,
      worstTrade: allPnls.length > 0 ? Math.min(...allPnls) : 0,
      currentOpenPnl
    });
  }, [positions]);
  
  // Get open positions
  const openPositions = positions.filter(p => p.status === 'open');
  const closedPositions = positions.filter(p => p.status === 'closed');
  
  return {
    positions,
    openPositions,
    closedPositions,
    stats,
    openPosition,
    updatePosition,
    closePosition,
    entryAmount: ENTRY_AMOUNT
  };
}

/**
 * Prop Firm Compliance Tracker
 * 
 * Monitors trading activity against prop firm challenge rules:
 - Max daily loss limits
 - Consistency requirements (no single day > 30% of total profit)
 - Minimum trading days
 - No overnight/weekend holds (for some firms)
 - Position sizing limits
 */

import { RISK_CONFIG } from './multiAssetConfig';

interface PropFirmRules {
  name: string;
  accountSize: number;
  maxDailyLoss: number;
  maxTotalLoss: number;
  profitTarget: number;
  minTradingDays: number;
  consistencyRule: boolean;
  maxSingleDayProfit: number; // % of total profit
  positionSizeLimit: number;
  allowedHoldings: 'intraday' | 'overnight' | 'swing';
}

interface ComplianceStatus {
  firm: string;
  currentBalance: number;
  dailyPnl: number;
  totalPnl: number;
  winRate: number;
  tradingDays: number;
  status: 'passing' | 'warning' | 'failing' | 'breached';
  violations: Violation[];
  daysRemaining: number;
  progressToTarget: number;
}

interface Violation {
  type: 'daily_loss' | 'consistency' | 'position_size' | 'holding_period' | 'max_loss';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  value: number;
  limit: number;
}

interface TradeRecord {
  timestamp: string;
  symbol: string;
  pnl: number;
  pnlPercent: number;
  holdingTime: number;
  size: number;
}

export class PropFirmComplianceTracker {
  private firms: Map<string, PropFirmRules> = new Map();
  private dailyPnl: Map<string, number> = new Map(); // firm -> today's P&L
  private tradeHistory: Map<string, TradeRecord[]> = new Map();
  private dailyHistory: Map<string, Map<string, number>> = new Map(); // firm -> date -> pnl
  
  constructor(private supabase: any) {
    this.initializeFirms();
  }
  
  private initializeFirms() {
    // Apex Trader Funding rules (example)
    this.firms.set('apex_50k', {
      name: 'Apex Trader Funding - $50K',
      accountSize: 50000,
      maxDailyLoss: 2500,
      maxTotalLoss: 2500,
      profitTarget: 3000,
      minTradingDays: 7,
      consistencyRule: true,
      maxSingleDayProfit: 0.30,
      positionSizeLimit: 5,
      allowedHoldings: 'intraday',
    });
    
    // TopStep rules
    this.firms.set('topstep_50k', {
      name: 'TopStep - $50K',
      accountSize: 50000,
      maxDailyLoss: 1000,
      maxTotalLoss: 2000,
      profitTarget: 3000,
      minTradingDays: 5,
      consistencyRule: true,
      maxSingleDayProfit: 0.40,
      positionSizeLimit: 3,
      allowedHoldings: 'overnight',
    });
    
    // Add more firms as needed
    this.firms.set('apex_100k', {
      name: 'Apex Trader Funding - $100K',
      accountSize: 100000,
      maxDailyLoss: 5000,
      maxTotalLoss: 5000,
      profitTarget: 6000,
      minTradingDays: 7,
      consistencyRule: true,
      maxSingleDayProfit: 0.30,
      positionSizeLimit: 10,
      allowedHoldings: 'intraday',
    });
    
    this.firms.set('apex_200k', {
      name: 'Apex Trader Funding - $200K',
      accountSize: 200000,
      maxDailyLoss: 10000,
      maxTotalLoss: 10000,
      profitTarget: 12000,
      minTradingDays: 7,
      consistencyRule: true,
      maxSingleDayProfit: 0.30,
      positionSizeLimit: 20,
      allowedHoldings: 'intraday',
    });
  }
  
  async recordTrade(firm: string, trade: TradeRecord) {
    if (!this.firms.has(firm)) {
      console.warn(`[PropFirmTracker] Unknown firm: ${firm}`);
      return;
    }
    
    // Add to trade history
    if (!this.tradeHistory.has(firm)) {
      this.tradeHistory.set(firm, []);
    }
    this.tradeHistory.get(firm)!.push(trade);
    
    // Update daily P&L
    const currentDaily = this.dailyPnl.get(firm) || 0;
    this.dailyPnl.set(firm, currentDaily + trade.pnl);
    
    // Update daily history
    const today = new Date().toISOString().split('T')[0];
    if (!this.dailyHistory.has(firm)) {
      this.dailyHistory.set(firm, new Map());
    }
    const firmHistory = this.dailyHistory.get(firm)!;
    firmHistory.set(today, (firmHistory.get(today) || 0) + trade.pnl);
    
    // Save to database
    await this.saveTrade(firm, trade);
    
    // Check for violations
    await this.checkViolations(firm);
  }
  
  private async checkViolations(firm: string) {
    const rules = this.firms.get(firm)!;
    const violations: Violation[] = [];
    const dailyPnl = this.dailyPnl.get(firm) || 0;
    
    // Check daily loss limit
    if (dailyPnl < -rules.maxDailyLoss) {
      violations.push({
        type: 'daily_loss',
        severity: 'high',
        message: `Daily loss limit exceeded: $${Math.abs(dailyPnl).toFixed(2)} > $${rules.maxDailyLoss}`,
        timestamp: new Date().toISOString(),
        value: Math.abs(dailyPnl),
        limit: rules.maxDailyLoss,
      });
    } else if (dailyPnl < -rules.maxDailyLoss * 0.8) {
      violations.push({
        type: 'daily_loss',
        severity: 'medium',
        message: `Approaching daily loss limit: $${Math.abs(dailyPnl).toFixed(2)} / $${rules.maxDailyLoss}`,
        timestamp: new Date().toISOString(),
        value: Math.abs(dailyPnl),
        limit: rules.maxDailyLoss,
      });
    }
    
    // Check total loss limit
    const totalPnl = await this.getTotalPnl(firm);
    const startingBalance = rules.accountSize;
    const currentBalance = startingBalance + totalPnl;
    
    if (currentBalance < startingBalance - rules.maxTotalLoss) {
      violations.push({
        type: 'max_loss',
        severity: 'high',
        message: `Maximum loss limit breached: Account at $${currentBalance.toFixed(2)}`,
        timestamp: new Date().toISOString(),
        value: startingBalance - currentBalance,
        limit: rules.maxTotalLoss,
      });
    }
    
    // Check consistency rule
    if (rules.consistencyRule) {
      const dailyPnls = Array.from(this.dailyHistory.get(firm)?.values() || []);
      const totalProfit = dailyPnls.filter(p => p > 0).reduce((a, b) => a + b, 0);
      
      for (const pnl of dailyPnls) {
        if (pnl > 0 && pnl > totalProfit * rules.maxSingleDayProfit) {
          violations.push({
            type: 'consistency',
            severity: 'medium',
            message: `Consistency violation: Single day profit $${pnl.toFixed(2)} > ${(rules.maxSingleDayProfit * 100).toFixed(0)}% of total`,
            timestamp: new Date().toISOString(),
            value: pnl,
            limit: totalProfit * rules.maxSingleDayProfit,
          });
        }
      }
    }
    
    // Save violations
    if (violations.length > 0) {
      await this.saveViolations(firm, violations);
    }
  }
  
  async getComplianceStatus(firm: string): Promise<ComplianceStatus> {
    const rules = this.firms.get(firm);
    if (!rules) {
      throw new Error(`Unknown firm: ${firm}`);
    }
    
    const totalPnl = await this.getTotalPnl(firm);
    const dailyPnl = this.dailyPnl.get(firm) || 0;
    const currentBalance = rules.accountSize + totalPnl;
    
    const trades = this.tradeHistory.get(firm) || [];
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const winRate = trades.length > 0 ? winningTrades / trades.length : 0;
    
    const dailyHistory = this.dailyHistory.get(firm);
    const tradingDays = dailyHistory ? dailyHistory.size : 0;
    
    // Get recent violations
    const violations = await this.getRecentViolations(firm);
    
    // Determine status
    let status: 'passing' | 'warning' | 'failing' | 'breached' = 'passing';
    
    const hasHighSeverity = violations.some(v => v.severity === 'high');
    const hasMediumSeverity = violations.some(v => v.severity === 'medium');
    
    if (hasHighSeverity) {
      status = 'breached';
    } else if (hasMediumSeverity || totalPnl < -rules.maxTotalLoss * 0.5) {
      status = 'warning';
    }
    
    // Calculate days remaining (30-day evaluation period typical)
    const daysRemaining = Math.max(0, 30 - tradingDays);
    
    // Progress to target
    const progressToTarget = Math.min(100, (totalPnl / rules.profitTarget) * 100);
    
    return {
      firm: rules.name,
      currentBalance,
      dailyPnl,
      totalPnl,
      winRate,
      tradingDays,
      status,
      violations,
      daysRemaining,
      progressToTarget,
    };
  }
  
  getRecommendedPositionSize(firm: string, accountBalance: number): number {
    const rules = this.firms.get(firm);
    if (!rules) return 0;
    
    // Conservative sizing for prop firm
    const maxRisk = Math.min(
      RISK_CONFIG.MAX_SINGLE_TRADE_RISK,
      (rules.maxDailyLoss / rules.accountSize) * 0.5
    );
    
    return accountBalance * maxRisk;
  }
  
  shouldPauseTrading(firm: string): boolean {
    const dailyPnl = this.dailyPnl.get(firm) || 0;
    const rules = this.firms.get(firm);
    if (!rules) return false;
    
    // Pause if approaching daily loss
    return dailyPnl < -rules.maxDailyLoss * 0.7;
  }
  
  getAllFirms(): string[] {
    return Array.from(this.firms.keys());
  }
  
  getFirmDetails(firm: string): PropFirmRules | undefined {
    return this.firms.get(firm);
  }
  
  private async getTotalPnl(firm: string): Promise<number> {
    const trades = this.tradeHistory.get(firm) || [];
    return trades.reduce((sum, t) => sum + t.pnl, 0);
  }
  
  private async getRecentViolations(firm: string): Promise<Violation[]> {
    try {
      const { data } = await this.supabase
        .from('prop_firm_violations')
        .select('*')
        .eq('firm', firm)
        .gte('timestamp', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('timestamp', { ascending: false });
      
      return data || [];
    } catch (err) {
      return [];
    }
  }
  
  private async saveTrade(firm: string, trade: TradeRecord) {
    try {
      await this.supabase.from('prop_firm_trades').insert({
        firm,
        ...trade,
      });
    } catch (err) {
      console.warn('[PropFirmTracker] Failed to save trade:', err);
    }
  }
  
  private async saveViolations(firm: string, violations: Violation[]) {
    try {
      await this.supabase.from('prop_firm_violations').insert(
        violations.map(v => ({
          firm,
          ...v,
        }))
      );
    } catch (err) {
      console.warn('[PropFirmTracker] Failed to save violations:', err);
    }
  }
  
  async resetDaily(firm: string) {
    this.dailyPnl.set(firm, 0);
  }
  
  generateReport(firm: string): string {
    const rules = this.firms.get(firm);
    if (!rules) return '';
    
    const status = this.getComplianceStatus(firm);
    
    return `
=== PROP FIRM COMPLIANCE REPORT ===
Firm: ${rules.name}
Account Size: $${rules.accountSize.toLocaleString()}

Current Status: ${status.status.toUpperCase()}
Current Balance: $${status.currentBalance.toLocaleString()}
Total P&L: $${status.totalPnl.toFixed(2)}
Daily P&L: $${status.dailyPnl.toFixed(2)}
Win Rate: ${(status.winRate * 100).toFixed(1)}%
Trading Days: ${status.tradingDays}/${rules.minTradingDays}

Progress to Profit Target ($${rules.profitTarget.toLocaleString()}):
${status.progressToTarget.toFixed(1)}%

Days Remaining: ${status.daysRemaining}

Violations: ${status.violations.length}
${status.violations.map(v => `  [${v.severity.toUpperCase()}] ${v.message}`).join('\n')}

RECOMMENDATIONS:
${status.status === 'breached' ? '- IMMEDIATE: Stop trading, evaluation failed' : ''}
${status.status === 'warning' ? '- CAUTION: Reduce position sizes, focus on consistency' : ''}
${status.progressToTarget > 50 && status.status === 'passing' ? '- Consider taking profits to lock in gains' : ''}
${status.tradingDays < rules.minTradingDays ? `- Need ${rules.minTradingDays - status.tradingDays} more trading days` : ''}
    `.trim();
  }
}

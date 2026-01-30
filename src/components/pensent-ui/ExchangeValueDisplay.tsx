/**
 * ExchangeValueDisplay - Universal Exchange Value Visualization
 * 
 * Shows the conversion rates and values between domains:
 * - 1 Code pattern ≈ 0.8 Chess patterns ≈ 1.2 Market patterns
 * 
 * Patent-Pending: En Pensent™ Universal Exchange Value
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftRight, 
  Code, 
  Crown, 
  TrendingUp,
  Sparkles,
  Zap
} from "lucide-react";

export interface ExchangeValue {
  domain: 'code' | 'chess' | 'market';
  rawValue: number;
  normalizedValue: number;
  intelligence: number;
  universalUnits: number;
}

export interface ExchangeValueDisplayProps {
  codeValue?: ExchangeValue;
  chessValue?: ExchangeValue;
  marketValue?: ExchangeValue;
  showConversions?: boolean;
  animated?: boolean;
  compact?: boolean;
  className?: string;
}

const DOMAIN_CONFIG = {
  code: {
    icon: Code,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Code',
    rate: 1.0
  },
  chess: {
    icon: Crown,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Chess',
    rate: 0.8
  },
  market: {
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Market',
    rate: 1.2
  }
};

// Calculate cross-domain conversions
function calculateConversions(value: ExchangeValue): Record<string, number> {
  const baseUnits = value.universalUnits;
  return {
    code: baseUnits / DOMAIN_CONFIG.code.rate,
    chess: baseUnits / DOMAIN_CONFIG.chess.rate,
    market: baseUnits / DOMAIN_CONFIG.market.rate
  };
}

export const ExchangeValueDisplay = ({
  codeValue,
  chessValue,
  marketValue,
  showConversions = true,
  animated = true,
  compact = false,
  className
}: ExchangeValueDisplayProps) => {
  const values = [
    codeValue && { ...codeValue, config: DOMAIN_CONFIG.code },
    chessValue && { ...chessValue, config: DOMAIN_CONFIG.chess },
    marketValue && { ...marketValue, config: DOMAIN_CONFIG.market }
  ].filter(Boolean) as (ExchangeValue & { config: typeof DOMAIN_CONFIG.code })[];

  // Calculate total universal value
  const totalUniversal = values.reduce((sum, v) => sum + v.universalUnits, 0);
  const avgIntelligence = values.reduce((sum, v) => sum + v.intelligence, 0) / Math.max(values.length, 1);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">UEV:</span>
          <motion.span
            className="font-mono font-bold text-primary"
            initial={animated ? { opacity: 0 } : {}}
            animate={{ opacity: 1 }}
          >
            {totalUniversal.toFixed(2)}
          </motion.span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Zap className="w-3 h-3" />
          <span>{Math.round(avgIntelligence * 100)}% IQ</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          Universal Exchange Value
          <Badge variant="outline" className="ml-2 text-xs">
            Patent-Pending
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Universal Value */}
        <motion.div
          className="p-4 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Universal Value</p>
              <p className="text-3xl font-bold text-primary font-mono">
                {totalUniversal.toFixed(2)} <span className="text-lg">UEV</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Intelligence Quotient</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round(avgIntelligence * 100)}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Domain Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {values.map((value, index) => {
            const Icon = value.config.icon;
            const conversions = calculateConversions(value);
            
            return (
              <motion.div
                key={value.domain}
                className={cn(
                  "p-3 rounded-lg border",
                  value.config.bgColor,
                  value.config.borderColor
                )}
                initial={animated ? { opacity: 0, x: -20 } : {}}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-4 h-4", value.config.color)} />
                  <span className="font-medium">{value.config.label}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Raw:</span>
                    <span className="font-mono">{value.rawValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Normalized:</span>
                    <span className="font-mono">{value.normalizedValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Universal:</span>
                    <span className="font-mono font-bold text-primary">
                      {value.universalUnits.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Conversion rates */}
                {showConversions && (
                  <div className="mt-3 pt-2 border-t border-muted/30 space-y-1">
                    <p className="text-xs text-muted-foreground mb-1">Converts to:</p>
                    {Object.entries(conversions)
                      .filter(([d]) => d !== value.domain)
                      .map(([domain, amount]) => (
                        <div key={domain} className="flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{domain}:</span>
                          <span className="font-mono">{amount.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Exchange Rate Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
          <span>1 Code</span>
          <ArrowLeftRight className="w-3 h-3" />
          <span>0.8 Chess</span>
          <ArrowLeftRight className="w-3 h-3" />
          <span>1.2 Market</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeValueDisplay;

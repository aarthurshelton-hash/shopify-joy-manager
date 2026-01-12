import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, TrendingUp, ShoppingBag, Sparkles } from 'lucide-react';
import { MEMBERSHIP_ECONOMICS } from '@/lib/visualizations/visionScoring';
import { useRandomGameArt } from '@/hooks/useRandomGameArt';

// Average print prices by size
const PRINT_PRICES = {
  small: { label: '8×10"', price: 29.99 },
  medium: { label: '16×20"', price: 49.99 },
  large: { label: '24×36"', price: 79.99 },
};

export const RoyaltyCalculator: React.FC = () => {
  const [ordersPerMonth, setOrdersPerMonth] = useState(10);
  const [avgPrintPrice, setAvgPrintPrice] = useState(49.99);
  const backgroundImages = useRandomGameArt(1);
  
  const valueAppreciationRate = MEMBERSHIP_ECONOMICS.valueAppreciationRate;
  const marketplaceFeePercent = MEMBERSHIP_ECONOMICS.marketplaceTransactionFee * 100;
  
  // Calculations - value that accrues to vision
  const monthlyRevenue = ordersPerMonth * avgPrintPrice;
  const monthlyValueAdded = monthlyRevenue * valueAppreciationRate;
  const yearlyValueAdded = monthlyValueAdded * 12;
  
  // Milestones
  const milestones = [
    { label: 'Coffee Fund', amount: 50, emoji: '☕' },
    { label: 'Nice Dinner', amount: 200, emoji: '🍽️' },
    { label: 'Weekend Trip', amount: 500, emoji: '✈️' },
    { label: 'New Camera', amount: 1000, emoji: '📷' },
    { label: 'Vacation Fund', amount: 2500, emoji: '🏖️' },
  ];
  
  const nextMilestone = milestones.find(m => m.amount > yearlyValueAdded) || milestones[milestones.length - 1];
  const progressToMilestone = Math.min((yearlyValueAdded / nextMilestone.amount) * 100, 100);

  return (
    <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-green-500/5">
      {/* Subtle AI Art Background */}
      {backgroundImages[0] && (
        <div 
          className="absolute inset-0 opacity-[0.08] bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImages[0]})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-background/85 to-background/95" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Value Calculator
          </CardTitle>
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Interactive
          </Badge>
        </div>
        <CardDescription>
          See how much value accrues to your visions from print orders
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-6">
        {/* Orders Per Month Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              Orders per month
            </label>
            <span className="text-2xl font-bold text-primary">{ordersPerMonth}</span>
          </div>
          <Slider
            value={[ordersPerMonth]}
            onValueChange={(v) => setOrdersPerMonth(v[0])}
            min={1}
            max={100}
            step={1}
            className="[&>span:first-child]:bg-primary/20 [&_[role=slider]]:bg-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 order</span>
            <span>50 orders</span>
            <span>100 orders</span>
          </div>
        </div>
        
        {/* Average Print Price Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Average print size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PRINT_PRICES).map(([key, { label, price }]) => (
              <button
                key={key}
                onClick={() => setAvgPrintPrice(price)}
                className={`p-3 rounded-lg border text-center transition-all ${
                  avgPrintPrice === price 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border/50 bg-background/50 hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">${price}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Results Display */}
        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-sm text-muted-foreground mb-1">Monthly Value Added</p>
            <p className="text-3xl font-bold text-green-500">
              +${monthlyValueAdded.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {ordersPerMonth} × ${avgPrintPrice} × {valueAppreciationRate * 100}%
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-sm text-muted-foreground mb-1">Yearly Value Growth</p>
            <p className="text-3xl font-bold text-primary">
              +${yearlyValueAdded.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sell on marketplace ({marketplaceFeePercent}% fee)
            </p>
          </div>
        </div>
        
        {/* Milestone Progress */}
        <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progress to: {nextMilestone.emoji} {nextMilestone.label}
            </span>
            <span className="text-sm text-muted-foreground">
              ${yearlyValueAdded.toFixed(0)} / ${nextMilestone.amount}
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
              style={{ width: `${progressToMilestone}%` }}
            />
          </div>
          
          {/* Milestone badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            {milestones.map((milestone, i) => (
              <Badge 
                key={i}
                variant={yearlyValueAdded >= milestone.amount ? 'default' : 'outline'}
                className={yearlyValueAdded >= milestone.amount 
                  ? 'bg-green-500/20 text-green-600 border-green-500/30' 
                  : 'opacity-50'
                }
              >
                {milestone.emoji} ${milestone.amount}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center italic">
          Value based on {valueAppreciationRate * 100}% appreciation rate. Sell visions on marketplace to realize gains.
        </p>
      </CardContent>
    </Card>
  );
};

export default RoyaltyCalculator;
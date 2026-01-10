import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrencyStore, SUPPORTED_CURRENCIES, type Currency } from '@/stores/currencyStore';
import { Globe } from 'lucide-react';

interface CurrencySelectorProps {
  className?: string;
  compact?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ 
  className = '',
  compact = false 
}) => {
  const { selectedCurrency, setCurrency } = useCurrencyStore();

  const handleChange = (code: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    if (currency) {
      setCurrency(currency);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!compact && (
        <Globe className="h-4 w-4 text-muted-foreground" />
      )}
      <Select value={selectedCurrency.code} onValueChange={handleChange}>
        <SelectTrigger className={compact ? "w-[90px] h-8 text-xs" : "w-[160px]"}>
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{selectedCurrency.flag}</span>
              <span>{selectedCurrency.code}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="flex items-center gap-2">
                <span>{currency.flag}</span>
                <span className="font-medium">{currency.code}</span>
                {!compact && (
                  <span className="text-muted-foreground text-xs">
                    - {currency.name}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CurrencySelector;

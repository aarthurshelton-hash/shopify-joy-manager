import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

// Major world currencies with their symbols and flags
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
];

// Exchange rates relative to USD (approximate - in production, use a real API)
// These rates are approximate as of early 2025
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.00,
  CAD: 1.36,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.53,
  JPY: 148.50,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.50,
  MXN: 17.20,
  BRL: 4.97,
  KRW: 1320.00,
};

interface CurrencyStore {
  selectedCurrency: Currency;
  exchangeRates: Record<string, number>;
  
  setCurrency: (currency: Currency) => void;
  convertPrice: (amountInUSD: number) => number;
  formatPrice: (amountInUSD: number) => string;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      selectedCurrency: SUPPORTED_CURRENCIES[0], // Default to USD
      exchangeRates: EXCHANGE_RATES,
      
      setCurrency: (currency) => {
        set({ selectedCurrency: currency });
      },
      
      convertPrice: (amountInUSD) => {
        const { selectedCurrency, exchangeRates } = get();
        const rate = exchangeRates[selectedCurrency.code] || 1;
        return amountInUSD * rate;
      },
      
      formatPrice: (amountInUSD) => {
        const { selectedCurrency } = get();
        const convertedAmount = get().convertPrice(amountInUSD);
        
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: selectedCurrency.code,
          minimumFractionDigits: selectedCurrency.code === 'JPY' || selectedCurrency.code === 'KRW' ? 0 : 2,
          maximumFractionDigits: selectedCurrency.code === 'JPY' || selectedCurrency.code === 'KRW' ? 0 : 2,
        }).format(convertedAmount);
      },
    }),
    {
      name: 'en-pensent-currency',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

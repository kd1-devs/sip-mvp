// Currency Configuration
export type CurrencyCode = "GBP" | "EUR";

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  displayName: string; // Format: "£ GBP"
  rateFromGBP: number; // Conversion rate from GBP
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    displayName: "£ GBP",
    rateFromGBP: 1.0,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    displayName: "€ EUR",
    rateFromGBP: 1.17, // Fixed demo FX rate: 1 GBP = 1.17 EUR
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = "GBP";

export function convertCurrency(
  amount: number | null,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number | null {
  if (amount === null) return null;
  if (fromCurrency === toCurrency) return amount;

  // Convert from source currency to GBP, then to target currency
  const fromRate = CURRENCIES[fromCurrency].rateFromGBP;
  const toRate = CURRENCIES[toCurrency].rateFromGBP;
  
  return (amount / fromRate) * toRate;
}

export function formatCurrency(
  amount: number | null,
  currency: CurrencyCode = DEFAULT_CURRENCY
): string {
  if (amount === null) return "N/A";

  const config = CURRENCIES[currency];
  return `${config.symbol}${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}M`;
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCIES[currency].symbol;
}

export function getCurrencyDisplayName(currency: CurrencyCode): string {
  return CURRENCIES[currency].displayName;
}

export function formatPercentage(value: number | null): string {
  if (value === null) return "N/A";

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function toNumber(value: string | null): number {
  if (value === null) return 0;
  // Remove commas and other non-numeric characters (except decimal point and minus sign)
  const cleaned = value.replace(/,/g, "");
  return parseFloat(cleaned);
}

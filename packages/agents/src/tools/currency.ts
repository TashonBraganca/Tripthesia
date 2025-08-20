import { z } from "zod";

export const CurrencyToolParams = z.object({
  amount: z.number().positive(),
  from: z.string().length(3), // ISO 4217 currency code
  to: z.string().length(3),
  date: z.string().optional(), // For historical rates
});

export const CurrencyToolResult = z.object({
  amount: z.number(),
  convertedAmount: z.number(),
  rate: z.number(),
  from: z.string(),
  to: z.string(),
  date: z.string(),
  provider: z.enum(["exchangerate", "fallback"]),
});

export type CurrencyToolParams = z.infer<typeof CurrencyToolParams>;
export type CurrencyToolResult = z.infer<typeof CurrencyToolResult>;

interface ExchangeRateResponse {
  success: boolean;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export class CurrencyCache {
  private cache = new Map<string, { data: Record<string, number>; timestamp: number }>();
  private readonly TTL = 60 * 60 * 1000; // 1 hour for currency rates

  private getCacheKey(base: string, date?: string): string {
    return `${base}-${date || "latest"}`;
  }

  getCached(base: string, date?: string): Record<string, number> | null {
    const key = this.getCacheKey(base, date);
    const cached = this.cache.get(key);
    
    if (!cached || Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  setCached(base: string, rates: Record<string, number>, date?: string): void {
    const key = this.getCacheKey(base, date);
    this.cache.set(key, { data: rates, timestamp: Date.now() });
  }
}

const currencyCache = new CurrencyCache();

// Fallback rates for common currencies (approximate rates)
const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: {
    EUR: 0.85, GBP: 0.73, JPY: 110, CAD: 1.25, AUD: 1.35,
    CHF: 0.92, CNY: 6.4, INR: 75, BRL: 5.2, MXN: 20,
  },
  EUR: {
    USD: 1.18, GBP: 0.86, JPY: 130, CAD: 1.47, AUD: 1.59,
    CHF: 1.08, CNY: 7.5, INR: 88, BRL: 6.1, MXN: 24,
  }
};

export async function convertCurrency(params: CurrencyToolParams): Promise<CurrencyToolResult> {
  // Same currency, no conversion needed
  if (params.from === params.to) {
    return {
      amount: params.amount,
      convertedAmount: params.amount,
      rate: 1,
      from: params.from,
      to: params.to,
      date: new Date().toISOString().split('T')[0],
      provider: "fallback",
    };
  }

  try {
    // Try to get real exchange rates
    const result = await getExchangeRates(params);
    return result;
  } catch (error) {
    console.warn("Exchange rate API failed, using fallback:", error);
    return getFallbackRate(params);
  }
}

async function getExchangeRates(params: CurrencyToolParams): Promise<CurrencyToolResult> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  
  // Check cache first
  const cached = currencyCache.getCached(params.from, params.date);
  if (cached && cached[params.to]) {
    const rate = cached[params.to];
    return {
      amount: params.amount,
      convertedAmount: params.amount * rate,
      rate,
      from: params.from,
      to: params.to,
      date: params.date || new Date().toISOString().split('T')[0],
      provider: "exchangerate",
    };
  }

  let url: string;
  if (apiKey) {
    // Use exchangerate-api.com with API key
    url = params.date 
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/history/${params.from}/${params.date}`
      : `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${params.from}`;
  } else {
    // Use free tier without API key (limited requests)
    url = `https://api.exchangerate-api.com/v4/latest/${params.from}`;
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Exchange rate API error: ${response.status}`);
  }

  const data: ExchangeRateResponse = await response.json();
  
  if (!data.success && data.success !== undefined) {
    throw new Error("Exchange rate API returned error");
  }

  const rate = data.rates[params.to];
  if (!rate) {
    throw new Error(`Exchange rate not found for ${params.to}`);
  }

  // Cache the rates
  currencyCache.setCached(params.from, data.rates, data.date);

  return {
    amount: params.amount,
    convertedAmount: params.amount * rate,
    rate,
    from: params.from,
    to: params.to,
    date: data.date,
    provider: "exchangerate",
  };
}

function getFallbackRate(params: CurrencyToolParams): CurrencyToolResult {
  // Try direct lookup
  let rate = FALLBACK_RATES[params.from]?.[params.to];
  
  // Try inverse lookup
  if (!rate && FALLBACK_RATES[params.to]?.[params.from]) {
    rate = 1 / FALLBACK_RATES[params.to][params.from];
  }
  
  // Default to USD conversion if available
  if (!rate) {
    const fromToUsd = FALLBACK_RATES[params.from]?.USD;
    const toToUsd = FALLBACK_RATES[params.to]?.USD;
    
    if (fromToUsd && toToUsd) {
      rate = toToUsd / fromToUsd;
    }
  }
  
  // Last resort: assume similar value
  if (!rate) {
    rate = 1;
  }

  return {
    amount: params.amount,
    convertedAmount: params.amount * rate,
    rate,
    from: params.from,
    to: params.to,
    date: new Date().toISOString().split('T')[0],
    provider: "fallback",
  };
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function roundCurrency(amount: number, currency: string): number {
  // Different currencies have different conventional rounding
  const roundingRules: Record<string, number> = {
    JPY: 1, // Yen rounds to whole numbers
    KRW: 1, // Korean Won rounds to whole numbers
    VND: 1, // Vietnamese Dong rounds to whole numbers
    CLP: 1, // Chilean Peso rounds to whole numbers
    ISK: 1, // Icelandic Krona rounds to whole numbers
  };

  const decimals = roundingRules[currency] ?? 2;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
}

export const COMMON_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
] as const;
import { NextRequest, NextResponse } from 'next/server';
import { currencyConverter, currencies, CurrencyCode, getCurrencyInfo } from '@/lib/currency/currency-converter';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const baseCurrency = (searchParams.get('base') || 'USD') as CurrencyCode;
    const targetCurrencies = searchParams.get('targets')?.split(',') as CurrencyCode[] | undefined;

    // Get all supported currencies if no specific targets requested
    const targets = targetCurrencies || Object.keys(currencies) as CurrencyCode[];

    // Remove base currency from targets to avoid redundant 1:1 rates
    const filteredTargets = targets.filter(currency => currency !== baseCurrency);

    const rates: Record<string, number> = {};
    const errors: Record<string, string> = {};

    // Get exchange rates for all target currencies
    await Promise.allSettled(
      filteredTargets.map(async (targetCurrency) => {
        try {
          const result = await currencyConverter.convert(1, baseCurrency, targetCurrency);
          rates[targetCurrency] = result.exchangeRate;
        } catch (error) {
          errors[targetCurrency] = error instanceof Error ? error.message : 'Conversion failed';
        }
      })
    );

    // Add base currency rate (always 1)
    rates[baseCurrency] = 1;

    return NextResponse.json({
      success: true,
      data: {
        baseCurrency,
        rates,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
        supportedCurrencies: Object.keys(currencies)
      }
    });

  } catch (error) {
    console.error('Exchange rates API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch exchange rates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get currency information endpoint
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currencies } = body;

    if (!Array.isArray(currencies)) {
      return NextResponse.json(
        { error: 'Invalid currencies parameter - must be an array' },
        { status: 400 }
      );
    }

    const currencyInfo = currencies.map((currency: string) => {
      const currencyCode = currency as CurrencyCode;
      const info = getCurrencyInfo(currencyCode);
      
      return {
        code: currency,
        supported: !!info,
        symbol: info?.symbol || currency,
        name: info?.name || currency
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        currencies: currencyInfo,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Currency info API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get currency information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


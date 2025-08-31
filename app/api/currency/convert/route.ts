import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currencyConverter, CurrencyCode } from '@/lib/currency/currency-converter';
import { auth } from '@clerk/nextjs/server';

const ConvertSchema = z.object({
  amount: z.number().min(0),
  fromCurrency: z.string(),
  toCurrency: z.string()
});

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
    const { amount, fromCurrency, toCurrency } = ConvertSchema.parse(body);

    const result = await currencyConverter.convert(
      amount,
      fromCurrency as CurrencyCode,
      toCurrency as CurrencyCode
    );

    return NextResponse.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount: result.convertedAmount,
        fromCurrency,
        toCurrency,
        exchangeRate: result.exchangeRate,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Currency conversion API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Currency conversion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
    const fromCurrency = searchParams.get('from');
    const toCurrency = searchParams.get('to');
    const amount = searchParams.get('amount');

    if (!fromCurrency || !toCurrency || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to, amount' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      return NextResponse.json(
        { error: 'Invalid amount parameter' },
        { status: 400 }
      );
    }

    const result = await currencyConverter.convert(
      numAmount,
      fromCurrency as CurrencyCode,
      toCurrency as CurrencyCode
    );

    return NextResponse.json({
      success: true,
      data: {
        originalAmount: numAmount,
        convertedAmount: result.convertedAmount,
        fromCurrency,
        toCurrency,
        exchangeRate: result.exchangeRate,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Currency conversion API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Currency conversion failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
/**
 * Internationalization Administration API Endpoint
 * Manages translations and currency rates
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { i18nManager } from '@/lib/i18n/international-support';

async function checkAdminAccess(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = process.env.ADMIN_USER_ID === userId || 
                 process.env.NODE_ENV === 'development';
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

async function GET(request: NextRequest) {
  const accessError = await checkAdminAccess(request);
  if (accessError) return accessError;

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'locales':
        return NextResponse.json({
          success: true,
          data: {
            supportedLocales: i18nManager.getSupportedLocales(),
            currentLocale: i18nManager.getCurrentLocale(),
          }
        });
      
      case 'translations':
        const locale = url.searchParams.get('locale') || 'en-US';
        // In production, you'd fetch translations from database
        return NextResponse.json({
          success: true,
          data: {
            locale,
            translations: {}, // Placeholder - would contain actual translations
            keys: [], // List of translation keys
          }
        });
      
      case 'currency_rates':
        // Get current currency rates
        return NextResponse.json({
          success: true,
          data: {
            baseCurrency: 'USD',
            rates: {}, // Would contain actual rates from i18nManager
            lastUpdated: new Date().toISOString(),
          }
        });
      
      case 'regional_settings':
        const regionLocale = url.searchParams.get('locale') || 'en-US';
        try {
          const settings = i18nManager.getRegionalSettings(regionLocale);
          return NextResponse.json({
            success: true,
            data: settings
          });
        } catch (error) {
          return NextResponse.json(
            { error: `Unsupported locale: ${regionLocale}` },
            { status: 400 }
          );
        }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: locales, translations, currency_rates, regional_settings' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('I18n admin error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch internationalization data' },
      { status: 500 }
    );
  }
}

async function POST(request: NextRequest) {
  const accessError = await checkAdminAccess(request);
  if (accessError) return accessError;

  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'update_currency_rates':
        await i18nManager.updateCurrencyRates();
        return NextResponse.json({
          success: true,
          message: 'Currency rates updated successfully'
        });
      
      case 'add_translation':
        if (!data.locale || !data.key || !data.value) {
          return NextResponse.json(
            { error: 'Locale, key, and value required' },
            { status: 400 }
          );
        }
        
        // In production, you'd store this in database
        return NextResponse.json({
          success: true,
          message: `Translation added for ${data.locale}: ${data.key}`
        });
      
      case 'update_translation':
        if (!data.locale || !data.key || !data.value) {
          return NextResponse.json(
            { error: 'Locale, key, and value required' },
            { status: 400 }
          );
        }
        
        // In production, you'd update in database
        return NextResponse.json({
          success: true,
          message: `Translation updated for ${data.locale}: ${data.key}`
        });
      
      case 'delete_translation':
        if (!data.locale || !data.key) {
          return NextResponse.json(
            { error: 'Locale and key required' },
            { status: 400 }
          );
        }
        
        // In production, you'd delete from database
        return NextResponse.json({
          success: true,
          message: `Translation deleted for ${data.locale}: ${data.key}`
        });
      
      case 'import_translations':
        if (!data.locale || !data.translations) {
          return NextResponse.json(
            { error: 'Locale and translations object required' },
            { status: 400 }
          );
        }
        
        // In production, you'd bulk import to database
        const translationCount = Object.keys(data.translations).length;
        return NextResponse.json({
          success: true,
          message: `${translationCount} translations imported for ${data.locale}`
        });
      
      case 'export_translations':
        if (!data.locale) {
          return NextResponse.json(
            { error: 'Locale required' },
            { status: 400 }
          );
        }
        
        // In production, you'd export from database
        return NextResponse.json({
          success: true,
          data: {
            locale: data.locale,
            translations: {}, // Would contain actual translations
            exportedAt: new Date().toISOString(),
          }
        });
      
      case 'convert_currency':
        if (!data.amount || !data.from || !data.to) {
          return NextResponse.json(
            { error: 'Amount, from, and to currencies required' },
            { status: 400 }
          );
        }
        
        try {
          const convertedAmount = i18nManager.convertCurrency(data.amount, data.from, data.to);
          return NextResponse.json({
            success: true,
            data: {
              originalAmount: data.amount,
              fromCurrency: data.from,
              toCurrency: data.to,
              convertedAmount,
              formattedAmount: i18nManager.formatCurrency(convertedAmount, data.to),
            }
          });
        } catch (error) {
          return NextResponse.json(
            { error: 'Currency conversion failed' },
            { status: 400 }
          );
        }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('I18n action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform internationalization action' },
      { status: 500 }
    );
  }
}

export { GET, POST };
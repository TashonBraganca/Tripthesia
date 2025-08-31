import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const AlertSchema = z.object({
  alert: z.string(),
  error: z.object({
    id: z.string(),
    message: z.string(),
    stack: z.string().optional(),
    context: z.object({
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      category: z.enum(['client', 'server', 'database', 'api', 'auth', 'payment']),
      environment: z.enum(['development', 'staging', 'production']),
      userId: z.string().optional(),
      url: z.string().optional(),
      timestamp: z.string(),
      additionalData: z.record(z.any()).optional()
    })
  }),
  timestamp: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedAlert = AlertSchema.parse(body);

    console.error('🚨 IMMEDIATE ALERT:', {
      type: validatedAlert.alert,
      severity: validatedAlert.error.context.severity,
      message: validatedAlert.error.message,
      environment: validatedAlert.error.context.environment,
      category: validatedAlert.error.context.category,
      timestamp: validatedAlert.timestamp
    });

    // Process immediate alert
    await processImmediateAlert(validatedAlert);

    return NextResponse.json({
      success: true,
      alertProcessed: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to process immediate alert:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

async function processImmediateAlert(alertData: any): Promise<void> {
  const { error, timestamp } = alertData;
  
  // 1. Log critical error immediately
  console.error(`🔥 CRITICAL ERROR DETECTED:`, {
    message: error.message,
    environment: error.context.environment,
    userId: error.context.userId,
    url: error.context.url,
    timestamp: timestamp,
    stack: error.stack
  });

  // 2. Send to external monitoring services
  const monitoringTasks = [];

  // Slack/Discord webhook for immediate team notification
  if (process.env.CRITICAL_ALERT_WEBHOOK_URL) {
    monitoringTasks.push(
      sendSlackAlert(error, timestamp)
    );
  }

  // Email notification for critical errors
  if (process.env.CRITICAL_ALERT_EMAIL) {
    monitoringTasks.push(
      sendEmailAlert(error, timestamp)
    );
  }

  // SMS/Phone notification for production critical errors
  if (error.context.environment === 'production' && process.env.SMS_ALERT_API) {
    monitoringTasks.push(
      sendSMSAlert(error, timestamp)
    );
  }

  // Send to APM services
  monitoringTasks.push(
    sendToAPM(error, timestamp)
  );

  // Execute all monitoring tasks in parallel
  await Promise.allSettled(monitoringTasks);
}

async function sendSlackAlert(error: any, timestamp: string): Promise<void> {
  try {
    const webhookUrl = process.env.CRITICAL_ALERT_WEBHOOK_URL;
    if (!webhookUrl) return;

    const payload = {
      text: `🚨 CRITICAL ERROR in ${error.context.environment.toUpperCase()}`,
      attachments: [
        {
          color: 'danger',
          fields: [
            {
              title: 'Error Message',
              value: error.message,
              short: false
            },
            {
              title: 'Environment',
              value: error.context.environment,
              short: true
            },
            {
              title: 'Category',
              value: error.context.category,
              short: true
            },
            {
              title: 'URL',
              value: error.context.url || 'Unknown',
              short: false
            },
            {
              title: 'User ID',
              value: error.context.userId || 'Anonymous',
              short: true
            },
            {
              title: 'Timestamp',
              value: timestamp,
              short: true
            }
          ]
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('✅ Slack alert sent successfully');
  } catch (slackError) {
    console.error('Failed to send Slack alert:', slackError);
  }
}

async function sendEmailAlert(error: any, timestamp: string): Promise<void> {
  try {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('📧 Email alert would be sent:', {
      to: process.env.CRITICAL_ALERT_EMAIL,
      subject: `🚨 CRITICAL ERROR: ${error.message}`,
      environment: error.context.environment,
      timestamp
    });
    
    // Example implementation with SendGrid:
    /*
    if (process.env.SENDGRID_API_KEY) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: process.env.CRITICAL_ALERT_EMAIL }]
          }],
          from: { email: 'alerts@tripthesia.com' },
          subject: `🚨 CRITICAL ERROR: ${error.message}`,
          content: [{
            type: 'text/html',
            value: generateEmailHTML(error, timestamp)
          }]
        })
      });
    }
    */
  } catch (emailError) {
    console.error('Failed to send email alert:', emailError);
  }
}

async function sendSMSAlert(error: any, timestamp: string): Promise<void> {
  try {
    // SMS alert for production critical errors
    console.log('📱 SMS alert would be sent:', {
      message: `🚨 CRITICAL: ${error.message.substring(0, 100)}...`,
      environment: error.context.environment,
      timestamp
    });

    // Example implementation with Twilio:
    /*
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_PHONE_NUMBER!,
          To: process.env.CRITICAL_ALERT_PHONE!,
          Body: `🚨 Tripthesia Critical Error: ${error.message.substring(0, 120)}`
        })
      });
    }
    */
  } catch (smsError) {
    console.error('Failed to send SMS alert:', smsError);
  }
}

async function sendToAPM(error: any, timestamp: string): Promise<void> {
  try {
    // Send to Application Performance Monitoring services
    // This could integrate with Sentry, DataDog, New Relic, etc.
    
    console.log('📊 APM integration:', {
      service: 'tripthesia',
      error: error.message,
      environment: error.context.environment,
      category: error.context.category,
      timestamp
    });

    // Example Sentry integration:
    /*
    if (process.env.SENTRY_DSN) {
      // This would be handled by Sentry SDK normally
      await fetch(`${process.env.SENTRY_DSN}/api/store/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_key=${process.env.SENTRY_KEY}`
        },
        body: JSON.stringify({
          message: error.message,
          level: 'error',
          tags: {
            environment: error.context.environment,
            category: error.context.category
          },
          extra: error.context.additionalData
        })
      });
    }
    */
  } catch (apmError) {
    console.error('Failed to send to APM:', apmError);
  }
}

// Health check for alert system
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    alertSystem: 'active',
    timestamp: new Date().toISOString(),
    integrations: {
      webhook: !!process.env.CRITICAL_ALERT_WEBHOOK_URL,
      email: !!process.env.CRITICAL_ALERT_EMAIL,
      sms: !!process.env.SMS_ALERT_API,
      apm: !!process.env.SENTRY_DSN
    }
  });
}
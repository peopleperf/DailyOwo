import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/services/email-service';

export async function GET() {
  try {
    // Check environment variables
    const config = {
      resendKey: process.env.RESEND_API_KEY ? 'Set' : 'NOT SET',
      emailFrom: process.env.EMAIL_FROM || 'Using default: DailyOwo <noreply@dailyowo.com>',
      emailReplyTo: process.env.EMAIL_REPLY_TO || 'Using default: support@dailyowo.com',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    };

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY is not configured',
        config,
        instructions: [
          '1. Sign up for Resend at https://resend.com',
          '2. Get your API key from https://resend.com/api-keys',
          '3. Add to your .env.local file: RESEND_API_KEY=re_xxxxxxxxxxxx',
          '4. Restart your development server'
        ]
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      config,
      message: 'Email configuration looks good!'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check email configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({
        error: 'Email address is required'
      }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY is not configured'
      }, { status: 500 });
    }

    // Send a test email
    const result = await sendEmail({
      to: email,
      subject: 'Test Email from DailyOwo',
      template: 'verification',
      data: {
        userName: 'Test User',
        verificationCode: '123456',
        verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=test-token`,
        expiryHours: 24
      }
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`
      });
    } else {
      return NextResponse.json({
        error: 'Failed to send email',
        hint: 'Check your server logs for more details'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
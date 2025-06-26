import { sendEmail } from '@/lib/services/email-service';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { to, subject, template, data, userId } = await request.json();
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }
    
    const success = await sendEmail({
      to,
      subject,
      template,
      data,
      userId
    });

    if (!success) {
      console.error('Email sending failed - check Resend logs');
      return NextResponse.json(
        { error: 'Failed to send email - check server logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
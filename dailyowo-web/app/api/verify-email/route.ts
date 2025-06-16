import { NextRequest, NextResponse } from 'next/server';
import { CustomEmailVerificationService } from '@/lib/services/custom-email-verification';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/verify-email?error=missing-token', request.url)
      );
    }

    // Verify the token
    const result = await CustomEmailVerificationService.verifyEmail(token);

    if (result.success) {
      // Redirect to success page
      return NextResponse.redirect(
        new URL('/verify-email?verified=true', request.url)
      );
    } else {
      // Redirect with error
      return NextResponse.redirect(
        new URL(`/verify-email?error=${encodeURIComponent(result.error || 'verification-failed')}`, request.url)
      );
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      new URL('/verify-email?error=server-error', request.url)
    );
  }
} 
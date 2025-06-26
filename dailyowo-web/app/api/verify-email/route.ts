import { NextRequest, NextResponse } from 'next/server';
import { CustomEmailVerificationService } from '@/lib/services/custom-email-verification';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      console.log('Email verification failed - missing token');
      return NextResponse.redirect(
        new URL('/verify-email?error=missing-token', request.url)
      );
    }

    console.log('Starting email verification for token:', token);
    const result = await CustomEmailVerificationService.verifyEmail(token);

    if (result.success) {
      console.log('Email verification successful for user:', result.userId);
      
      // Trigger verification status check in the client
      const redirectUrl = new URL('/verify-email', request.url);
      redirectUrl.searchParams.set('verified', 'true');
      
      if (result.userId) {
        redirectUrl.searchParams.set('userId', result.userId);
      }
      
      return NextResponse.redirect(redirectUrl);
    } else {
      console.log('Email verification failed:', result.error);
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
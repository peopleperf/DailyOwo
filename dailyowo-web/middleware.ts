import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be named `middleware` or exported as default
export function middleware(request: NextRequest) {
  // Example: Redirect or modify requests as needed
  // For now, just pass through all requests
  return NextResponse.next();
}

// Define which paths the middleware should apply to
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

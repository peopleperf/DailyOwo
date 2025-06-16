# Email Verification Flow Documentation

## Overview

DailyOwo uses a hybrid email verification system that handles different authentication methods appropriately:

- **Email/Password Sign-ups**: Custom verification via Resend
- **Google Sign-ins**: No verification needed (pre-verified by Google)

## Sign-up Methods Comparison

### 1. Email/Password Registration

**Flow:**
1. User creates account with email and password
2. Profile created with `emailVerified: false`
3. Custom verification email sent via Resend
4. User clicks verification link in email
5. Profile updated with `emailVerified: true`
6. User redirected to onboarding

**Email Sent:**
- Verification email with custom branding
- Contains verification link valid for 24 hours
- Sent from your domain (via Resend)

**Code Path:**
```typescript
// In signUp function
await CustomEmailVerificationService.sendVerificationEmail(
  result.user.uid,
  email,
  displayName || email.split('@')[0]
);
```

### 2. Google Sign-in

**Flow:**
1. User signs in with Google account
2. Profile created with `emailVerified: true` (automatically)
3. Welcome email sent to new users
4. User proceeds directly to onboarding/dashboard

**Email Sent:**
- Welcome email only (for new users)
- No verification needed
- Google has already verified the email

**Code Path:**
```typescript
// In signInWithGoogle function
if (!profile) {
  // For Google sign-ins, email is already verified by Google
  await createUserProfile(result.user, {
    emailVerified: true,
    emailVerifiedAt: serverTimestamp()
  });
  
  // Send welcome email to new Google users
  await sendEmail({
    to: result.user.email,
    subject: 'Welcome to DailyOwo!',
    template: 'welcome',
    data: {
      userName: result.user.displayName || result.user.email.split('@')[0]
    }
  });
}
```

## Verification Check Logic

The app checks email verification status in `handleRedirect`:

```typescript
const isEmailVerified = user.emailVerified || profile.emailVerified;
```

This checks both:
- `user.emailVerified` - Firebase Auth's built-in field
- `profile.emailVerified` - Our custom field in Firestore

## Testing Email Verification

### Test Pages Available:

1. **Email Configuration Test**: `/test/email-test`
   - Check if Resend is properly configured
   - Verify environment variables

2. **Google Auth Test**: `/test/google-auth-test`
   - View current user's verification status
   - See which sign-in method was used
   - Understand expected behavior

## Environment Setup

Required environment variables in `.env.local`:

```env
# Resend Configuration
RESEND_API_KEY=re_xxxxxxxxxxxx

# Optional but recommended
EMAIL_FROM=DailyOwo <noreply@yourdomain.com>
EMAIL_REPLY_TO=support@yourdomain.com

# App URL for verification links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Issues & Solutions

### Issue: Still receiving Firebase verification emails
**Solution**: The code has been updated to remove Firebase email fallback. Only custom Resend emails are sent now.

### Issue: Google users stuck on verification page
**Solution**: Google users should automatically have `emailVerified: true`. If not, check:
1. The user profile creation logic for Google sign-ins
2. The redirect logic in `handleRedirect`

### Issue: Resend emails not sending
**Solution**: 
1. Check if `RESEND_API_KEY` is set in `.env.local`
2. Restart the development server after adding the key
3. Visit `/test/email-test` to diagnose

## Security Considerations

1. **Verification tokens** are:
   - Cryptographically secure (256-bit)
   - Single-use only
   - Expire after 24 hours
   - Deleted after use

2. **Email verification** is required for:
   - All email/password sign-ups
   - Access to protected routes
   - Completing onboarding

3. **Google sign-ins** are trusted because:
   - Google has already verified the email
   - OAuth provides secure authentication
   - No additional verification needed 
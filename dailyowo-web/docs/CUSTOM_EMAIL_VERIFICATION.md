# Custom Email Verification Setup

## Current Setup

Currently, the app uses a hybrid approach for email verification:

1. **Firebase Authentication** sends the verification email from `noreply@daily-owo.firebaseapp.com`
2. **Resend** sends a branded notification email from your custom domain

## Why Firebase Uses firebaseapp.com

Firebase Authentication's email verification is a secure, built-in feature that:
- Handles verification link generation
- Manages secure token validation
- Updates the user's verification status automatically

By default, Firebase sends these emails from their domain for security and compliance reasons.

## Options for Custom Domain Emails

### Option 1: Use Firebase's Custom Domain (Recommended for Enterprise)

Firebase allows custom domains for authentication emails with a Firebase Enterprise plan:

1. Go to Firebase Console → Authentication → Templates
2. Configure custom domain under "Email address verification"
3. Verify domain ownership via DNS records
4. All Firebase auth emails will use your domain

**Pros:**
- Fully branded experience
- Maintains Firebase's security features
- No custom code needed

**Cons:**
- Requires Firebase Enterprise plan
- DNS configuration required

### Option 2: Implement Custom Verification (Current Partial Implementation)

Build your own verification system:

```typescript
// 1. Generate verification token
const verificationToken = crypto.randomUUID();

// 2. Store token in Firestore
await setDoc(doc(db, 'emailVerifications', userId), {
  token: verificationToken,
  email: user.email,
  createdAt: serverTimestamp(),
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
});

// 3. Send email via Resend with custom link
await sendEmail({
  to: user.email,
  subject: 'Verify your DailyOwo email',
  template: 'verification',
  data: {
    verificationLink: `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${verificationToken}`,
  },
});

// 4. Create API endpoint to verify token
// 5. Manually update user's email verification status
```

**Pros:**
- Full control over email design and domain
- No Firebase branding

**Cons:**
- More complex implementation
- Need to handle security, expiration, and edge cases
- Requires custom API endpoints

### Option 3: Hybrid Approach (Currently Implemented)

The current implementation uses Firebase for the actual verification (security) while sending a branded notification email via Resend:

1. User signs up
2. Firebase sends verification email from firebaseapp.com
3. Resend sends a branded "Welcome" email
4. User verifies via Firebase link
5. App checks verification status

## Recommended Approach

For most use cases, the current hybrid approach is sufficient because:

1. **Security**: Firebase handles the secure verification process
2. **Branding**: Users still receive branded emails for other communications
3. **Simplicity**: No custom verification logic to maintain
4. **Cost**: No enterprise plan required

## To Improve Current Setup

1. **Update Email Templates**: Ensure the Resend welcome email mentions to look for the verification email
2. **Add Email Whitelist Instructions**: Tell users to whitelist both domains
3. **Consider Email Sequencing**: Send the branded welcome email after verification is complete

## Future Enhancement

If you need fully branded verification emails without the Enterprise plan, consider implementing a custom verification system as outlined in Option 2. This would involve:

1. Creating a verification tokens collection in Firestore
2. Building an API endpoint for verification
3. Implementing token expiration and cleanup
4. Handling edge cases (expired tokens, already verified emails, etc.)

The code structure is already in place to support this enhancement if needed. 
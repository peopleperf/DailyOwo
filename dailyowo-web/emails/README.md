# DailyOwo Email System

This directory contains all email templates and configurations for the DailyOwo email notification system powered by Resend and React Email.

## Setup

### 1. Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Add to your `.env.local`:

```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=DailyOwo <noreply@yourdomain.com>
EMAIL_REPLY_TO=support@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Verify Domain (Production)
For production, verify your domain in Resend dashboard to send from your custom domain.

## Email Templates

All templates use React Email components for beautiful, responsive designs.

### Authentication Emails
- **WelcomeEmail** - New user welcome
- **VerificationEmail** - Email verification
- **PasswordResetEmail** - Password reset

### Notification Emails
- **FamilyInvitationEmail** - Family invitations
- **TransactionAlertEmail** - Transaction notifications
- **BudgetAlertEmail** - Budget warnings/exceeded
- **GoalAchievementEmail** - Goal completions
- **SecurityAlertEmail** - Security notifications
- **MonthlyReportEmail** - Monthly summaries
- **PaymentReminderEmail** - Bill reminders

## Usage

### Send an Email
```typescript
import { emailService } from '@/lib/services/email-service';

// Welcome email
await emailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe'
);

// Budget alert
await emailService.sendBudgetAlert(
  'user@example.com',
  'John Doe',
  'Groceries',
  85, // percentage used
  425.50, // amount used
  500, // budget limit
  'warning'
);
```

### Email Testing

#### Local Development
Emails will be sent to real addresses even in development. Use test email addresses or configure Resend test mode.

#### Preview Templates
```bash
npm run email:dev
```

This starts the React Email preview server at `http://localhost:3001`

### Creating New Templates

1. Create new template in `emails/`:
```tsx
import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button } from './components/BaseEmail';

interface YourEmailProps {
  userName: string;
  // other props
}

export const YourEmail: React.FC<YourEmailProps> = ({
  userName,
}) => {
  return (
    <BaseEmail
      preview="Email preview text"
      heading="Email Heading"
    >
      <Text style={paragraph}>
        Hi {userName},
      </Text>
      // Your content
    </BaseEmail>
  );
};
```

2. Export from `index.tsx`
3. Add method to `email-service.ts`

## Email Triggers

### Automatic Emails
- **Registration**: Welcome + Verification
- **Password Reset**: Reset link
- **Password Change**: Security alert
- **Budget Alerts**: At 80% and exceeded
- **Family Invites**: Invitation link

### Manual/Scheduled (Future)
- Monthly reports
- Goal reminders
- Bill payment reminders
- Inactive account notices

## Error Handling

All email sends are wrapped in try-catch blocks. Failed emails:
- Log errors to console
- Don't break app functionality
- Can be retried manually

## Rate Limits

Resend free tier: 100 emails/day
Paid plans: Higher limits available

## Security

- Never send sensitive data (passwords, full account numbers)
- Use secure links with tokens
- Implement unsubscribe options
- Follow email best practices

## Testing Checklist

- [ ] Test email delivery
- [ ] Verify links work correctly
- [ ] Check mobile responsiveness
- [ ] Test with various email clients
- [ ] Verify unsubscribe works
- [ ] Check spam score

## Troubleshooting

### Emails not sending
1. Check API key is correct
2. Verify domain (for custom domains)
3. Check Resend dashboard for errors
4. Check console logs

### Emails in spam
1. Verify domain with SPF/DKIM
2. Use consistent from address
3. Include unsubscribe link
4. Avoid spam trigger words

## Future Enhancements

- [ ] Email preferences UI
- [ ] Batch email queuing
- [ ] A/B testing templates
- [ ] Analytics integration
- [ ] Multi-language support
- [ ] SMS notifications 
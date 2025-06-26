import { Resend } from 'resend';
import { getUserEmailLocale, getLocalizedEmailContent, type EmailLocale } from './email-localization';
import React from 'react';

// Import email templates
import WelcomeEmail from '@/emails/WelcomeEmail';
import VerificationEmail from '@/emails/VerificationEmail';
import PasswordResetEmail from '@/emails/PasswordResetEmail';
import FamilyInvitationEmail from '@/emails/FamilyInvitationEmail';
import TransactionAlertEmail from '@/emails/TransactionAlertEmail';
import BudgetAlertEmail from '@/emails/BudgetAlertEmail';
import GoalAchievementEmail from '@/emails/GoalAchievementEmail';
import GoalReminderEmail from '@/emails/GoalReminderEmail';
import SecurityAlertEmail from '@/emails/SecurityAlertEmail';
import MonthlyReportEmail from '@/emails/MonthlyReportEmail';
import PaymentReminderEmail from '@/emails/PaymentReminderEmail';

// Initialize Resend only if API key is available
// Resend should only be initialized server-side
let resend: Resend | null = null;

if (typeof window === 'undefined') {
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    resend = new Resend(apiKey);
  }
}

export type EmailTemplate = 
  | 'welcome'
  | 'verification'
  | 'password-reset'
  | 'family-invitation'
  | 'transaction-alert'
  | 'budget-alert'
  | 'goal-achievement'
  | 'goal-reminder'
  | 'security-alert'
  | 'monthly-report'
  | 'payment-reminder';

interface EmailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: any;
  userId?: string; // For localization
}

/**
 * Send email using Resend
 */
export async function sendEmail({ to, subject, template, data, userId }: EmailOptions): Promise<boolean> {
  // Validate required fields
  if (!to || !subject || !template) {
    console.error('Missing required email parameters:', { to, subject, template });
    return false;
  }

  // On client side, use API route
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, template, data, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to send email via API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || 'Unknown error'
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending email via API:', error);
      return false;
    }
  }

  // Server-side: Check if Resend is configured
  if (!resend) {
    const errorMsg = 'Email service not configured. Please set RESEND_API_KEY environment variable.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  try {
    // Get user's preferred locale if userId is provided
    let locale: EmailLocale = 'en';
    if (userId) {
      locale = await getUserEmailLocale(userId);
    }
    
    // Get localized content
    const localizedContent = getLocalizedEmailContent(template as any, locale, data);
    
    // Create email component based on template
    let emailComponent: any;
    const emailData = {
      ...data,
      // Add localized common strings
      greeting: localizedContent.greeting,
      signoff: localizedContent.signoff,
      teamName: localizedContent.teamName,
      locale,
    };
    
    switch (template) {
      case 'welcome':
        emailComponent = WelcomeEmail({ 
          userName: data.userName,
          ...emailData 
        });
        break;
        
      case 'verification':
        emailComponent = VerificationEmail({
          userName: data.userName,
          verificationCode: data.verificationCode,
          verificationLink: data.verificationLink,
          expiryHours: data.expiryHours,
          ...emailData
        });
        break;
        
      case 'password-reset':
        emailComponent = PasswordResetEmail({
          userName: data.userName,
          resetLink: data.resetLink,
          ...emailData
        });
        break;
        
      case 'family-invitation':
        emailComponent = FamilyInvitationEmail({
          inviteeName: data.inviteeName,
          inviterName: data.inviterName,
          familyName: data.familyName,
          role: data.role,
          joinLink: data.joinLink,
          personalMessage: data.personalMessage,
          ...emailData
        });
        break;
        
      case 'transaction-alert':
        emailComponent = TransactionAlertEmail({
          userName: data.userName,
          transactionAmount: data.transactionAmount,
          transactionType: data.transactionType,
          category: data.category,
          description: data.description,
          accountBalance: data.accountBalance,
          currency: data.currency,
          ...emailData
        });
        break;
        
      case 'budget-alert':
        emailComponent = BudgetAlertEmail({
          userName: data.userName,
          budgetName: data.budgetName,
          spent: data.spent,
          limit: data.limit,
          percentage: data.percentage,
          remaining: data.remaining,
          daysLeft: data.daysLeft,
          currency: data.currency,
          ...emailData
        });
        break;
        
      case 'goal-achievement':
        emailComponent = GoalAchievementEmail({
          userName: data.userName,
          goalName: data.goalName,
          targetAmount: data.targetAmount,
          achievedDate: data.achievedDate,
          duration: data.duration,
          nextGoalSuggestion: data.nextGoalSuggestion,
          currency: data.currency,
          ...emailData
        });
        break;
        
      case 'goal-reminder':
        emailComponent = GoalReminderEmail({
          userName: data.userName,
          goalName: data.goalName,
          currentAmount: data.currentAmount,
          targetAmount: data.targetAmount,
          remainingAmount: data.remainingAmount,
          progressPercentage: data.progressPercentage,
          daysRemaining: data.daysRemaining,
          projectedCompletion: data.projectedCompletion,
          suggestedContribution: data.suggestedContribution,
          currency: data.currency,
          ...emailData
        });
        break;
        
      case 'security-alert':
        emailComponent = SecurityAlertEmail({
          userName: data.userName,
          alertType: data.alertType,
          details: data.details,
          timestamp: data.timestamp,
          ipAddress: data.ipAddress,
          location: data.location,
          device: data.device,
          ...emailData
        });
        break;
        
      case 'monthly-report':
        emailComponent = MonthlyReportEmail({
          userName: data.userName,
          month: data.month,
          year: data.year,
          totalIncome: data.totalIncome,
          totalExpenses: data.totalExpenses,
          netSavings: data.netSavings,
          topCategory: data.topCategory,
          savingsRate: data.savingsRate,
          comparisonLastMonth: data.comparisonLastMonth,
          currency: data.currency,
          ...emailData
        });
        break;
        
      case 'payment-reminder':
        emailComponent = PaymentReminderEmail({
          userName: data.userName,
          billName: data.billName,
          amount: data.amount,
          dueDate: data.dueDate,
          daysUntilDue: data.daysUntilDue,
          category: data.category,
          currency: data.currency,
          ...emailData
        });
        break;
        
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
    
    // Use localized subject or fallback to provided subject
    const finalSubject = localizedContent.subject || subject;
    
    // Send email
    const { data: resendResponse, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'DailyOwo <noreply@mails.dailyowo.com>',
      to,
      subject: finalSubject,
      react: emailComponent,
      replyTo: process.env.EMAIL_REPLY_TO || 'support@mails.dailyowo.com',
    });
    
    if (error) {
      console.error('Failed to send email:', {
        template,
        to,
        error: error.message,
        details: error
      });
      return false;
    }
    
    console.log('Email sent successfully:', {
      template,
      to,
      id: resendResponse?.id,
      subject: finalSubject
    });
    
    console.log(`Email sent successfully: ${template} to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send batch emails (for scheduled reports)
 */
export async function sendBatchEmails(
  emails: Array<EmailOptions>
): Promise<{ successful: number; failed: number }> {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value)).length;
  
  return { successful, failed };
} 
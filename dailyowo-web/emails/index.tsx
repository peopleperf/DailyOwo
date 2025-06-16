// Export all email templates for easy importing
export { WelcomeEmail } from './WelcomeEmail';
export { VerificationEmail } from './VerificationEmail';
export { PasswordResetEmail } from './PasswordResetEmail';
export { FamilyInvitationEmail } from './FamilyInvitationEmail';
export { TransactionAlertEmail } from './TransactionAlertEmail';
export { BudgetAlertEmail } from './BudgetAlertEmail';
export { GoalAchievementEmail } from './GoalAchievementEmail';
export { SecurityAlertEmail } from './SecurityAlertEmail';
export { MonthlyReportEmail } from './MonthlyReportEmail';
export { PaymentReminderEmail } from './PaymentReminderEmail';

// Re-export BaseEmail components for custom templates
export { BaseEmail } from './components/BaseEmail';
export * from './components/BaseEmail';

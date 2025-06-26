import * as React from 'react';
import { Text, Link, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, h2, card, metricLabel } from './components/BaseEmail';

interface WelcomeEmailProps {
  userName: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
}) => {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  
  return (
    <BaseEmail
      preview={`Welcome to DailyOwo • Your financial journey begins`}
      heading={`Welcome, ${userName}`}
    >
      <Text style={paragraph}>
        Your DailyOwo account is ready. Begin building your path to financial
        clarity with our premium tools and insights.
      </Text>

      <Text style={h2}>What you can achieve</Text>
      
      <div style={card}>
        <Text style={metricLabel}>TRACK</Text>
        <Text style={{...paragraph, margin: '8px 0 0'}}>
          Monitor income and expenses with elegant visualizations
        </Text>
      </div>
      
      <div style={card}>
        <Text style={metricLabel}>BUDGET</Text>
        <Text style={{...paragraph, margin: '8px 0 0'}}>
          Create intelligent budgets that adapt to your lifestyle
        </Text>
      </div>
      
      <div style={card}>
        <Text style={metricLabel}>ACHIEVE</Text>
        <Text style={{...paragraph, margin: '8px 0 0'}}>
          Set and reach financial milestones with smart tracking
        </Text>
      </div>
      
      <div style={card}>
        <Text style={metricLabel}>COLLABORATE</Text>
        <Text style={{...paragraph, margin: '8px 0 0'}}>
          Manage family finances together with refined controls
        </Text>
      </div>

      <Button href={dashboardUrl} style={button}>
        Enter Dashboard
      </Button>

      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6}}>
        For assistance, visit our{' '}
        <Link href="https://dailyowo.com/guide" style={{color: '#A67C00'}}>
          quick start guide
        </Link>{' '}
        or reply to this email.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default WelcomeEmail; 
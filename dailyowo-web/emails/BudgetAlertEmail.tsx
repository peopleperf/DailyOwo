import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, card, metric, metricLabel, alert } from './components/BaseEmail';

interface BudgetAlertEmailProps {
  userName: string;
  budgetName: string;
  spent: string;
  limit: string;
  percentage: number;
  remaining: string;
  daysLeft: number;
  currency?: string;
}

export const BudgetAlertEmail: React.FC<BudgetAlertEmailProps> = ({
  userName,
  budgetName,
  spent,
  limit,
  percentage,
  remaining,
  daysLeft,
  currency = '$',
}) => {
  const budgetsUrl = 'https://dailyowo.com/budgets';
  const isExceeded = percentage > 100;
  
  return (
    <BaseEmail
      preview={`Budget alert • ${budgetName} ${percentage}% used`}
      heading={isExceeded ? 'Budget exceeded' : 'Budget threshold reached'}
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <Text style={paragraph}>
        Your {budgetName} budget has {isExceeded ? 'exceeded its limit' : `reached ${percentage}% of its limit`}.
      </Text>
      
      <div style={card}>
        <Text style={metricLabel}>BUDGET STATUS</Text>
        <Text style={{...metric, fontSize: '24px', margin: '8px 0'}}>
          {budgetName}
        </Text>
        
        <div style={{margin: '24px 0'}}>
          <div style={{
            background: '#F5F5F5',
            borderRadius: '8px',
            height: '8px',
            overflow: 'hidden',
            position: 'relative' as const,
          }}>
            <div style={{
              background: isExceeded ? '#EF4444' : percentage >= 80 ? '#F59E0B' : '#A67C00',
              height: '100%',
              width: `${Math.min(percentage, 100)}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <Text style={{...paragraph, margin: '8px 0 0', fontSize: '14px', textAlign: 'center' as const}}>
            {percentage}% used
          </Text>
        </div>
        
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '24px'}}>
          <div>
            <Text style={{...metricLabel, fontSize: '10px'}}>SPENT</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400'}}>
              {currency}{spent}
            </Text>
          </div>
          <div style={{textAlign: 'right' as const}}>
            <Text style={{...metricLabel, fontSize: '10px'}}>LIMIT</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400'}}>
              {currency}{limit}
            </Text>
          </div>
        </div>
      </div>
      
      {!isExceeded && (
        <div style={alert}>
          {currency}{remaining} remaining • {daysLeft} days left in period
        </div>
      )}
      
      <Button href={budgetsUrl} style={button}>
        Review Budget Details
      </Button>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, marginTop: '32px'}}>
        {isExceeded 
          ? 'Consider adjusting your spending or increasing your budget limit.'
          : 'Stay mindful of your remaining budget to avoid overspending.'
        }
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default BudgetAlertEmail; 
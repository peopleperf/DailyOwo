import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, card, metric, metricLabel } from './components/BaseEmail';

interface TransactionAlertEmailProps {
  userName: string;
  transactionAmount: string;
  transactionType: 'income' | 'expense';
  category: string;
  description: string;
  accountBalance?: string;
  currency?: string;
}

export const TransactionAlertEmail: React.FC<TransactionAlertEmailProps> = ({
  userName,
  transactionAmount,
  transactionType,
  category,
  description,
  accountBalance,
  currency = '$',
}) => {
  const dashboardUrl = 'https://dailyowo.com/transactions';
  const isIncome = transactionType === 'income';
  
  return (
    <BaseEmail
      preview={`Transaction recorded • ${currency}${transactionAmount}`}
      heading="Transaction recorded"
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <div style={card}>
        <Text style={metricLabel}>{isIncome ? 'INCOME' : 'EXPENSE'}</Text>
        <Text style={{...metric, color: isIncome ? '#A67C00' : '#262659'}}>
          {isIncome ? '+' : ''}{currency}{transactionAmount}
        </Text>
        <Text style={{...paragraph, margin: '16px 0 8px', fontWeight: '400'}}>
          {description}
        </Text>
        <Text style={{...paragraph, margin: '0', fontSize: '14px', opacity: 0.6}}>
          {category}
        </Text>
      </div>
      
      {accountBalance && (
        <div style={{...card, backgroundColor: '#FAFAFA'}}>
          <Text style={metricLabel}>UPDATED BALANCE</Text>
          <Text style={{...paragraph, margin: '8px 0 0', fontSize: '20px', fontWeight: '300'}}>
            {currency}{accountBalance}
          </Text>
        </div>
      )}
      
      <Button href={dashboardUrl} style={button}>
        View All Transactions
      </Button>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, marginTop: '32px'}}>
        You're receiving this because transaction alerts are enabled. Adjust your
        notification preferences in account settings.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default TransactionAlertEmail; 
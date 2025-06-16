import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, card, metric, metricLabel, alert } from './components/BaseEmail';

interface PaymentReminderEmailProps {
  userName: string;
  billName: string;
  amount: string;
  dueDate: string;
  daysUntilDue: number;
  category: string;
  currency?: string;
}

export const PaymentReminderEmail: React.FC<PaymentReminderEmailProps> = ({
  userName,
  billName,
  amount,
  dueDate,
  daysUntilDue,
  category,
  currency = '$',
}) => {
  const billsUrl = 'https://dailyowo.com/transactions';
  const isUrgent = daysUntilDue <= 2;
  
  return (
    <BaseEmail
      preview={`Payment reminder • ${billName} due in ${daysUntilDue} days`}
      heading="Payment reminder"
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <Text style={paragraph}>
        Your {billName} payment is due {daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}.
      </Text>
      
      <div style={card}>
        <Text style={metricLabel}>UPCOMING PAYMENT</Text>
        <Text style={{...metric, fontSize: '24px', margin: '8px 0'}}>
          {billName}
        </Text>
        
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '24px'}}>
          <div>
            <Text style={{...metricLabel, fontSize: '10px'}}>AMOUNT DUE</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400', fontSize: '18px'}}>
              {currency}{amount}
            </Text>
          </div>
          <div style={{textAlign: 'right' as const}}>
            <Text style={{...metricLabel, fontSize: '10px'}}>DUE DATE</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400'}}>
              {dueDate}
            </Text>
          </div>
        </div>
        
        <Text style={{...paragraph, margin: '16px 0 0', fontSize: '14px', opacity: 0.6}}>
          {category}
        </Text>
      </div>
      
      {isUrgent && (
        <div style={alert}>
          {daysUntilDue === 0 
            ? 'Payment is due today'
            : `Only ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'} remaining`
          }
        </div>
      )}
      
      <Button href={billsUrl} style={button}>
        View Payment Details
      </Button>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, marginTop: '32px'}}>
        To manage your payment reminders, visit your account settings. This
        notification was sent based on your preferences.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default PaymentReminderEmail; 
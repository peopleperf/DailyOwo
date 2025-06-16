import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, card, metric, metricLabel } from './components/BaseEmail';

interface MonthlyReportEmailProps {
  userName: string;
  month: string;
  year: string;
  totalIncome: string;
  totalExpenses: string;
  netSavings: string;
  topCategory: string;
  savingsRate: number;
  comparisonLastMonth?: number;
  currency?: string;
}

export const MonthlyReportEmail: React.FC<MonthlyReportEmailProps> = ({
  userName,
  month,
  year,
  totalIncome,
  totalExpenses,
  netSavings,
  topCategory,
  savingsRate,
  comparisonLastMonth,
  currency = '$',
}) => {
  const dashboardUrl = 'https://dailyowo.com/dashboard';
  const isPositive = parseFloat(netSavings.replace(/[^0-9.-]/g, '')) > 0;
  
  return (
    <BaseEmail
      preview={`${month} ${year} financial summary`}
      heading={`${month} ${year} summary`}
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <Text style={paragraph}>
        Your financial summary for {month} {year} is ready for review.
      </Text>
      
      <div style={card}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
          <div>
            <Text style={metricLabel}>INCOME</Text>
            <Text style={{...metric, fontSize: '24px', color: '#A67C00'}}>
              +{currency}{totalIncome}
            </Text>
          </div>
          <div style={{textAlign: 'right' as const}}>
            <Text style={metricLabel}>EXPENSES</Text>
            <Text style={{...metric, fontSize: '24px'}}>
              {currency}{totalExpenses}
            </Text>
          </div>
        </div>
        
        <div style={{
          borderTop: '1px solid #F0F0F0',
          paddingTop: '24px',
          textAlign: 'center' as const,
        }}>
          <Text style={metricLabel}>NET {isPositive ? 'SAVINGS' : 'DEFICIT'}</Text>
          <Text style={{...metric, color: isPositive ? '#A67C00' : '#262659'}}>
            {isPositive ? '+' : ''}{currency}{netSavings}
          </Text>
          <Text style={{...paragraph, margin: '8px 0 0', fontSize: '14px', opacity: 0.6}}>
            {savingsRate}% savings rate
          </Text>
        </div>
      </div>
      
      <div style={{...card, backgroundColor: '#FAFAFA'}}>
        <Text style={metricLabel}>TOP SPENDING CATEGORY</Text>
        <Text style={{...paragraph, margin: '8px 0 0', fontWeight: '400'}}>
          {topCategory}
        </Text>
      </div>
      
      {comparisonLastMonth !== undefined && (
        <Text style={{...paragraph, fontSize: '14px', opacity: 0.6}}>
          {comparisonLastMonth > 0 
            ? `Spending increased ${comparisonLastMonth}% from last month`
            : comparisonLastMonth < 0
            ? `Spending decreased ${Math.abs(comparisonLastMonth)}% from last month`
            : 'Spending remained consistent with last month'
          }
        </Text>
      )}
      
      <Button href={dashboardUrl} style={button}>
        View Detailed Analytics
      </Button>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, marginTop: '32px'}}>
        Review your complete financial analytics, transaction history, and
        personalized insights in your dashboard.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default MonthlyReportEmail; 
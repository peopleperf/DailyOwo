import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, card, metric, metricLabel } from './components/BaseEmail';

interface GoalReminderEmailProps {
  userName: string;
  goalName: string;
  currentAmount: string;
  targetAmount: string;
  remainingAmount: string;
  progressPercentage: number;
  daysRemaining: number;
  projectedCompletion?: string;
  suggestedContribution?: string;
  currency?: string;
}

export const GoalReminderEmail: React.FC<GoalReminderEmailProps> = ({
  userName,
  goalName,
  currentAmount,
  targetAmount,
  remainingAmount,
  progressPercentage,
  daysRemaining,
  projectedCompletion,
  suggestedContribution,
  currency = '$',
}) => {
  const goalsUrl = 'https://dailyowo.com/goals';
  
  return (
    <BaseEmail
      preview={`Goal update • ${goalName} ${progressPercentage}% complete`}
      heading="Goal progress update"
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <Text style={paragraph}>
        Your progress toward "{goalName}" continues. Here's your current status.
      </Text>
      
      <div style={card}>
        <Text style={metricLabel}>GOAL PROGRESS</Text>
        <Text style={{...metric, fontSize: '24px', margin: '8px 0'}}>
          {goalName}
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
              background: progressPercentage >= 75 ? '#A67C00' : progressPercentage >= 50 ? '#D4A300' : '#E5E5E5',
              height: '100%',
              width: `${progressPercentage}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <Text style={{...paragraph, margin: '8px 0 0', fontSize: '14px', textAlign: 'center' as const}}>
            {progressPercentage}% complete
          </Text>
        </div>
        
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '24px'}}>
          <div>
            <Text style={{...metricLabel, fontSize: '10px'}}>SAVED</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400', color: '#A67C00'}}>
              {currency}{currentAmount}
            </Text>
          </div>
          <div style={{textAlign: 'center' as const}}>
            <Text style={{...metricLabel, fontSize: '10px'}}>REMAINING</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400'}}>
              {currency}{remainingAmount}
            </Text>
          </div>
          <div style={{textAlign: 'right' as const}}>
            <Text style={{...metricLabel, fontSize: '10px'}}>TARGET</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400'}}>
              {currency}{targetAmount}
            </Text>
          </div>
        </div>
      </div>
      
      <div style={{...card, backgroundColor: '#FAFAFA'}}>
        <Text style={metricLabel}>TIME REMAINING</Text>
        <Text style={{...paragraph, margin: '8px 0 0', fontWeight: '400'}}>
          {daysRemaining} days
        </Text>
        
        {suggestedContribution && (
          <>
            <Text style={{...metricLabel, marginTop: '16px'}}>SUGGESTED CONTRIBUTION</Text>
            <Text style={{...paragraph, margin: '8px 0 0', fontWeight: '400'}}>
              {suggestedContribution}
            </Text>
          </>
        )}
        
        {projectedCompletion && (
          <Text style={{...paragraph, margin: '16px 0 0', fontSize: '14px', opacity: 0.6}}>
            {projectedCompletion}
          </Text>
        )}
      </div>
      
      <Button href={goalsUrl} style={button}>
        Update Goal Progress
      </Button>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, marginTop: '32px'}}>
        Consistent contributions, even small ones, bring you closer to your
        financial milestones. Keep building momentum.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default GoalReminderEmail; 
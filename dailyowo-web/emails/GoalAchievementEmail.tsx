import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, card, metric, metricLabel } from './components/BaseEmail';

interface GoalAchievementEmailProps {
  userName: string;
  goalName: string;
  targetAmount: string;
  achievedDate: string;
  duration: string;
  nextGoalSuggestion?: string;
  currency?: string;
}

export const GoalAchievementEmail: React.FC<GoalAchievementEmailProps> = ({
  userName,
  goalName,
  targetAmount,
  achievedDate,
  duration,
  nextGoalSuggestion,
  currency = '$',
}) => {
  const goalsUrl = 'https://dailyowo.com/goals';
  
  return (
    <BaseEmail
      preview={`Goal achieved • ${goalName}`}
      heading="Milestone reached"
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <Text style={paragraph}>
        Congratulations. You've successfully achieved your financial goal.
      </Text>
      
      <div style={card}>
        <Text style={metricLabel}>GOAL COMPLETED</Text>
        <Text style={{...metric, fontSize: '24px', margin: '8px 0'}}>
          {goalName}
        </Text>
        
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '24px'}}>
          <div>
            <Text style={{...metricLabel, fontSize: '10px'}}>TARGET</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400', color: '#A67C00'}}>
              {currency}{targetAmount}
            </Text>
          </div>
          <div style={{textAlign: 'right' as const}}>
            <Text style={{...metricLabel, fontSize: '10px'}}>ACHIEVED</Text>
            <Text style={{...paragraph, margin: '4px 0 0', fontWeight: '400'}}>
              {achievedDate}
            </Text>
          </div>
        </div>
        
        <Text style={{...paragraph, margin: '16px 0 0', fontSize: '14px', opacity: 0.6, textAlign: 'center' as const}}>
          Completed in {duration}
        </Text>
      </div>
      
      {nextGoalSuggestion && (
        <Text style={paragraph}>
          Consider setting your next milestone: {nextGoalSuggestion}
        </Text>
      )}
      
      <Button href={goalsUrl} style={button}>
        Set New Goal
      </Button>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, marginTop: '32px'}}>
        Your consistent progress demonstrates strong financial discipline.
        Keep building on this momentum.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default GoalAchievementEmail; 
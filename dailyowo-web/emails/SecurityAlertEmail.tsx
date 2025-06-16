import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, error, card, metricLabel } from './components/BaseEmail';

interface SecurityAlertEmailProps {
  userName: string;
  alertType: 'login' | 'password_change' | 'device' | 'suspicious';
  details: string;
  timestamp: string;
  ipAddress?: string;
  location?: string;
  device?: string;
}

export const SecurityAlertEmail: React.FC<SecurityAlertEmailProps> = ({
  userName,
  alertType,
  details,
  timestamp,
  ipAddress,
  location,
  device,
}) => {
  const securityUrl = 'https://dailyowo.com/security';
  
  const alertTitles = {
    login: 'New login detected',
    password_change: 'Password changed',
    device: 'New device added',
    suspicious: 'Unusual activity detected',
  };
  
  return (
    <BaseEmail
      preview={`Security alert • ${alertTitles[alertType]}`}
      heading={alertTitles[alertType]}
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <Text style={paragraph}>
        We detected activity on your DailyOwo account that requires your attention.
      </Text>
      
      <div style={error}>
        {details}
      </div>
      
      <div style={card}>
        <Text style={metricLabel}>ACTIVITY DETAILS</Text>
        
        <div style={{marginTop: '16px'}}>
          <Text style={{...paragraph, margin: '8px 0', fontSize: '14px'}}>
            <span style={{opacity: 0.6}}>Time:</span> {timestamp}
          </Text>
          {device && (
            <Text style={{...paragraph, margin: '8px 0', fontSize: '14px'}}>
              <span style={{opacity: 0.6}}>Device:</span> {device}
            </Text>
          )}
          {location && (
            <Text style={{...paragraph, margin: '8px 0', fontSize: '14px'}}>
              <span style={{opacity: 0.6}}>Location:</span> {location}
            </Text>
          )}
          {ipAddress && (
            <Text style={{...paragraph, margin: '8px 0', fontSize: '14px'}}>
              <span style={{opacity: 0.6}}>IP Address:</span> {ipAddress}
            </Text>
          )}
        </div>
      </div>
      
      <Text style={paragraph}>
        If this was you, no action is needed. If you don't recognize this activity,
        secure your account immediately.
      </Text>
      
      <Button href={securityUrl} style={button}>
        Review Account Security
      </Button>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, marginTop: '32px'}}>
        For immediate assistance with account security, reply to this email or
        visit our security center.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Security Team
      </Text>
    </BaseEmail>
  );
};

export default SecurityAlertEmail; 
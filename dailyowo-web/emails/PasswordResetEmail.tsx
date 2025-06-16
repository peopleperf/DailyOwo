import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, alert } from './components/BaseEmail';

interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  userName,
  resetLink,
}) => {
  return (
    <BaseEmail
      preview="Reset your DailyOwo password"
      heading="Password reset request"
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <Text style={paragraph}>
        We received a request to reset your DailyOwo password. Select the button
        below to create a new password.
      </Text>
      
      <Button href={resetLink} style={button}>
        Reset Password
      </Button>
      
      <Text style={alert}>
        This link expires in 1 hour for security
      </Text>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, marginTop: '32px'}}>
        If you didn't request this reset, your account remains secure. No action
        is needed.
      </Text>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6}}>
        For additional security, consider enabling two-factor authentication in
        your account settings.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default PasswordResetEmail; 
import * as React from 'react';
import { Text, Link, Button } from '@react-email/components';
import { BaseEmail, paragraph, code, metricLabel, button } from './components/BaseEmail';

interface VerificationEmailProps {
  userName: string;
  verificationCode?: string;
  verificationLink?: string;
  expiryHours?: number;
}

export const VerificationEmail: React.FC<VerificationEmailProps> = ({
  userName,
  verificationCode,
  verificationLink,
  expiryHours = 24,
}) => {
  return (
    <BaseEmail
      preview="Verify your DailyOwo email"
      heading={`Email verification`}
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {userName},
      </Text>
      
      <Text style={paragraph}>
        Please confirm your email address to complete your DailyOwo setup.
      </Text>
      
      {verificationLink ? (
        <>
          <Button
            href={verificationLink}
            style={{
              ...button,
              marginTop: '32px',
              marginBottom: '32px',
            }}
          >
            Verify Email Address
          </Button>
          
          <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, textAlign: 'center'}}>
            Or copy and paste this link into your browser:
          </Text>
          
          <Text style={{...paragraph, fontSize: '13px', wordBreak: 'break-all', opacity: 0.6, textAlign: 'center'}}>
            <Link href={verificationLink} style={{ color: '#A67C00' }}>
              {verificationLink}
            </Link>
          </Text>
        </>
      ) : verificationCode ? (
        <>
          <Text style={{...metricLabel, textAlign: 'center', marginBottom: '8px', marginTop: '32px'}}>
            VERIFICATION CODE
          </Text>
          <div style={code}>{verificationCode}</div>
        </>
      ) : null}
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6, textAlign: 'center', marginTop: '24px'}}>
        This {verificationLink ? 'link' : 'code'} expires in {expiryHours} hours
      </Text>
      
      <Text style={{...paragraph, marginTop: '32px', fontSize: '14px', opacity: 0.6}}>
        If you didn't create a DailyOwo account, please disregard this email.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default VerificationEmail; 
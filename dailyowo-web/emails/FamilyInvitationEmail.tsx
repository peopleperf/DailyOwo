import * as React from 'react';
import { Text, Button } from '@react-email/components';
import { BaseEmail, paragraph, button, card, metricLabel } from './components/BaseEmail';

interface FamilyInvitationEmailProps {
  inviteeName: string;
  inviterName: string;
  familyName: string;
  role: string;
  joinLink: string;
  personalMessage?: string;
}

export const FamilyInvitationEmail: React.FC<FamilyInvitationEmailProps> = ({
  inviteeName,
  inviterName,
  familyName,
  role,
  joinLink,
  personalMessage,
}) => {
  return (
    <BaseEmail
      preview={`${inviterName} invited you to join ${familyName} on DailyOwo`}
      heading="Family finance invitation"
    >
      <Text style={{...paragraph, marginBottom: '32px'}}>
        Hello {inviteeName},
      </Text>
      
      <Text style={paragraph}>
        {inviterName} has invited you to collaborate on family finances through
        DailyOwo.
      </Text>
      
      <div style={card}>
        <Text style={metricLabel}>FAMILY</Text>
        <Text style={{...paragraph, margin: '8px 0 16px', fontSize: '20px', fontWeight: '300'}}>
          {familyName}
        </Text>
        <Text style={metricLabel}>YOUR ROLE</Text>
        <Text style={{...paragraph, margin: '8px 0 0'}}>
          {role === 'admin' ? 'Administrator' : role === 'member' ? 'Member' : 'View Only'}
        </Text>
      </div>
      
      {personalMessage && (
        <div style={{...card, backgroundColor: '#FAFAFA'}}>
          <Text style={metricLabel}>PERSONAL MESSAGE</Text>
          <Text style={{...paragraph, margin: '8px 0 0', fontStyle: 'italic'}}>
            "{personalMessage}"
          </Text>
        </div>
      )}
      
      <Text style={paragraph}>
        As a {role === 'viewer' ? 'viewer' : 'member'}, you'll {
          role === 'admin' 
            ? 'have full access to manage family finances and members'
            : role === 'member'
            ? 'be able to add transactions and view family financial data'
            : 'have read-only access to family financial insights'
        }.
      </Text>
      
      <Button href={joinLink} style={button}>
        Accept Invitation
      </Button>
      
      <Text style={{...paragraph, fontSize: '14px', opacity: 0.6}}>
        This invitation expires in 7 days. No DailyOwo account? One will be
        created when you accept.
      </Text>

      <Text style={{...paragraph, marginTop: '32px'}}>
        Best regards,<br />
        The DailyOwo Team
      </Text>
    </BaseEmail>
  );
};

export default FamilyInvitationEmail; 
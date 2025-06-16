import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface BaseEmailProps {
  preview: string;
  heading?: string;
  children: React.ReactNode;
}

export const BaseEmail: React.FC<BaseEmailProps> = ({
  preview,
  heading,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src="https://dailyowo.com/logo.png"
              width="120"
              height="40"
              alt="DailyOwo"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {heading && <Heading style={h1}>{heading}</Heading>}
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} DailyOwo • Your premium financial companion
            </Text>
            <Link href="https://dailyowo.com" style={footerLink}>
              Visit DailyOwo
            </Link>
            {' • '}
            <Link href="https://dailyowo.com/privacy" style={footerLink}>
              Privacy
            </Link>
            {' • '}
            <Link href="https://dailyowo.com/preferences" style={footerLink}>
              Email Preferences
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Shared styles - Refined with navy and gold
export const main = {
  backgroundColor: '#FFFFFF',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

export const container = {
  backgroundColor: '#FFFFFF',
  margin: '0 auto',
  padding: '48px 0',
  maxWidth: '600px',
};

export const header = {
  padding: '32px 48px',
  textAlign: 'center' as const,
};

export const logo = {
  margin: '0 auto',
};

export const content = {
  padding: '0 48px 32px',
};

export const h1 = {
  color: '#262659', // Navy
  fontSize: '32px',
  fontWeight: '300', // Light
  lineHeight: '40px',
  margin: '0 0 32px',
  textAlign: 'left' as const,
};

export const h2 = {
  color: '#262659',
  fontSize: '20px',
  fontWeight: '300',
  lineHeight: '28px',
  margin: '24px 0 16px',
};

export const paragraph = {
  color: '#262659',
  fontSize: '16px',
  fontWeight: '300',
  lineHeight: '24px',
  margin: '0 0 16px',
};

export const button = {
  backgroundColor: '#A67C00', // Gold
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: '400',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '24px 0',
};

export const buttonSecondary = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E5E5',
  borderRadius: '8px',
  color: '#262659',
  fontSize: '16px',
  fontWeight: '400',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '24px 0',
};

export const hr = {
  borderColor: '#F5F5F5',
  margin: '48px 0 32px',
};

export const footer = {
  padding: '0 48px 32px',
};

export const footerText = {
  color: '#262659',
  fontSize: '14px',
  fontWeight: '300',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '0 0 16px',
  opacity: 0.6,
};

export const footerLink = {
  color: '#262659',
  fontSize: '14px',
  fontWeight: '300',
  textDecoration: 'underline',
  opacity: 0.6,
};

export const code = {
  backgroundColor: '#F8F8FA',
  borderRadius: '8px',
  border: '1px solid #E5E5E5',
  color: '#262659',
  fontSize: '28px',
  fontWeight: '300',
  textAlign: 'center' as const,
  letterSpacing: '4px',
  padding: '24px',
  margin: '24px 0',
};

export const alert = {
  padding: '16px 20px',
  backgroundColor: '#FFF9E6',
  border: '1px solid #F0E0A6',
  borderRadius: '8px',
  color: '#7A5A00',
  fontSize: '14px',
  fontWeight: '300',
  lineHeight: '20px',
  margin: '16px 0',
};

export const success = {
  padding: '16px 20px',
  backgroundColor: '#F5F9F5',
  border: '1px solid #D4E8D4',
  borderRadius: '8px',
  color: '#2E5E2E',
  fontSize: '14px',
  fontWeight: '300',
  lineHeight: '20px',
  margin: '16px 0',
};

export const error = {
  padding: '16px 20px',
  backgroundColor: '#FEF5F5',
  border: '1px solid #F5D5D5',
  borderRadius: '8px',
  color: '#8B2C2C',
  fontSize: '14px',
  fontWeight: '300',
  lineHeight: '20px',
  margin: '16px 0',
};

// Premium card style
export const card = {
  backgroundColor: '#FAFAFA',
  border: '1px solid #F0F0F0',
  borderRadius: '12px',
  padding: '24px',
  margin: '16px 0',
};

// Metric display style
export const metric = {
  fontSize: '36px',
  fontWeight: '300',
  color: '#262659',
  margin: '8px 0',
};

export const metricLabel = {
  fontSize: '12px',
  fontWeight: '400',
  color: '#262659',
  opacity: 0.4,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0',
}; 
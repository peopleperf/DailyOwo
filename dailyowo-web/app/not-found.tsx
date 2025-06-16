import Link from 'next/link';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Container size="sm">
        <GlassContainer className="text-center p-8 md:p-12">
          <div className="w-24 h-24 glass-subtle rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Icon name="alert" size="xl" className="text-gold" />
          </div>
          
          <h1 className="text-3xl font-bold text-primary mb-4">
            Page Not Found
          </h1>
          
          <p className="text-primary/70 mb-8">
            Sorry, we couldn't find the page you're looking for.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link href="/" className="inline-block">
              <GlassButton
                variant="primary"
                goldBorder
              >
                <Icon name="home" size="sm" className="mr-2" />
                Go Home
              </GlassButton>
            </Link>
          </div>
        </GlassContainer>
      </Container>
    </div>
  );
} 
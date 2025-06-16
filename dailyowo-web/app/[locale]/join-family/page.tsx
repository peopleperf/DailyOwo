'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { familyService, FamilyInvitation } from '@/lib/firebase/family-service';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { CheckCircle, XCircle, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function JoinFamilyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [invitation, setInvitation] = useState<FamilyInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const invitationId = searchParams?.get('invitation');

  useEffect(() => {
    if (!invitationId) {
      setError('No invitation ID provided');
      setIsLoading(false);
      return;
    }

    loadInvitation();
  }, [invitationId]);

  const loadInvitation = async () => {
    if (!user?.email) {
      setError('Please sign in to accept this invitation');
      setIsLoading(false);
      return;
    }

    try {
      // Get all pending invitations for this user
      const pendingInvitations = await familyService.getPendingInvitations(user.email);
      const invitation = pendingInvitations.find(inv => inv.id === invitationId);
      
      if (!invitation) {
        setError('Invalid or expired invitation');
      } else if (new Date() > new Date(invitation.expiresAt)) {
        setError('This invitation has expired');
      } else if (invitation.invitedEmail !== user.email) {
        setError('This invitation was sent to a different email address');
      } else {
        setInvitation(invitation);
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    setIsJoining(true);
    try {
      const success = await familyService.acceptInvitation(
        invitation.id!,
        user.uid,
        user.email!,
        user.displayName || 'Family Member'
      );

      if (success) {
        setSuccess(true);
        toastSuccess('Welcome to the family!', 'You have successfully joined the family');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        throw new Error('Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toastError('Error', 'Failed to join family. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const declineInvitation = async () => {
    if (!invitation) return;

    try {
      await familyService.cancelInvitation(invitation.id!);
      toastSuccess('Invitation declined', 'You have declined the invitation');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error declining invitation:', error);
      toastError('Error', 'Failed to decline invitation');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassContainer className="max-w-md w-full p-8 text-center">
          <Users className="w-16 h-16 text-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-4">Sign In Required</h1>
          <p className="text-primary/60 mb-6">
            Please sign in to accept this family invitation
          </p>
          <GlassButton onClick={() => router.push('/auth/login')} className="w-full">
            Sign In
          </GlassButton>
        </GlassContainer>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassContainer className="max-w-md w-full p-8 text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
          <p className="text-primary/60">Loading invitation...</p>
        </GlassContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassContainer className="max-w-md w-full p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-4">Invalid Invitation</h1>
          <p className="text-primary/60 mb-6">{error}</p>
          <GlassButton onClick={() => router.push('/dashboard')} variant="secondary">
            Go to Dashboard
          </GlassButton>
        </GlassContainer>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassContainer className="max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-4">Welcome to the Family!</h1>
          <p className="text-primary/60 mb-6">
            You have successfully joined the family. Redirecting to dashboard...
          </p>
        </GlassContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassContainer className="max-w-md w-full p-8">
        <Users className="w-16 h-16 text-gold mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-primary text-center mb-2">
          Family Invitation
        </h1>
        
        <p className="text-primary/60 text-center mb-6">
          You've been invited to join a family on DailyOwo
        </p>

        {invitation && (
          <div className="space-y-4 mb-6">
            <div className="glass-subtle p-4 rounded-lg">
              <p className="text-sm text-primary/60 mb-1">Invited by</p>
              <p className="font-medium text-primary">{invitation.inviterName}</p>
            </div>

            <div className="glass-subtle p-4 rounded-lg">
              <p className="text-sm text-primary/60 mb-1">Your role will be</p>
              <p className="font-medium text-primary capitalize">{invitation.role}</p>
            </div>

            {invitation.message && (
              <div className="glass-subtle p-4 rounded-lg">
                <p className="text-sm text-primary/60 mb-1">Personal message</p>
                <p className="text-primary italic">"{invitation.message}"</p>
              </div>
            )}

            <div className="glass-subtle p-4 rounded-lg">
              <p className="text-sm text-primary/60 mb-1">Invitation expires</p>
              <p className="font-medium text-primary">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <GlassButton
            onClick={acceptInvitation}
            disabled={isJoining}
            className="flex-1"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Joining...
              </>
            ) : (
              'Accept Invitation'
            )}
          </GlassButton>
          
          <GlassButton
            onClick={declineInvitation}
            variant="secondary"
            disabled={isJoining}
            className="flex-1"
          >
            Decline
          </GlassButton>
        </div>
      </GlassContainer>
    </div>
  );
} 
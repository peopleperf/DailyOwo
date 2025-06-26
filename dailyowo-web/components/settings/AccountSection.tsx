"use client";

import { Container } from "@/components/layouts/Container";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { Loader } from "@/components/ui/Loader";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { SecuritySettingsSection } from "@/components/profile/SecuritySettingsSection";
import { useAuth } from "@/lib/firebase/auth-context";

export default function AccountSection() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size="lg" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <Container size="md" className="py-16">
        <GlassContainer className="p-6 text-center">
          <h2 className="text-lg font-light text-primary mb-3">
            Unable to load profile
          </h2>
          <p className="text-sm text-primary/70">Please try logging in again.</p>
        </GlassContainer>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-4 md:py-8">
      <ProfileHeader user={user} userProfile={userProfile} />

      <div className="space-y-4 md:space-y-6">
        <PersonalInfoSection />
        <SecuritySettingsSection />
      </div>
    </Container>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { useAuth } from '@/lib/firebase/auth-context';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection';
import { AISettingsSection } from '@/components/profile/AISettingsSection';
import { RegionalSettingsSection } from '@/components/profile/RegionalSettingsSection';
import { SecuritySettingsSection } from '@/components/profile/SecuritySettingsSection';
import { FamilyManagementSection } from '@/components/profile/FamilyManagementSection';
import { PrivacySettingsSection } from '@/components/profile/PrivacySettingsSection';
import { CASLDemo } from '@/components/demo/CASLDemo';
import { User, Settings, Users, Shield, Lock, HelpCircle } from 'lucide-react';

const PROFILE_TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'support', label: 'Support', icon: HelpCircle },
] as const;

type ProfileTab = typeof PROFILE_TABS[number]['id'];

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('account');
  const [isSaving, setIsSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-light text-gradient-gold">D</span>
          </div>
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
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
          <p className="text-sm text-primary/70">
            Please try logging in again.
          </p>
        </GlassContainer>
      </Container>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-4 md:space-y-6">
            <PersonalInfoSection />
            <SecuritySettingsSection />
          </div>
        );
      case 'preferences':
        return (
          <div className="space-y-4 md:space-y-6">
            <AISettingsSection />
            <RegionalSettingsSection />
          </div>
        );
      case 'family':
        return <FamilyManagementSection />;
      case 'privacy':
        return <PrivacySettingsSection />;
      case 'permissions':
        return <CASLDemo />;
      case 'support':
        return <SupportAndHelpSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute top-20 -left-32 w-[500px] h-[500px] bg-gold/[0.03] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute top-60 -right-32 w-[500px] h-[500px] bg-primary/[0.03] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Container size="lg" className="py-4 md:py-8">
        {/* Compact Profile Header */}
        <ProfileHeader user={user} userProfile={userProfile} />

        {/* Mobile-Optimized Profile Tabs */}
        <GlassContainer className="p-2 md:p-4 mb-4 md:mb-6">
          <div className="relative">
            {/* Desktop tabs */}
            <div className="hidden md:flex gap-1">
              {PROFILE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm ${
                    activeTab === tab.id
                      ? 'bg-gold/10 text-gold'
                      : 'text-primary/60 hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="font-light">{tab.label}</span>
                  
                  {/* Active indicator */}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeProfileTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile tabs - Horizontal scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 min-w-max">
                {PROFILE_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-gold/10 text-gold'
                        : 'text-primary/60 hover:text-primary hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-xs font-light">{tab.label}</span>
                    
                    {/* Active indicator */}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeProfileTabMobile"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassContainer>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>

        {/* Save Status */}
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-gold text-white px-4 py-2 rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-light">Saving changes...</span>
            </div>
          </motion.div>
        )}
      </Container>
    </div>
  );
}

// Combined Support and Help Section Component (Already Compact)
function SupportAndHelpSection() {
  const [supportForm, setSupportForm] = useState({
    type: 'bug',
    subject: '',
    description: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'help' | 'contact'>('help');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // TODO: Implement support ticket submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Support ticket submitted successfully! We\'ll get back to you within 24 hours.');
      setSupportForm({ type: 'bug', subject: '', description: '', email: '' });
    } catch (error) {
      alert('Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Sub-tabs */}
      <GlassContainer className="p-3">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSubTab('help')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSubTab === 'help'
                ? 'bg-gold/10 text-gold'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            Help & Documentation
          </button>
          <button
            onClick={() => setActiveSubTab('contact')}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSubTab === 'contact'
                ? 'bg-gold/10 text-gold'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            Contact Support
          </button>
        </div>
      </GlassContainer>

      {activeSubTab === 'help' ? (
        <GlassContainer className="p-4">
          <h2 className="text-base font-medium text-primary mb-3">Help & Documentation</h2>
          
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <h3 className="font-medium text-primary text-sm">Getting Started</h3>
              <div className="space-y-2">
                <a href="#" className="block p-2 glass-subtle rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-primary text-sm">Setting up your profile</h4>
                  <p className="text-xs text-primary/60">Complete your financial profile and preferences</p>
                </a>
                <a href="#" className="block p-2 glass-subtle rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-primary text-sm">Adding transactions</h4>
                  <p className="text-xs text-primary/60">Learn how to track your income and expenses</p>
                </a>
                <a href="#" className="block p-2 glass-subtle rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-primary text-sm">Setting financial goals</h4>
                  <p className="text-xs text-primary/60">Create and track your savings goals</p>
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary text-sm">Family Features</h3>
              <div className="space-y-2">
                <a href="#" className="block p-2 glass-subtle rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-primary text-sm">Inviting family members</h4>
                  <p className="text-xs text-primary/60">Add family and manage their permissions</p>
                </a>
                <a href="#" className="block p-2 glass-subtle rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-primary text-sm">Managing permissions</h4>
                  <p className="text-xs text-primary/60">Control what family members can see and do</p>
                </a>
                <a href="#" className="block p-2 glass-subtle rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-primary text-sm">Shared goals and budgets</h4>
                  <p className="text-xs text-primary/60">Collaborate on family financial goals</p>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gold/5 rounded-lg border border-gold/20">
            <h3 className="font-medium text-primary mb-1 text-sm">Need more help?</h3>
            <p className="text-xs text-primary/60 mb-2">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <button 
              onClick={() => setActiveSubTab('contact')}
              className="text-xs bg-gold text-white px-3 py-1 rounded-lg hover:bg-gold/90 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </GlassContainer>
      ) : (
        <GlassContainer className="p-4">
          <h2 className="text-base font-medium text-primary mb-3">Contact Support</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">Issue Type</label>
                  <select
                    value={supportForm.type}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, type: e.target.value }))}
                    className="glass-input w-full text-sm py-2"
                  >
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="account">Account Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary mb-1">Subject</label>
                  <input
                    type="text"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="glass-input w-full text-sm py-2"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary mb-1">Description</label>
                  <textarea
                    value={supportForm.description}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, description: e.target.value }))}
                    className="glass-input w-full h-20 text-sm"
                    placeholder="Please provide detailed information..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={supportForm.email}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                    className="glass-input w-full text-sm py-2"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold text-white py-2 rounded-lg text-sm hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-primary text-sm">Quick Help</h3>
              <div className="space-y-2">
                <div className="p-2 glass-subtle rounded-lg">
                  <h4 className="font-medium text-primary text-sm mb-1">Email Support</h4>
                  <p className="text-xs text-primary/60 mb-1">support@dailyowo.com</p>
                  <p className="text-xs text-primary/40">Response within 24 hours</p>
                </div>
                <div className="p-2 glass-subtle rounded-lg">
                  <h4 className="font-medium text-primary text-sm mb-1">Live Chat</h4>
                  <p className="text-xs text-primary/60 mb-1">Available Mon-Fri 9AM-6PM</p>
                  <p className="text-xs text-primary/40">Click the chat icon below</p>
                </div>
              </div>
            </div>
          </div>
        </GlassContainer>
      )}
    </div>
  );
} 
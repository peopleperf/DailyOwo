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
import FamilyManagementSection from '@/components/profile/FamilyManagementSection';
import { PrivacySettingsSection } from '@/components/profile/PrivacySettingsSection';
import { CASLDemo } from '@/components/demo/CASLDemo';
import { User, Settings, Users, Shield, Lock, HelpCircle, Menu, X, LogOut } from 'lucide-react';

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
  const { user, userProfile, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
      {/* Premium background pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 premium-background" />
      </div>

      <div className="flex h-screen">
        {/* Mobile Menu Button - Moved to right side */}
        <button
          className="md:hidden fixed top-6 right-6 z-50 p-3 glass rounded-xl shadow-lg"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Premium Sidebar */}
        <motion.div
          initial={false}
          animate={{
            width: sidebarCollapsed ? '80px' : '280px',
          }}
          className={`hidden md:flex flex-col glass border-r border-white/20 transition-all duration-300 ${
            sidebarCollapsed ? 'items-center' : ''
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            {!sidebarCollapsed && (
              <h2 className="text-lg font-light text-primary tracking-wide">DailyOwo</h2>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Menu className="w-4 h-4 text-primary/60" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'text-primary/60 hover:text-primary hover:bg-white/5'
                }`}
                title={sidebarCollapsed ? tab.label : undefined}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-light">{tab.label}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-6 border-t border-white/10">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/80 hover:bg-red-50/50 transition-colors"
              title={sidebarCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="font-light">Sign Out</span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Premium Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="w-80 h-full glass shadow-2xl ml-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  <h2 className="text-lg font-light text-primary mb-8 tracking-wide">DailyOwo</h2>
                  
                  <nav className="space-y-3">
                    {PROFILE_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                          activeTab === tab.id
                            ? 'bg-gold/10 text-gold border border-gold/20'
                            : 'text-primary/60 hover:text-primary hover:bg-white/5'
                        }`}
                      >
                        <tab.icon className="w-5 h-5" />
                        <span className="font-light">{tab.label}</span>
                      </button>
                    ))}
                  </nav>

                  <div className="mt-10 pt-8 border-t border-white/10">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/80 hover:bg-red-50/50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-light">Sign Out</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Premium Content Header */}
          <div className="p-8 border-b border-white/10 glass">
            <ProfileHeader user={user} userProfile={userProfile} />
          </div>

          {/* Premium Content Area */}
          <div className="flex-1 overflow-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="max-w-4xl mx-auto"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Save Status */}
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-gold text-white px-4 py-2 rounded-xl shadow-lg z-50"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-light">Saving changes...</span>
            </div>
          </motion.div>
        )}
      </div>
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

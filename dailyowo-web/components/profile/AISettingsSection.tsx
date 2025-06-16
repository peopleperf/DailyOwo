'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calculator,
  Shield,
  Clock,
  Eye,
  Zap,
  Info
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { CollapsibleCard } from '@/components/ui/CollapsibleCard';
import { useAuth } from '@/lib/firebase/auth-context';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: any;
  enabled: boolean;
  recommended?: boolean;
  premium?: boolean;
}

interface AISettings {
  globalAIEnabled: boolean;
  features: {
    insights: boolean;
    categorization: boolean;
    predictions: boolean;
    recommendations: boolean;
    optimization: boolean;
  };
  privacy: {
    dataSharing: 'minimal' | 'standard' | 'full';
    retentionPeriod: '30d' | '90d' | '1y' | 'indefinite';
    allowPersonalization: boolean;
  };
  transparency: {
    showConfidenceScores: boolean;
    explainRecommendations: boolean;
    allowCorrections: boolean;
  };
  performance: {
    analysisFrequency: 'real-time' | 'daily' | 'weekly';
    autoApply: boolean;
  };
}

export function AISettingsSection() {
  const { user, updateUserProfile } = useAuth();
  const [aiSettings, setAISettings] = useState<AISettings>({
    globalAIEnabled: true,
    features: {
      insights: true,
      categorization: true,
      predictions: true,
      recommendations: true,
      optimization: false,
    },
    privacy: {
      dataSharing: 'standard',
      retentionPeriod: '1y',
      allowPersonalization: true,
    },
    transparency: {
      showConfidenceScores: false,
      explainRecommendations: true,
      allowCorrections: true,
    },
    performance: {
      analysisFrequency: 'daily',
      autoApply: false,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const aiFeatures: AIFeature[] = [
    {
      id: 'insights',
      title: 'Financial Insights',
      description: 'Personalized analysis',
      icon: BarChart3,
      enabled: aiSettings.features.insights,
      recommended: true,
    },
    {
      id: 'categorization',
      title: 'Smart Categories',
      description: 'Auto categorization',
      icon: Brain,
      enabled: aiSettings.features.categorization,
      recommended: true,
    },
    {
      id: 'predictions',
      title: 'Predictions',
      description: 'Cash flow forecasts',
      icon: TrendingUp,
      enabled: aiSettings.features.predictions,
    },
    {
      id: 'recommendations',
      title: 'Goal Suggestions',
      description: 'AI-powered tips',
      icon: Target,
      enabled: aiSettings.features.recommendations,
      recommended: true,
    },
    {
      id: 'optimization',
      title: 'Optimization',
      description: 'Budget optimization',
      icon: Calculator,
      enabled: aiSettings.features.optimization,
      premium: true,
    },
  ];

  const handleGlobalToggle = () => {
    setAISettings(prev => ({
      ...prev,
      globalAIEnabled: !prev.globalAIEnabled,
    }));
  };

  const handleFeatureToggle = (featureId: string) => {
    setAISettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureId]: !prev.features[featureId as keyof typeof prev.features],
      },
    }));
  };

  const handlePrivacyChange = (key: keyof AISettings['privacy'], value: any) => {
    setAISettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));
  };

  const handleTransparencyToggle = (key: keyof AISettings['transparency']) => {
    setAISettings(prev => ({
      ...prev,
      transparency: {
        ...prev.transparency,
        [key]: !prev.transparency[key],
      },
    }));
  };

  const handlePerformanceChange = (key: keyof AISettings['performance'], value: any) => {
    setAISettings(prev => ({
      ...prev,
      performance: {
        ...prev.performance,
        [key]: value,
      },
    }));
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Save to Firebase using the auth context's updateUserProfile method
      await updateUserProfile({
        aiSettings: {
          enabled: aiSettings.globalAIEnabled,
          features: aiSettings.features,
          privacy: aiSettings.privacy,
          transparency: aiSettings.transparency,
          performance: aiSettings.performance
        }
      });
      
      console.log('AI settings saved successfully:', {
        enabled: aiSettings.globalAIEnabled,
        features: aiSettings.features,
        privacy: aiSettings.privacy,
        transparency: aiSettings.transparency,
        performance: aiSettings.performance
      });
      
      // TODO: Show success toast notification
      
    } catch (error) {
      console.error('Error saving AI settings:', error);
      // TODO: Show error toast notification
      alert('Failed to save AI settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Master Toggle Component
  const masterToggle = (
    <div className="flex items-center gap-2">
      <span className={`text-xs ${aiSettings.globalAIEnabled ? 'text-gold' : 'text-primary/60'}`}>
        {aiSettings.globalAIEnabled ? 'Enabled' : 'Disabled'}
      </span>
      <button
        onClick={handleGlobalToggle}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          aiSettings.globalAIEnabled ? 'bg-gold' : 'bg-gray-300'
        }`}
      >
        <motion.div
          animate={{ x: aiSettings.globalAIEnabled ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md"
        />
      </button>
    </div>
  );

  return (
    <CollapsibleCard
      title="AI Settings"
      subtitle="Control AI features & privacy"
      icon={<Brain className="w-5 h-5 text-gold" />}
      defaultExpanded={false}
    >
      <div className="space-y-4">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-3 glass-subtle rounded-lg">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-gold" />
            <div>
              <h4 className="text-sm font-medium text-primary">AI Features</h4>
              <p className="text-xs text-primary/60">Enable all AI features</p>
            </div>
          </div>
          {masterToggle}
        </div>
        {/* Compact AI Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {aiFeatures.map((feature) => (
            <div
              key={feature.id}
              className={`p-2 glass-subtle rounded-lg transition-all ${
                !aiSettings.globalAIEnabled ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <feature.icon className={`w-3 h-3 ${feature.enabled ? 'text-gold' : 'text-primary/40'}`} />
                  <div>
                    <div className="flex items-center gap-1">
                      <h4 className="font-medium text-primary text-xs">{feature.title}</h4>
                      {feature.recommended && (
                        <span className="text-[10px] bg-gold/10 text-gold px-1 py-0.5 rounded">
                          Rec
                        </span>
                      )}
                      {feature.premium && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded">
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-primary/60">{feature.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleFeatureToggle(feature.id)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    feature.enabled ? 'bg-gold' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: feature.enabled ? 16 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Privacy & Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Privacy Controls */}
          <div className="glass-subtle rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-primary">Privacy</span>
            </div>
            
            <div className="space-y-3">
              {/* Data Sharing Level */}
              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Data Sharing
                </label>
                <select
                  value={aiSettings.privacy.dataSharing}
                  onChange={(e) => handlePrivacyChange('dataSharing', e.target.value)}
                  className="glass-input w-full text-xs py-1"
                >
                  <option value="minimal">Minimal</option>
                  <option value="standard">Standard</option>
                  <option value="full">Full</option>
                </select>
              </div>

              {/* Data Retention */}
              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Retention
                </label>
                <select
                  value={aiSettings.privacy.retentionPeriod}
                  onChange={(e) => handlePrivacyChange('retentionPeriod', e.target.value)}
                  className="glass-input w-full text-xs py-1"
                >
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="1y">1 year</option>
                  <option value="indefinite">Indefinite</option>
                </select>
              </div>

              {/* Personalization */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-primary text-xs">Personalization</h4>
                  <p className="text-[10px] text-primary/60">Learn from behavior</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('allowPersonalization', !aiSettings.privacy.allowPersonalization)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    aiSettings.privacy.allowPersonalization ? 'bg-gold' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: aiSettings.privacy.allowPersonalization ? 16 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Performance & Transparency */}
          <div className="glass-subtle rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-primary">Performance</span>
            </div>
            
            <div className="space-y-3">
              {/* Analysis Frequency */}
              <div>
                <label className="block text-xs font-medium text-primary mb-1">
                  Analysis
                </label>
                <select
                  value={aiSettings.performance.analysisFrequency}
                  onChange={(e) => handlePerformanceChange('analysisFrequency', e.target.value)}
                  className="glass-input w-full text-xs py-1"
                >
                  <option value="real-time">Real-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {/* Auto-apply */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-primary text-xs">Auto-apply</h4>
                  <p className="text-[10px] text-primary/60">Apply suggestions</p>
                </div>
                <button
                  onClick={() => handlePerformanceChange('autoApply', !aiSettings.performance.autoApply)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${
                    aiSettings.performance.autoApply ? 'bg-gold' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: aiSettings.performance.autoApply ? 16 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-md"
                  />
                </button>
              </div>

              {/* Transparency Options */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 mb-1">
                  <Eye className="w-3 h-3 text-gold" />
                  <span className="text-xs font-medium text-primary">Transparency</span>
                </div>
                
                {[
                  { key: 'explainRecommendations' as const, title: 'Explain AI' },
                  { key: 'allowCorrections' as const, title: 'Allow Fixes' },
                ].map((option) => (
                  <div key={option.key} className="flex items-center justify-between">
                    <span className="text-xs text-primary">{option.title}</span>
                    <button
                      onClick={() => handleTransparencyToggle(option.key)}
                      className={`relative w-6 h-3 rounded-full transition-colors ${
                        aiSettings.transparency[option.key] ? 'bg-gold' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: aiSettings.transparency[option.key] ? 12 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full shadow-md"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compact Save Button */}
        <div className="flex justify-end">
          <GlassButton
            variant="primary"
            goldBorder
            size="sm"
            onClick={saveSettings}
            disabled={isSaving}
            className="text-xs"
          >
            {isSaving ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              'Save Settings'
            )}
          </GlassButton>
        </div>
      </div>
    </CollapsibleCard>
  );
} 
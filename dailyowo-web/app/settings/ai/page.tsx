"use client";

import { useState, useEffect } from "react";
import { GlassContainer } from "@/components/ui/GlassContainer";
import { GlassButton } from "@/components/ui/GlassButton";
import { useAuth } from "@/lib/firebase/auth-context";
import { Brain, Shield, Eye, EyeOff, Settings, Info } from "lucide-react";

interface AISettings {
  aiAccessEnabled: boolean;
  dataShareLevel: 'basic' | 'standard' | 'comprehensive';
  personalizedInsights: boolean;
  chatHistory: boolean;
  dataRetention: '30' | '90' | '365' | 'forever';
}

const DEFAULT_SETTINGS: AISettings = {
  aiAccessEnabled: true,
  dataShareLevel: 'comprehensive',
  personalizedInsights: true,
  chatHistory: true,
  dataRetention: '365'
};

export default function AISettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    
    try {
      // Load user's AI settings from Firestore
      const { getFirebaseDb } = await import('@/lib/firebase/config');
      const { doc, getDoc } = await import('firebase/firestore');
      
      const db = await getFirebaseDb();
      if (!db) return;
      
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'ai');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...settingsDoc.data() });
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    setSaveStatus('saving');
    
    try {
      const { getFirebaseDb } = await import('@/lib/firebase/config');
      const { doc, setDoc } = await import('firebase/firestore');
      
      const db = await getFirebaseDb();
      if (!db) throw new Error('Database not available');
      
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'ai');
      await setDoc(settingsRef, {
        ...settings,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
      </div>

      <GlassContainer className="p-6 space-y-6">
        {/* AI Access Control */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Access Control</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable AI Features</h3>
              <p className="text-sm text-gray-600">
                Allow OWO AI to access your financial data for personalized insights and assistance
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.aiAccessEnabled}
                onChange={(e) => updateSetting('aiAccessEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Data Sharing Level */}
        {settings.aiAccessEnabled && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Data Sharing Level</h2>
            </div>
            
            <div className="space-y-3">
              {[
                {
                  value: 'basic' as const,
                  label: 'Basic',
                  description: 'Share only account balances and basic transaction categories'
                },
                {
                  value: 'standard' as const,
                  label: 'Standard',
                  description: 'Share transaction details, budgets, and spending patterns'
                },
                {
                  value: 'comprehensive' as const,
                  label: 'Comprehensive',
                  description: 'Share all financial data including goals, investments, and detailed analytics'
                }
              ].map((option) => (
                <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="dataShareLevel"
                    value={option.value}
                    checked={settings.dataShareLevel === option.value}
                    onChange={(e) => updateSetting('dataShareLevel', e.target.value as AISettings['dataShareLevel'])}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* AI Features */}
        {settings.aiAccessEnabled && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Features</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Personalized Insights</h3>
                  <p className="text-sm text-gray-600">
                    Get AI-powered insights tailored to your spending habits and financial goals
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.personalizedInsights}
                    onChange={(e) => updateSetting('personalizedInsights', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Chat History</h3>
                  <p className="text-sm text-gray-600">
                    Save your AI chat conversations for better context in future interactions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.chatHistory}
                    onChange={(e) => updateSetting('chatHistory', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Data Retention */}
        {settings.aiAccessEnabled && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Data Retention</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How long should we keep your AI interaction data?
              </label>
              <select
                value={settings.dataRetention}
                onChange={(e) => updateSetting('dataRetention', e.target.value as AISettings['dataRetention'])}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="forever">Until manually deleted</option>
              </select>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Your Privacy Matters</p>
              <p>
                Your financial data is encrypted and processed securely. AI features use Firebase Admin SDK 
                with proper authentication. You can disable AI access or adjust data sharing levels at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <GlassButton
            onClick={saveSettings}
            disabled={loading}
            className="px-6 py-2"
          >
            {loading ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error - Retry' : 'Save Settings'}
          </GlassButton>
        </div>
      </GlassContainer>
    </div>
  );
}
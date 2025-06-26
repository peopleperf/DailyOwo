'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Calendar, Shield, Download, Upload, Calculator } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { BudgetData, BudgetMethod, createBudgetFromMethod } from '@/lib/financial-logic/budget-logic';
import { BudgetMethodSelector } from './BudgetMethodSelector';
import { getFirebaseDb } from '@/lib/firebase/config';
import { getAuth } from 'firebase/auth';
import { budgetService } from '@/lib/firebase/budget-service';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

interface BudgetSettingsTabProps {
  budgetData: BudgetData;
  onUpdate: () => void;
}

export function BudgetSettingsTab({ budgetData, onUpdate }: BudgetSettingsTabProps) {
  const [settings, setSettings] = useState({
    autoRollover: true,
    alertsEnabled: true,
    alertThreshold: 80,
    monthlyReset: true,
    trackSavings: true,
    includeInvestments: false,
  });

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const db = await getFirebaseDb();
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!db || !user) return;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.budgetSettings) {
            setSettings(userData.budgetSettings);
          }
        }
      } catch (error) {
        console.error('Error loading budget settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = async (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    try {
      const db = await getFirebaseDb();
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!db || !user) {
        console.error('No database or user');
        return;
      }

      // Save settings to user profile
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        budgetSettings: {
          ...settings,
          [key]: value,
          updatedAt: new Date()
        }
      });
      
      console.log('Setting saved:', key, value);
    } catch (error) {
      console.error('Error saving budget settings:', error);
    }
  };

  const handleExportBudget = () => {
    // TODO: Implement export functionality
    console.log('Export budget');
  };

  const handleImportBudget = () => {
    // TODO: Implement import functionality
    console.log('Import budget');
  };

  const handleResetBudget = () => {
    if (confirm('Are you sure you want to reset your budget? This will clear all categories and start fresh.')) {
      // TODO: Implement reset functionality
      console.log('Reset budget');
      onUpdate();
    }
  };

  const handleMethodChange = async (method: 'zero-based' | '50-30-20' | 'custom') => {
    if (!budgetData.currentBudget) return;
    
    try {
      const db = await getFirebaseDb();
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!db || !user) {
        console.error('No database or user');
        return;
      }

      // Create new budget method and recalculate categories
      const newMethod: BudgetMethod = {
        type: method,
        allocations: {}
      };

      // Get current income from budget period
      const currentIncome = budgetData.totalIncome || budgetData.currentBudget.period.totalIncome || 0;
      
      // Create new categories based on the selected method
      const newBudget = createBudgetFromMethod(
        newMethod,
        currentIncome,
        budgetData.currentBudget.period,
        user.uid
      );

      // Update the budget with new method and categories
      await budgetService.updateBudget(user.uid, {
        id: budgetData.currentBudget.id,
        method: newMethod,
        categories: newBudget.categories,
        updatedAt: new Date()
      });

      onUpdate(); // Refresh the parent component
    } catch (error) {
      console.error('Error updating budget method:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Budget Method Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="text-lg font-light text-primary">Budget Method</h3>
              <p className="text-sm text-primary/60">Choose how to allocate your budget</p>
            </div>
          </div>
          
          <BudgetMethodSelector
            currentMethod={budgetData.currentBudget?.method.type || '50-30-20'}
            onMethodChange={handleMethodChange}
            monthlyIncome={budgetData.totalIncome}
            currency="USD"
          />
        </GlassContainer>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-light text-primary">General Settings</h3>
              <p className="text-sm text-primary/60">Configure your budget preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Auto Rollover */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-primary">Auto Rollover</p>
                <p className="text-xs text-primary/60">Carry unused budget to next month</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoRollover}
                  onChange={(e) => handleSettingChange('autoRollover', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>

            {/* Monthly Reset */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-primary">Monthly Reset</p>
                <p className="text-xs text-primary/60">Reset budget at start of each month</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.monthlyReset}
                  onChange={(e) => handleSettingChange('monthlyReset', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>

            {/* Track Savings */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-primary">Track Savings</p>
                <p className="text-xs text-primary/60">Include savings in budget calculations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.trackSavings}
                  onChange={(e) => handleSettingChange('trackSavings', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>
          </div>
        </GlassContainer>
      </motion.div>

      {/* Alert Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-light text-primary">Alert Settings</h3>
              <p className="text-sm text-primary/60">Manage budget notifications</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Enable Alerts */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-primary">Enable Alerts</p>
                <p className="text-xs text-primary/60">Get notified about budget status</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alertsEnabled}
                  onChange={(e) => handleSettingChange('alertsEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
              </label>
            </div>

            {/* Alert Threshold */}
            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-primary">Alert Threshold</p>
                <span className="text-sm font-medium text-gold">{settings.alertThreshold}%</span>
              </div>
              <p className="text-xs text-primary/60 mb-3">Alert when category reaches this percentage</p>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={settings.alertThreshold}
                onChange={(e) => handleSettingChange('alertThreshold', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${(settings.alertThreshold - 50) * 2}%, #E5E7EB ${(settings.alertThreshold - 50) * 2}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-primary/40 mt-1">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </GlassContainer>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-light text-primary">Data Management</h3>
              <p className="text-sm text-primary/60">Export, import, or reset your budget</p>
            </div>
          </div>

          <div className="space-y-3">
            <GlassButton
              onClick={handleExportBudget}
              variant="secondary"
              className="w-full justify-center flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Budget Data
            </GlassButton>

            <GlassButton
              onClick={handleImportBudget}
              variant="secondary"
              className="w-full justify-center flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Budget Data
            </GlassButton>

            <div className="pt-3 border-t border-gray-100">
              <GlassButton
                onClick={handleResetBudget}
                variant="secondary"
                className="w-full justify-center text-red-600 hover:bg-red-50"
              >
                Reset Budget
              </GlassButton>
              <p className="text-xs text-center text-primary/40 mt-2">
                This action cannot be undone
              </p>
            </div>
          </div>
        </GlassContainer>
      </motion.div>
    </div>
  );
} 
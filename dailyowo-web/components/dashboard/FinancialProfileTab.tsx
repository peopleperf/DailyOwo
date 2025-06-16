'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { useTranslations } from 'next-intl';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Loader } from '@/components/ui/Loader';
import { Icon } from '@/components/ui/Icon';
import { motion } from 'framer-motion';
import { hasFinancialData, initializeFinancialDataFromProfile } from '@/lib/firebase/init-financial-data';
import { RefreshCw } from 'lucide-react';
import { BudgetSummary } from './BudgetSummary';

export function FinancialProfileTab() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const t = useTranslations('dashboard.financialProfile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [formData, setFormData] = useState({
    currency: userProfile?.currency || '',
    monthlyIncome: userProfile?.monthlyIncome || 0,
    monthlyExpenses: userProfile?.monthlyExpenses || 0,
    currentSavings: userProfile?.currentSavings || 0,
    currentDebt: userProfile?.currentDebt || 0,
  });

  // Check if user has financial data
  useEffect(() => {
    const checkData = async () => {
      if (user?.uid) {
        const dataExists = await hasFinancialData(user.uid);
        setHasData(dataExists);
      }
    };
    checkData();
  }, [user]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data if canceling edit
      setFormData({
        currency: userProfile?.currency || '',
        monthlyIncome: userProfile?.monthlyIncome || 0,
        monthlyExpenses: userProfile?.monthlyExpenses || 0,
        currentSavings: userProfile?.currentSavings || 0,
        currentDebt: userProfile?.currentDebt || 0,
      });
    }
    setIsEditing(!isEditing);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'currency' ? value : Number(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserProfile(formData);
      setSuccess(t('updateSuccess'));
      setIsEditing(false);
    } catch (err) {
      setError(t('updateError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeData = async () => {
    if (!user?.uid || isInitializing) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      await initializeFinancialDataFromProfile(user.uid, userProfile);
      setSuccess(t('initializeSuccess'));
      setHasData(true);
      
      // Refresh the page after a short delay to load the new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(t('initializeError'));
      console.error(err);
    } finally {
      setIsInitializing(false);
    }
  };

  const financialFields = [
    { name: 'monthlyIncome', label: t('monthlyIncome'), type: 'number' },
    { name: 'monthlyExpenses', label: t('monthlyExpenses'), type: 'number' },
    { name: 'currentSavings', label: t('currentSavings'), type: 'number' },
    { name: 'currentDebt', label: t('currentDebt'), type: 'number' },
    { name: 'currency', label: t('currency'), type: 'text' },
  ];

  return (
    <motion.div
      key="financialProfile"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <GlassContainer className="p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-light text-primary">{t('title')}</h3>
          <GlassButton onClick={handleEditToggle} variant="secondary" className="py-2 px-4 text-xs">
            <Icon name={isEditing ? 'close' : 'edit'} size="sm" className="mr-2" />
            {isEditing ? t('cancel') : t('edit')}
          </GlassButton>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}

        {hasData === false && !isEditing && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Icon name="info" className="text-amber-600 mt-0.5" size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 mb-1">{t('noDataFound')}</p>
                <p className="text-sm text-amber-700 mb-3">
                  {t('noDataDescription')}
                </p>
                <GlassButton
                  onClick={handleInitializeData}
                  disabled={isInitializing}
                  variant="secondary"
                  className="py-2 px-4 text-xs"
                >
                  {isInitializing ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      {t('initializing')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-2" />
                      {t('initializeData')}
                    </>
                  )}
                </GlassButton>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {financialFields.map(field => (
              <div key={field.name} className="space-y-2">
                <label className="text-xs font-light tracking-wide uppercase text-primary/60">
                  {field.label}
                </label>
                {isEditing ? (
                  <GlassInput
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    className="w-full"
                    placeholder={field.label}
                  />
                ) : (
                  <p className="text-primary font-semibold text-lg">
                    {field.name === 'currency' 
                      ? userProfile?.[field.name as keyof typeof userProfile] || 'N/A'
                      : new Intl.NumberFormat('en-US', { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(userProfile?.[field.name as keyof typeof userProfile] || 0))}
                  </p>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="mt-8 flex justify-end">
              <GlassButton type="submit" disabled={isLoading} goldBorder>
                {isLoading ? <Loader size="sm" /> : t('saveChanges')}
              </GlassButton>
            </div>
          )}
        </form>
      </GlassContainer>

      {/* Budget Summary */}
      <BudgetSummary />
    </motion.div>
  );
}

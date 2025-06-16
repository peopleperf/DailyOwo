'use client';

import { motion } from 'framer-motion';
import { AlertCircle, XCircle, Info, CheckCircle } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { BudgetAlert } from '@/lib/financial-logic/budget-logic';

interface BudgetAlertsProps {
  alerts: BudgetAlert[];
}

export function BudgetAlerts({ alerts }: BudgetAlertsProps) {
  const getAlertIcon = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'error': return XCircle;
      case 'warning': return AlertCircle;
      case 'info': return Info;
      case 'success': return CheckCircle;
    }
  };

  const getAlertColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <GlassContainer className="p-6">
      <h3 className="text-lg font-light text-primary mb-4">Budget Alerts</h3>
      
      <div className="space-y-3">
        {alerts.map((alert, index) => {
          const Icon = getAlertIcon(alert.severity);
          const colorClass = getAlertColor(alert.severity);
          
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${colorClass}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.type === 'approaching-limit' && (
                    <p className="text-xs mt-1 opacity-80">
                      Consider adjusting your spending in this category
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {alerts.length === 0 && (
          <p className="text-sm text-primary/60 text-center py-4">
            No alerts at this time. Your budget is on track!
          </p>
        )}
      </div>
    </GlassContainer>
  );
} 
'use client';

import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, Lock, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Tooltip imports removed - using native title attribute instead

export type SyncStatus = 
  | 'synced'
  | 'syncing' 
  | 'offline'
  | 'error'
  | 'conflict'
  | 'locked';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSyncTime?: Date;
  error?: string;
  conflictCount?: number;
  lockedBy?: string;
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusIndicator({
  status,
  lastSyncTime,
  error,
  conflictCount = 0,
  lockedBy,
  className = '',
  showDetails = true,
}: SyncStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getIcon = () => {
    switch (status) {
      case 'synced':
        return <Cloud className="w-4 h-4" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'offline':
        return <CloudOff className="w-4 h-4" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      case 'conflict':
        return <AlertTriangle className="w-4 h-4" />;
      case 'locked':
        return <Lock className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'synced':
        return 'text-green-600 dark:text-green-400';
      case 'syncing':
        return 'text-blue-600 dark:text-blue-400';
      case 'offline':
        return 'text-gray-600 dark:text-gray-400';
      case 'error':
      case 'conflict':
        return 'text-red-600 dark:text-red-400';
      case 'locked':
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'synced':
        return 'All changes saved';
      case 'syncing':
        return 'Syncing...';
      case 'offline':
        return 'Offline - changes will sync when online';
      case 'error':
        return error || 'Sync error';
      case 'conflict':
        return `${conflictCount} conflict${conflictCount !== 1 ? 's' : ''} detected`;
      case 'locked':
        return `Locked by ${lockedBy || 'another user'}`;
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  const tooltipText = `${getStatusText()}${
    lastSyncTime && status === 'synced' ? ` - Last sync: ${formatLastSync()}` : ''
  }${!isOnline ? ' - Your device is offline' : ''}`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`flex items-center gap-1.5 ${getColor()}`}
        title={tooltipText}
      >
        {!isOnline ? (
          <WifiOff className="w-4 h-4" />
        ) : (
          getIcon()
        )}
        {showDetails && (
          <span className="text-sm font-medium">
            {!isOnline ? 'Offline' : getStatusText()}
          </span>
        )}
      </div>
    </div>
  );
}

// Mini version for tight spaces
export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const getColor = () => {
    switch (status) {
      case 'synced':
        return 'bg-green-500';
      case 'syncing':
        return 'bg-blue-500 animate-pulse';
      case 'offline':
        return 'bg-gray-500';
      case 'error':
      case 'conflict':
        return 'bg-red-500';
      case 'locked':
        return 'bg-yellow-500';
    }
  };

  return (
    <div className={`w-2 h-2 rounded-full ${getColor()}`} />
  );
}

// Global sync status bar
interface GlobalSyncStatusProps {
  pendingChanges?: number;
  lastError?: string;
  onRetry?: () => void;
}

export function GlobalSyncStatus({ 
  pendingChanges = 0, 
  lastError,
  onRetry 
}: GlobalSyncStatusProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(pendingChanges > 0 || !!lastError || !navigator.onLine);
  }, [pendingChanges, lastError]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800"
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!navigator.onLine ? (
                <>
                  <WifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    You're offline. Changes will sync when you're back online.
                  </span>
                </>
              ) : lastError ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-800 dark:text-red-200">
                    Sync error: {lastError}
                  </span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Syncing {pendingChanges} change{pendingChanges !== 1 ? 's' : ''}...
                  </span>
                </>
              )}
            </div>
            {onRetry && lastError && (
              <button
                onClick={onRetry}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 
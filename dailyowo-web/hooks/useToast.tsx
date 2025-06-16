'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastContainer, ToastMessage, ToastType } from '@/components/ui/Toast';

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration: number = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, type, title, message, duration };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    addToast(type, title, message, duration);
  }, [addToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast('success', title, message);
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast('error', title, message);
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast('warning', title, message);
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast('info', title, message);
  }, [addToast]);

  const contextValue: ToastContextType = {
    toast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          iconBg: 'bg-red-50',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'warning':
        return {
          iconColor: 'text-orange-600',
          iconBg: 'bg-orange-50',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white'
        };
      case 'info':
        return {
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-50',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      default:
        return {
          iconColor: 'text-red-600',
          iconBg: 'bg-red-50',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <GlassContainer className="w-full max-w-md bg-gradient-to-br from-white via-white to-red/5">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
                      <AlertTriangle className={`w-5 h-5 ${styles.iconColor}`} />
                    </div>
                    <h2 className="text-lg font-light text-primary">{title}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-primary/50" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-primary/70 font-light leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <GlassButton
                    variant="secondary"
                    onClick={onClose}
                    className="flex-1"
                  >
                    {cancelText}
                  </GlassButton>
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 px-6 py-3 rounded-xl font-light text-sm transition-all ${styles.confirmButton}`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </GlassContainer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 
import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToasterContextType {
  toasts: Toast[];
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToasterContext = createContext<ToasterContextType | undefined>(undefined);

// Toast Item Component
const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const isSuccess = toast.type === 'success';

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative overflow-hidden rounded-xl shadow-2xl backdrop-blur-sm border
        ${isSuccess 
          ? 'bg-green-500/90 border-green-400/30' 
          : 'bg-red-500/90 border-red-400/30'
        }
        min-w-[320px] max-w-[400px] p-4
      `}
    >
      {/* Animated background gradient */}
      <div className={`
        absolute inset-0 opacity-20
        ${isSuccess ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}
      `} />
      
      {/* Glow effect */}
      <div className={`
        absolute -inset-1 opacity-30 blur-xl
        ${isSuccess ? 'bg-green-400' : 'bg-red-400'}
      `} />

      <div className="relative flex items-start space-x-3">
        {/* Icon with animated background */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isSuccess ? 'bg-green-400/30' : 'bg-red-400/30'}
          backdrop-blur-sm border border-white/20
        `}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            {isSuccess ? (
              <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
            ) : (
              <X className="h-4 w-4 text-white" strokeWidth={2.5} />
            )}
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.h4 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-semibold text-white leading-tight"
          >
            {toast.title}
          </motion.h4>
          {toast.message && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs text-white/90 mt-1 leading-relaxed"
            >
              {toast.message}
            </motion.p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
        className={`
          absolute bottom-0 left-0 h-1 w-full origin-left
          ${isSuccess ? 'bg-green-300/60' : 'bg-red-300/60'}
        `}
      />
    </motion.div>
  );
};

// Global Toaster Component
const GlobalToaster = () => {
  const context = useContext(ToasterContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Provider Component
export const ToasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration });
  };

  const value: ToasterContextType = {
    toasts,
    showSuccess,
    showError,
    removeToast,
  };

  return (
    <ToasterContext.Provider value={value}>
      {children}
      <GlobalToaster />
    </ToasterContext.Provider>
  );
};

// Hook to use the toaster
export const useToaster = (): ToasterContextType => {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error('useToaster must be used within a ToasterProvider');
  }
  return context;
};
import React, { useEffect } from 'react';
import { CheckIcon, CloseIcon } from './Iconsax';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/**
 * Modern floating toast notification system
 * Clean, lightweight, animated, mobile-responsive, auto-dismissing.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 pointer-events-none flex flex-col gap-2.5"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto rounded-xl p-3.5 shadow-2xl border text-xs sm:text-sm flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
        isSuccess
          ? 'bg-[#122418] border-[#225232] text-white'
          : isError
          ? 'bg-[#291414] border-[#592424] text-white'
          : 'bg-[#181D1A] border-[#2E3831] text-white'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isSuccess
            ? 'bg-[#008751] text-white'
            : isError
            ? 'bg-[#DC2626] text-white'
            : 'bg-stone-700 text-white'
        }`}
      >
        {isSuccess ? (
          <CheckIcon size={14} />
        ) : isError ? (
          <CloseIcon size={14} />
        ) : (
          <span className="text-xs font-bold">i</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-bold text-white text-xs mb-0.5">{toast.title}</p>}
        <p className="text-xs leading-relaxed text-stone-200">{toast.message}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        aria-label="Close notification"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
};

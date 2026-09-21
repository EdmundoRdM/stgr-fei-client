import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = 'Esta página dice',
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const confirmBtnStyles = {
    primary:
      'bg-[#3498db] hover:bg-[#2980b9] text-white focus:ring-[#3498db]/40',
    danger:
      'bg-[#e74c3c] hover:bg-[#c0392b] text-white focus:ring-[#e74c3c]/40',
    warning:
      'bg-[#f39c12] hover:bg-[#d68910] text-white focus:ring-[#f39c12]/40',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Dialog Box matching prototype */}
      <div className="w-full max-w-md bg-[#24292e] text-white rounded-2xl shadow-2xl p-6 sm:p-7 border border-slate-700/60 text-center relative transition-all">
        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-3 text-slate-300">
          {variant === 'danger' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <HelpCircle className="w-4 h-4 text-blue-400" />
          )}
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
            {title}
          </h3>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-200 font-medium leading-relaxed mb-6 px-2">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`min-w-[120px] py-2.5 px-6 rounded-full font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${confirmBtnStyles[variant]}`}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-[120px] py-2.5 px-6 rounded-full bg-[#5c6873] hover:bg-[#4d5761] text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

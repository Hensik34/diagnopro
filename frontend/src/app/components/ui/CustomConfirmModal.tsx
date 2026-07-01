import React from 'react';
import { AlertCircle, Info, X } from 'lucide-react';

interface CustomConfirmModalProps {
  isOpen: boolean;
  type?: 'confirm' | 'alert' | 'warning' | 'danger';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function CustomConfirmModal({
  isOpen,
  type = 'confirm',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}: CustomConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'alert':
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <AlertCircle className="w-5 h-5 text-primary" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/95';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-5 relative animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onCancel || onConfirm}
          className="absolute top-3 right-3 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {getIcon()}
          </div>
          <div className="text-left flex-1">
            <h3 className="font-semibold text-sm text-foreground leading-snug">{title}</h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-border">
          {type !== 'alert' && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 border border-border rounded-lg hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'হ্যাঁ, রিসেট করুন',
  cancelLabel = 'বাতিল',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-5 shadow-lg space-y-4"
      >
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-1">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

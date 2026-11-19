import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-[#242E49] bg-white dark:bg-[#121829] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              destructive
                ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold text-slate-900 dark:text-[#EAF0FF]"
            >
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-[#94A3B8]">
              {body}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 dark:border-[#242E49] bg-slate-100 dark:bg-[#1A2238] px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-[#EAF0FF] transition-colors hover:bg-slate-200 dark:hover:bg-[#232D49] whitespace-nowrap cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              destructive
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18251D]/50 backdrop-blur-xs">
      <div className="bg-[#FFFEFA] rounded-3xl shadow-natural-lg border border-[#E4E4D9] max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                isDestructive ? 'bg-[#FDF2F2] text-[#9E2A2B]' : 'bg-[#FAECE1] text-[#D98245]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#2B4031]">{title}</h3>
              <p className="mt-1.5 text-sm text-[#748077] leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-[#748077] hover:text-[#29332D] transition-colors p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-[#F3F1E9] px-6 py-4 flex justify-end gap-3 border-t border-[#E4E4D9]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-[#29332D] bg-[#FFFEFA] border border-[#E4E4D9] rounded-xl hover:bg-[#E5EBDD] focus:outline-hidden transition-colors shadow-natural-xs"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl focus:outline-hidden shadow-natural-xs transition-colors ${
              isDestructive
                ? 'bg-[#9E2A2B] hover:bg-[#7D2223]'
                : 'bg-[#2B4031] hover:bg-[#24392B]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

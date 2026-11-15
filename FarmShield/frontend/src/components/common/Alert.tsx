import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const styles = {
    info: 'bg-[#E5EBDD] border-[#DCE8D8] text-[#2B4031]',
    warning: 'bg-[#FAECE1] border-[#ECC3A2] text-[#773E1D]',
    error: 'bg-[#FDF2F2] border-[#F8D7DA] text-[#9E2A2B]',
    success: 'bg-[#E5EBDD] border-[#72966F]/40 text-[#2B4031]',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-[#72966F] mt-0.5 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#D98245] mt-0.5 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[#9E2A2B] mt-0.5 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-[#2B4031] mt-0.5 shrink-0" />,
  };

  return (
    <div className={`p-4 border rounded-2xl flex items-start justify-between gap-3 text-sm shadow-natural-xs ${styles[type]} ${className}`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <div>
          {title && <h5 className="font-semibold text-xs uppercase tracking-wide mb-1 text-[#2B4031]">{title}</h5>}
          <div className="text-xs leading-relaxed text-[#29332D]">{children}</div>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-[#748077] hover:text-[#29332D] transition-colors p-0.5 rounded-lg"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

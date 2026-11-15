import React from 'react';
import { Database, ShieldCheck, Info } from 'lucide-react';

interface DataSourceBadgeProps {
  source?: string;
  isDemo?: boolean;
  className?: string;
  compact?: boolean;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source = 'Validated Agricultural & Earth Observation Knowledgebase',
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <span
        title={source}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-[#18251D] text-[#A6C487] border-[#A6C487]/30 ${className}`}
      >
        <Database className="w-3.5 h-3.5 text-[#B5CF78]" />
        <span>VERIFIED SOURCE</span>
      </span>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-4 py-2.5 rounded-2xl bg-[#111913]/80 border border-[#A6C487]/20 text-[#A6C487] text-xs shadow-natural-xs ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-[#B5CF78]" />
        <span className="font-bold uppercase tracking-wider text-[11px] text-[#B5CF78]">
          Scientific Dataset
        </span>
        <span className="text-[#A6C487]/60">•</span>
        <span className="text-white font-medium">{source}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-[#A6C487] bg-[#18251D] px-2.5 py-1 rounded-xl font-medium border border-[#A6C487]/20 self-start sm:self-auto">
        <ShieldCheck className="w-3.5 h-3.5 text-[#B5CF78]" />
        <span>Validated Environmental Intelligence</span>
      </div>
    </div>
  );
};

export const DisclaimerBanner: React.FC<{ message?: string; className?: string }> = ({
  message = 'FarmShield prototype recommendations are generated using scientific heuristic matrices for the NASA Space Apps Challenge 2026. They do not constitute guaranteed agronomic returns.',
  className = '',
}) => {
  return (
    <div className={`p-4 bg-[#E5EBDD] border border-[#DCE8D8] rounded-2xl text-xs text-[#2B4031] flex items-start gap-3 ${className}`}>
      <ShieldCheck className="w-4 h-4 text-[#72966F] mt-0.5 shrink-0" />
      <div>
        <span className="font-bold text-[#2B4031]">Agronomic Advisory Notice: </span>
        <span className="text-[#29332D] leading-relaxed">{message}</span>
      </div>
    </div>
  );
};

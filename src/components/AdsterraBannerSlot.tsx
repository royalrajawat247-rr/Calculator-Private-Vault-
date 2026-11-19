import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { TranslationDict } from '../i18n/translations';

interface AdsterraBannerSlotProps {
  t: TranslationDict;
}

export const AdsterraBannerSlot: React.FC<AdsterraBannerSlotProps> = ({ t }) => {
  return (
    <div className="mt-2.5 flex flex-col items-center justify-center pb-1">
      <div
        id="adsterra-300x250-slot"
        data-adsterra-zone="300x250"
        className="w-[300px] h-[250px] rounded-2xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/80 dark:bg-[#0F1626]/75 backdrop-blur-md shadow-xs flex flex-col items-center justify-center p-5 text-center select-none"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mt-3 text-xs font-bold tracking-tight text-slate-900 dark:text-[#EAF0FF]">
          {t.adSlot.title}
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-[#94A3B8] max-w-[230px]">
          {t.adSlot.subtitle}
        </p>
        <span className="mt-3 inline-flex items-center rounded-md border border-slate-200/80 dark:border-[#2B3757] bg-slate-50/80 dark:bg-[#161F33]/80 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:text-[#94A3B8]">
          300 × 250 · Adsterra
        </span>
      </div>

      <p className="mt-1.5 text-center text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
        {t.adSlot.caption}
      </p>
    </div>
  );
};

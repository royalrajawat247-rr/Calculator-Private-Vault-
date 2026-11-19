import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { TranslationDict } from '../i18n/translations';

interface PWAInstallButtonProps {
  t: TranslationDict;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ t }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t.pwa.installBtn}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#242E49] bg-white dark:bg-[#1A2238] px-3 text-xs font-medium text-slate-800 dark:text-[#EAF0FF] hover:bg-slate-50 dark:hover:bg-[#232D49] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Share className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span>{t.pwa.iosInstallBtn}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-[#242E49] bg-white dark:bg-[#121829] p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <h3
                  id="ios-install-title"
                  className="text-base font-semibold text-slate-900 dark:text-[#EAF0FF]"
                >
                  {t.pwa.iosModalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A2238] cursor-pointer"
                  aria-label={t.common.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-[#CBD5E1]">
                <p>{t.pwa.iosStep1}</p>
                <p>{t.pwa.iosStep2}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

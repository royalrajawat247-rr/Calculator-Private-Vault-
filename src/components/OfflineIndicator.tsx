import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { TranslationDict } from '../i18n/translations';

interface OfflineIndicatorProps {
  t: TranslationDict;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ t }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-5 left-4 z-50 flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-500/40 bg-white/95 dark:bg-[#121829]/95 px-3.5 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 shadow-lg backdrop-blur-md"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{t.pwa.offlineBadge}</span>
    </div>
  );
};

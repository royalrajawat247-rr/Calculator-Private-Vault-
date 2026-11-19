import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Crown,
  Globe,
  Headphones,
  KeyRound,
  Mail,
  Moon,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Language, VaultSettings } from '../types/vault';
import type { TranslationDict } from '../i18n/translations';
import { ConfirmDialog } from './ConfirmDialog';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsTabProps {
  settings: VaultSettings;
  hasPinRecord: boolean;
  t: TranslationDict;
  onUpdateSettings: (next: VaultSettings) => void;
  onResetPasscode: (currentPin: string, newPin: string) => Promise<'ok' | 'wrong_current'>;
  onResetPinToDefault: () => Promise<void>;
  onNotify: (msg: string) => void;
}

const SUPPORT_EMAIL = 'royalrajawat247@gmail.com';

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  hasPinRecord,
  t,
  onUpdateSettings,
  onResetPasscode,
  onResetPinToDefault,
  onNotify,
}) => {
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [resetDefaultOpen, setResetDefaultOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const isDark = settings.theme !== 'light';

  const handleToggleDark = () => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(12);
    }
    onUpdateSettings({
      ...settings,
      theme: isDark ? 'light' : 'cosmic',
    });
  };

  const handleCopySupportEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      onNotify(t.settings.supportCopiedToast);
    } catch {
      onNotify(t.settings.supportCopiedToast);
    }
  };

  const handlePinResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (
      (hasPinRecord && !/^\d{4}$/.test(currentPin)) ||
      !/^\d{4}$/.test(newPin) ||
      !/^\d{4}$/.test(confirmPin)
    ) {
      setPinError(t.settings.pin4DigitsError);
      return;
    }

    if (newPin !== confirmPin) {
      setPinError(t.settings.pinsDoNotMatchError);
      return;
    }

    setIsUpdatingPin(true);
    try {
      const outcome = await onResetPasscode(currentPin, newPin);
      if (outcome === 'wrong_current') {
        setPinError(t.settings.wrongCurrentPinError);
        return;
      }
      setPinModalOpen(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      onNotify(t.settings.pinUpdatedToast);
    } finally {
      setIsUpdatingPin(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Compact Page Title + Install Action */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-[#EAF0FF] leading-tight">
            {t.settings.pageTitle}
          </h2>
          <p className="text-[10.5px] text-slate-500 dark:text-[#94A3B8] leading-tight">
            {t.settings.pageSubtitle}
          </p>
        </div>
        <PWAInstallButton t={t} />
      </div>

      {/* Sleek Blue Gradient Hero Banner */}
      <section className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 border border-white/20">
            <Crown className="h-3.5 w-3.5 text-amber-300 fill-amber-300/30" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[11.5px] font-bold tracking-wide text-white leading-tight">
              {t.settings.heroBadgeTitle}
            </h3>
            <p className="mt-0.5 text-[10.5px] leading-tight text-blue-50/95">
              {t.settings.heroSubtitle}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1 pt-1.5 border-t border-white/15">
          {t.settings.heroChecks.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap"
            >
              <Check className="h-2.5 w-2.5 text-amber-300 shrink-0" aria-hidden="true" />
              <span>{feature}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Only 3 Sleek Compact Rows: Dark Mode, App Language, Change 4-Digit Calculator PIN */}
      <section className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md shadow-2xs divide-y divide-slate-100 dark:divide-[#1E2740]">
        {/* Dark Mode */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#1A2238] text-slate-700 dark:text-blue-400">
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-[#EAF0FF] leading-tight">
                {t.settings.darkModeTitle}
              </p>
              <p className="text-[10.5px] text-slate-500 dark:text-[#94A3B8] truncate">
                {t.settings.darkModeDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={handleToggleDark}
            aria-label={t.settings.darkModeTitle}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              isDark ? 'bg-blue-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-transform ${
                isDark ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* App Language */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-sky-50 dark:bg-[#1A2238] text-sky-600 dark:text-sky-400">
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-[#EAF0FF] leading-tight">
                {t.settings.languageTitle}
              </p>
              <p className="text-[10.5px] text-slate-500 dark:text-[#94A3B8] truncate">
                {t.settings.languageDesc}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-100 dark:bg-[#0A0E1A] p-0.5 shrink-0">
            {(['en', 'hi'] as Language[]).map((lang) => {
              const active = settings.language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, language: lang })}
                  className={`h-6 rounded-md px-2 text-[10.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#EAF0FF]'
                  }`}
                >
                  {lang === 'en' ? 'English' : 'हिंदी'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Digit Calculator PIN: Save PIN & Reset PIN */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-[#1A2238] text-indigo-600 dark:text-indigo-400">
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-[#EAF0FF] leading-tight">
                {t.settings.changePinTitle}
              </p>
              <p className="text-[10.5px] text-slate-500 dark:text-[#94A3B8] truncate">
                {t.settings.changePinDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPinError('');
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
                setPinModalOpen(true);
              }}
              className="inline-flex h-7 items-center rounded-lg bg-blue-600 px-2.5 text-[11px] font-semibold text-white hover:bg-blue-700 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {t.settings.savePinBtn}
            </button>
            <button
              type="button"
              onClick={() => setResetDefaultOpen(true)}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-2.5 text-[11px] font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#232D49] active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-3 w-3 text-slate-500 dark:text-[#94A3B8]" aria-hidden="true" />
              <span>{t.settings.resetPinBtn}</span>
            </button>
          </div>
        </div>
      </section>

      {/* RR Tech Labs • 24/7 User Support Card (clickable royalrajawat247@gmail.com) */}
      <section className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2.5 shadow-2xs space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-[#EAF0FF] leading-tight">
              {t.settings.supportCardTitle}
            </h3>
            <p className="text-[10.5px] text-slate-500 dark:text-[#94A3B8] truncate">
              {t.settings.supportCardDesc}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Royal%20Vault%20Support`}
            className="inline-flex h-7 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-[10.5px] font-semibold text-white hover:bg-blue-700 whitespace-nowrap"
          >
            <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{SUPPORT_EMAIL}</span>
          </a>

          <button
            type="button"
            onClick={() => void handleCopySupportEmail()}
            className="inline-flex h-7 items-center justify-center gap-1 rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-2.5 text-[10.5px] font-semibold text-slate-700 dark:text-[#EAF0FF] hover:bg-slate-100 dark:hover:bg-[#232D49] whitespace-nowrap cursor-pointer"
          >
            <Copy className="h-3 w-3 text-slate-500 dark:text-[#94A3B8]" aria-hidden="true" />
            <span>{t.settings.supportCopyBtn}</span>
          </button>
        </div>
      </section>

      {/* 100% Local On-Device Privacy Policy & FAQs */}
      <section className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2.5 shadow-2xs space-y-1.5">
        <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-[#1E2740]">
          <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-[#EAF0FF] leading-tight">
              {t.settings.privacyFaqTitle}
            </h3>
            <p className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 leading-tight">
              {t.settings.privacyGuaranteeTitle}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-[10.5px] leading-snug text-slate-600 dark:text-[#CBD5E1]">
          <p>
            <strong className="font-semibold text-slate-900 dark:text-[#EAF0FF]">
              {t.settings.privacyPoint1Label}
            </strong>{' '}
            {t.settings.privacyPoint1Body}
          </p>
          <p>
            <strong className="font-semibold text-slate-900 dark:text-[#EAF0FF]">
              {t.settings.privacyPoint2Label}
            </strong>{' '}
            {t.settings.privacyPoint2Body}
          </p>
          <p>
            <strong className="font-semibold text-slate-900 dark:text-[#EAF0FF]">
              {t.settings.privacyPoint3Label}
            </strong>{' '}
            {t.settings.privacyPoint3Body}
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-[#1E2740] pt-1 divide-y divide-slate-100 dark:divide-[#1E2740]">
          {t.settings.faqItems.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={faq.q} className="py-0.5">
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex min-h-[26px] w-full items-center justify-between gap-2 text-left text-[11px] font-semibold text-slate-900 dark:text-[#EAF0FF] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="mt-0.5 pb-1 pr-3 text-[10.5px] leading-snug text-slate-500 dark:text-[#94A3B8]">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Change 4-Digit Calculator PIN Modal */}
      {pinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-pin-title"
        >
          <form
            onSubmit={(e) => void handlePinResetSubmit(e)}
            className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-[#242E49] bg-white dark:bg-[#121829] p-4 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3
                id="reset-pin-title"
                className="text-sm font-bold text-slate-900 dark:text-[#EAF0FF]"
              >
                {t.settings.resetPinModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A2238] cursor-pointer"
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {hasPinRecord && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8] mb-1">
                    {t.settings.currentPinLabel}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-3 text-center font-mono text-sm tracking-[0.4em] text-slate-900 dark:text-[#EAF0FF] focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8] mb-1">
                  {t.settings.newPinLabel}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="h-9 w-full rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-3 text-center font-mono text-sm tracking-[0.4em] text-slate-900 dark:text-[#EAF0FF] focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8] mb-1">
                  {t.settings.confirmNewPinLabel}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="h-9 w-full rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-3 text-center font-mono text-sm tracking-[0.4em] text-slate-900 dark:text-[#EAF0FF] focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {pinError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{pinError}</p>}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="h-9 flex-1 rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-100 dark:bg-[#1A2238] px-3 text-xs font-semibold text-slate-700 dark:text-[#EAF0FF] hover:bg-slate-200 whitespace-nowrap cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isUpdatingPin}
                className="h-9 flex-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {t.settings.savePinBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={resetDefaultOpen}
        title={t.settings.resetPinConfirmTitle}
        body={t.settings.resetPinConfirmBody}
        confirmLabel={t.settings.resetPinBtn}
        cancelLabel={t.common.cancel}
        destructive={false}
        onConfirm={() => {
          setResetDefaultOpen(false);
          void onResetPinToDefault().then(() => {
            onNotify(t.settings.pinResetDefaultToast);
          });
        }}
        onCancel={() => setResetDefaultOpen(false)}
      />
    </div>
  );
};

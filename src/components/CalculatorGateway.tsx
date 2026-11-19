import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Delete, Globe, RotateCcw } from 'lucide-react';
import type { Language, PinRecord } from '../types/vault';
import type { TranslationDict } from '../i18n/translations';
import { safeEvaluateMath, verifyPinRecord } from '../utils/crypto';
import { triggerHaptic } from '../utils/haptics';
import { ConfirmDialog } from './ConfirmDialog';

interface CalculatorGatewayProps {
  pinRecord: PinRecord | null;
  language: Language;
  t: TranslationDict;
  onToggleLanguage: () => void;
  onUnlock: (pin: string) => void;
  onSetupPin: (pin: string) => Promise<void> | void;
  onResetForgottenLock: () => Promise<void> | void;
}

interface CalcKey {
  label: string;
  value: string;
  variant: 'digit' | 'fn' | 'op' | 'eq' | 'zero';
}

const KEYPAD: CalcKey[] = [
  { label: 'AC', value: 'C', variant: 'fn' },
  { label: 'DEL', value: 'BACK', variant: 'fn' },
  { label: '%', value: '%', variant: 'fn' },
  { label: '÷', value: '/', variant: 'op' },
  { label: '7', value: '7', variant: 'digit' },
  { label: '8', value: '8', variant: 'digit' },
  { label: '9', value: '9', variant: 'digit' },
  { label: '×', value: '*', variant: 'op' },
  { label: '4', value: '4', variant: 'digit' },
  { label: '5', value: '5', variant: 'digit' },
  { label: '6', value: '6', variant: 'digit' },
  { label: '−', value: '-', variant: 'op' },
  { label: '1', value: '1', variant: 'digit' },
  { label: '2', value: '2', variant: 'digit' },
  { label: '3', value: '3', variant: 'digit' },
  { label: '+', value: '+', variant: 'op' },
  { label: '0', value: '0', variant: 'zero' },
  { label: '.', value: '.', variant: 'digit' },
  { label: '=', value: '=', variant: 'eq' },
];

export const CalculatorGateway: React.FC<CalculatorGatewayProps> = ({
  pinRecord,
  language,
  t,
  onToggleLanguage,
  onUnlock,
  onSetupPin,
  onResetForgottenLock,
}) => {
  const [entry, setEntry] = useState('');
  const [lastExpression, setLastExpression] = useState('');
  const [justComputed, setJustComputed] = useState(false);
  const [statusHint, setStatusHint] = useState<string>('');
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [unlockingTransition, setUnlockingTransition] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const isVerifyingRef = useRef(false);

  const triggerWrongPinShake = useCallback(() => {
    triggerHaptic([35, 25, 35]);
    setIsShaking(false);
    window.requestAnimationFrame(() => {
      setIsShaking(true);
    });
    window.setTimeout(() => {
      setIsShaking(false);
    }, 380);
  }, []);

  useEffect(() => {
    if (!lockedUntil || lockedUntil <= Date.now()) {
      setCooldownSeconds(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) {
        setStatusHint('');
      }
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [lockedUntil]);

  const formatExpr = (expr: string) =>
    expr.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−');

  const displayHint =
    cooldownSeconds > 0
      ? t.calculator.lockoutMessage(cooldownSeconds)
      : statusHint ||
        (!pinRecord
          ? t.calculator.setupPinHint
          : pinRecord.isDefaultPin
            ? t.calculator.defaultCodeHint
            : t.calculator.unlockPrompt);

  const formattedEntry = formatExpr(entry);

  let livePreview = '';
  if (entry && /[\d%]$/.test(entry) && !/^\d{4}$/.test(entry)) {
    try {
      const val = safeEvaluateMath(entry);
      livePreview = `${formatExpr(entry)} = ${val}`;
    } catch {
      livePreview = '';
    }
  } else if (justComputed && lastExpression) {
    livePreview = `${formatExpr(lastExpression)} =`;
  }

  const pulseTap = () => {
    triggerHaptic(12);
  };

  const triggerUnlockWithHaptics = useCallback(
    (pin: string, isFirstTimeSetup = false) => {
      triggerHaptic([25, 20, 40]);
      setUnlockingTransition(true);
      window.setTimeout(() => {
        if (isFirstTimeSetup) {
          void onSetupPin(pin);
        } else {
          onUnlock(pin);
        }
      }, 110);
    },
    [onSetupPin, onUnlock]
  );

  const handleEquals = useCallback(async () => {
    if (isVerifyingRef.current) return;
    const raw = entry;
    const pinSequenceMatch = raw.match(/^(\d{4})[+]*$/);

    if (pinSequenceMatch) {
      const candidatePin = pinSequenceMatch[1];

      // First-Time Setup mode: save the user's chosen 4-digit PIN and unlock
      if (!pinRecord) {
        setFailCount(0);
        setEntry('');
        setLastExpression('');
        setStatusHint('');
        triggerUnlockWithHaptics(candidatePin, true);
        return;
      }

      if (Date.now() < lockedUntil) {
        triggerWrongPinShake();
        return;
      }

      isVerifyingRef.current = true;
      try {
        const matchesRecord =
          (await verifyPinRecord(candidatePin, pinRecord)) ||
          (Boolean(pinRecord.isDefaultPin) && candidatePin === '1234');

        if (matchesRecord) {
          setFailCount(0);
          setEntry('');
          setLastExpression('');
          setStatusHint('');
          triggerUnlockWithHaptics(candidatePin, false);
          return;
        }

        triggerWrongPinShake();
        const nextFail = failCount + 1;
        if (nextFail >= 5) {
          setFailCount(0);
          setLockedUntil(Date.now() + 30_000);
        } else {
          setFailCount(nextFail);
        }
        setEntry(candidatePin);
        setLastExpression('');
        setJustComputed(true);
        setStatusHint('');
      } finally {
        isVerifyingRef.current = false;
      }
      return;
    }

    if (!raw) return;

    try {
      const result = safeEvaluateMath(raw);
      setLastExpression(raw);
      setEntry(String(result));
      setJustComputed(true);
      setStatusHint('');
    } catch (err) {
      if (err instanceof Error && err.message === 'DIV_ZERO') {
        setStatusHint(t.calculator.mathError);
      } else {
        setStatusHint(t.calculator.incompleteExpr);
      }
    }
  }, [entry, failCount, lockedUntil, pinRecord, t, triggerUnlockWithHaptics, triggerWrongPinShake]);

  const handleKey = useCallback(
    (keyVal: string) => {
      pulseTap();

      if (keyVal === 'C') {
        setEntry('');
        setLastExpression('');
        setJustComputed(false);
        setStatusHint('');
        return;
      }

      if (keyVal === 'BACK') {
        setEntry((prev) => prev.slice(0, -1));
        setLastExpression('');
        setJustComputed(false);
        setStatusHint('');
        return;
      }

      if (keyVal === '=') {
        void handleEquals();
        return;
      }

      const isOp = '+-*/%'.includes(keyVal);

      setEntry((prev) => {
        let base = prev;
        if (justComputed && !isOp) {
          base = '';
        }
        setLastExpression('');
        setJustComputed(false);
        setStatusHint('');

        if (isOp) {
          if (!base && keyVal !== '-') return base;
          if (/[+\-*/]$/.test(base)) {
            return base.slice(0, -1) + keyVal;
          }
          return base.length < 28 ? base + keyVal : base;
        }

        if (keyVal === '.') {
          const lastSegment = base.split(/[+\-*/%]/).pop() || '';
          if (lastSegment.includes('.')) return base;
          if (!lastSegment) return base.length < 28 ? `${base}0.` : base;
        }

        if (base === '0' && keyVal !== '.') {
          return keyVal;
        }

        return base.length < 28 ? base + keyVal : base;
      });
    },
    [handleEquals, justComputed]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKey(e.key);
      } else if (['+', '-', '*', '/', '%', '.'].includes(e.key)) {
        e.preventDefault();
        handleKey(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleKey('=');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKey('BACK');
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleKey('C');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  return (
    <div
      className={`min-h-dvh w-full flex flex-col items-center justify-center p-2.5 sm:p-5 transition-all duration-150 ${
        unlockingTransition ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'
      }`}
    >
      <div className="w-full max-w-[390px] flex flex-col justify-between h-[calc(100dvh-1.25rem)] sm:h-auto sm:min-h-[620px] rounded-[28px] bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-xl border border-slate-200/80 dark:border-[#24304D]/80 overflow-hidden shadow-lg sm:shadow-2xl">
        {/* Android-Style Top Utility Strip */}
        <header className="flex items-center justify-between gap-3 px-4 pt-3 pb-1 pt-safe">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-slate-500 dark:text-[#94A3B8]">
              {t.calcTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(12);
              onToggleLanguage();
            }}
            className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-slate-200/80 dark:border-[#24304D] bg-slate-50/85 dark:bg-[#172033]/85 px-2.5 text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] transition-colors hover:bg-slate-100 dark:hover:bg-[#1F2A42] active:scale-95 whitespace-nowrap cursor-pointer"
            aria-label={`Switch language (${language === 'en' ? 'Hindi' : 'English'})`}
          >
            <Globe className="h-3 w-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>{t.langToggleLabel}</span>
          </button>
        </header>

        {/* Precision Material Display Surface with Wrong-PIN Shake */}
        <div className="flex-1 flex flex-col justify-end items-end px-5 py-4 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-[#090D16]/45 min-h-[140px]">
          <div className="w-full mb-auto flex items-center justify-between gap-2">
            <p
              className={`text-[11px] font-medium ${
                statusHint || cooldownSeconds > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : !pinRecord
                    ? 'text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-400 dark:text-[#64748B]'
              }`}
            >
              {displayHint}
            </p>

            {pinRecord && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(12);
                  setResetConfirmOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-slate-400 dark:text-[#64748B] hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100/80 dark:hover:bg-[#172033] transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span>{t.calculator.forgotPinBtn}</span>
              </button>
            )}
          </div>

          <div
            className={`w-full text-right transition-colors ${isShaking ? 'animate-calc-shake' : ''}`}
          >
            <div
              aria-live="polite"
              className="min-h-[24px] text-right font-mono tabular-nums text-sm font-medium text-slate-400 dark:text-[#7C8BA8] truncate max-w-full"
            >
              {livePreview}
            </div>

            <div
              data-testid="calc-display"
              className={`mt-1 w-full text-right font-mono tabular-nums text-[44px] sm:text-5xl font-medium tracking-tight break-all leading-none transition-colors ${
                isShaking
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-[#F1F5FF]'
              }`}
            >
              {formattedEntry || '0'}
            </div>
          </div>
        </div>

        {/* High-Contrast Tactile Android Keypad */}
        <div className="grid grid-cols-4 gap-2.5 px-4 py-4 pb-safe bg-slate-50/75 dark:bg-[#090D16]/65 border-t border-slate-200/80 dark:border-[#1E2944]/80">
          {KEYPAD.map((key) => {
            const baseClass =
              'h-[60px] sm:h-[64px] rounded-2xl text-xl font-semibold transition-all duration-100 active:scale-[0.93] active:brightness-95 flex items-center justify-center select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 shadow-[0_2px_0_rgba(15,23,42,0.06),0_4px_10px_-3px_rgba(15,23,42,0.08)] dark:shadow-[0_2px_0_rgba(0,0,0,0.45),0_4px_10px_-3px_rgba(0,0,0,0.5)]';

            let variantClass =
              'bg-white text-slate-900 border border-slate-200/80 hover:bg-slate-50 dark:bg-[#192236] dark:text-[#F1F5FF] dark:border-[#26324E] dark:hover:bg-[#202B44]';

            if (key.variant === 'fn') {
              variantClass =
                'bg-slate-200/90 text-slate-800 border border-slate-300/60 hover:bg-slate-200 dark:bg-[#24304A] dark:text-slate-100 dark:border-[#303E5E] dark:hover:bg-[#2C3A59] text-base';
            } else if (key.variant === 'op') {
              variantClass =
                'bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 dark:bg-[#1A294B] dark:text-blue-300 dark:border-blue-500/30 dark:hover:bg-[#21335C] text-2xl';
            } else if (key.variant === 'eq') {
              variantClass =
                'bg-blue-600 text-white border border-blue-500 hover:bg-blue-700 shadow-[0_3px_12px_rgba(37,99,235,0.35)] text-2xl';
            } else if (key.variant === 'zero') {
              variantClass =
                'col-span-2 bg-white text-slate-900 border border-slate-200/80 hover:bg-slate-50 dark:bg-[#192236] dark:text-[#F1F5FF] dark:border-[#26324E] dark:hover:bg-[#202B44] justify-start pl-6';
            }

            return (
              <button
                key={key.label}
                type="button"
                onClick={() => handleKey(key.value)}
                aria-label={key.value === 'BACK' ? 'Backspace' : key.label}
                className={`${baseClass} ${variantClass}`}
              >
                {key.value === 'BACK' ? (
                  <Delete className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <span className="font-mono tabular-nums">{key.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        title={t.calculator.resetLockTitle}
        body={t.calculator.resetLockBody}
        confirmLabel={t.calculator.resetLockConfirm}
        cancelLabel={t.common.cancel}
        destructive={false}
        onConfirm={() => {
          setResetConfirmOpen(false);
          setFailCount(0);
          setLockedUntil(0);
          setCooldownSeconds(0);
          setEntry('');
          setLastExpression('');
          setJustComputed(false);
          setStatusHint('');
          void onResetForgottenLock();
        }}
        onCancel={() => setResetConfirmOpen(false)}
      />
    </div>
  );
};

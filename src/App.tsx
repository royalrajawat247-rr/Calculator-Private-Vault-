import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FileLock2,
  Globe,
  HardDriveDownload,
  Images,
  Lock,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { TRANSLATIONS } from './i18n/translations';
import type {
  DecryptedNote,
  GalleryItem,
  PinRecord,
  VaultSettings,
  VaultTab,
} from './types/vault';
import {
  createPinRecord,
  decryptNoteRecord,
  encryptNoteRecord,
  verifyPinRecord,
} from './utils/crypto';
import {
  clearStoredPinRecord,
  formatByteSize,
  getLastBackupAt,
  getStoredEncryptedNotes,
  getStoredPinRecord,
  getStoredSettings,
  popLegacyLocalGallery,
  saveLastBackupAt,
  saveStoredEncryptedNotes,
  saveStoredPinRecord,
  saveStoredSettings,
} from './utils/storage';
import {
  dataUrlToBlob,
  deleteMediaItems,
  getAllMediaItems,
  putMediaItems,
  updateMediaDeletedAt,
} from './utils/mediaDb';
import { CalculatorGateway } from './components/CalculatorGateway';
import { GalleryTab } from './components/GalleryTab';
import { NotesTab } from './components/NotesTab';
import { BackupTab } from './components/BackupTab';
import { SettingsTab } from './components/SettingsTab';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HolographicBackdrop } from './components/HolographicBackdrop';
import { AdsterraBannerSlot } from './components/AdsterraBannerSlot';
import { triggerHaptic } from './utils/haptics';

export function App() {
  const [pinRecord, setPinRecord] = useState<PinRecord | null>(() => getStoredPinRecord());
  const [settings, setSettings] = useState<VaultSettings>(() => getStoredSettings());
  const [sessionPin, setSessionPin] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<VaultTab>('gallery');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const tabOrder: VaultTab[] = ['gallery', 'notes', 'backup', 'settings'];

  const handleTabChange = useCallback(
    (nextTab: VaultTab) => {
      if (nextTab === activeTab) return;
      triggerHaptic(12);
      const oldIdx = tabOrder.indexOf(activeTab);
      const newIdx = tabOrder.indexOf(nextTab);
      setSlideDirection(newIdx > oldIdx ? 'right' : 'left');
      setActiveTab(nextTab);
    },
    [activeTab]
  );

  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [notes, setNotes] = useState<DecryptedNote[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(() => getLastBackupAt());

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const suppressBlurUntilRef = useRef<number>(0);

  const t = TRANSLATIONS[settings.language];
  const isUnlocked = sessionPin !== null;

  // Sync language & 3-theme classes on <html>
  useEffect(() => {
    document.documentElement.lang = settings.language === 'hi' ? 'hi' : 'en';
    const isDark = settings.theme !== 'light';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('theme-emerald', settings.theme === 'emerald');

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      const themeColor =
        settings.theme === 'cosmic'
          ? '#090D16'
          : settings.theme === 'emerald'
            ? '#051912'
            : '#ffffff';
      metaTheme.setAttribute('content', themeColor);
    }
  }, [settings.language, settings.theme]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  const loadMediaDatabase = useCallback(async (): Promise<GalleryItem[]> => {
    const legacy = popLegacyLocalGallery();
    if (legacy.length > 0) {
      const converted = await Promise.all(
        legacy.map(async (item) => {
          if (!item.blob && item.dataUrl) {
            const blob = await dataUrlToBlob(item.dataUrl, item.mimeType);
            return { ...item, blob, sizeBytes: blob.size };
          }
          return item;
        })
      );
      await putMediaItems(converted);
    }
    return getAllMediaItems();
  }, []);

  const loadVaultContents = useCallback(
    async (pin: string) => {
      const storedMedia = await loadMediaDatabase();
      setGallery(storedMedia);

      const encryptedNotes = getStoredEncryptedNotes();
      const decryptedList: DecryptedNote[] = [];

      for (const record of encryptedNotes) {
        try {
          const dec = await decryptNoteRecord(pin, record);
          decryptedList.push(dec);
        } catch {
          // Skip mismatched key record
        }
      }

      setNotes(decryptedList);
    },
    [loadMediaDatabase]
  );

  const lockVault = useCallback(() => {
    setSessionPin(null);
    setGallery([]);
    setNotes([]);
  }, []);

  const handleUnlock = useCallback(
    async (pin: string) => {
      setIsLoadingVault(true);
      await loadVaultContents(pin);
      await new Promise((r) => setTimeout(r, 250));
      setSessionPin(pin);
      setActiveTab('gallery');
      setIsLoadingVault(false);
      showToast(TRANSLATIONS[settings.language].calculator.unlockedToast);
    },
    [loadVaultContents, settings.language, showToast]
  );

  // Auto-lock when app is hidden/blurred
  useEffect(() => {
    if (!isUnlocked) return;

    const handleBlurOrHide = () => {
      if (Date.now() < suppressBlurUntilRef.current) return;
      lockVault();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlurOrHide();
      }
    };

    window.addEventListener('blur', handleBlurOrHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlurOrHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked, lockVault]);

  const handleBeforeFilePicker = useCallback(() => {
    suppressBlurUntilRef.current = Date.now() + 15_000;
  }, []);

  const handleUpdateSettings = useCallback((next: VaultSettings) => {
    setSettings(next);
    saveStoredSettings(next);
  }, []);

  const handleCycleTheme = useCallback(() => {
    triggerHaptic(14);
    const nextTheme =
      settings.theme === 'light'
        ? 'cosmic'
        : settings.theme === 'cosmic'
          ? 'emerald'
          : 'light';
    handleUpdateSettings({ ...settings, theme: nextTheme });
  }, [handleUpdateSettings, settings]);

  const handleToggleLanguage = useCallback(() => {
    triggerHaptic(12);
    const nextLang = settings.language === 'en' ? 'hi' : 'en';
    handleUpdateSettings({ ...settings, language: nextLang });
  }, [handleUpdateSettings, settings]);

  const handleAddMedia = useCallback(async (newItems: GalleryItem[]): Promise<boolean> => {
    const ok = await putMediaItems(newItems);
    if (ok) {
      setGallery((prev) => [...newItems, ...prev]);
    }
    return ok;
  }, []);

  const handleMoveToTrash = useCallback(async (ids: string[]) => {
    const deletedAt = Date.now();
    await updateMediaDeletedAt(ids, deletedAt);
    const idSet = new Set(ids);
    setGallery((prev) =>
      prev.map((item) => (idSet.has(item.id) ? { ...item, deletedAt } : item))
    );
  }, []);

  const handleRestoreFromTrash = useCallback(async (ids: string[]) => {
    await updateMediaDeletedAt(ids, null);
    const idSet = new Set(ids);
    setGallery((prev) =>
      prev.map((item) => {
        if (!idSet.has(item.id)) return item;
        const { deletedAt: _removed, ...rest } = item;
        void _removed;
        return rest;
      })
    );
  }, []);

  const handlePermanentDeleteMedia = useCallback(async (ids: string[]) => {
    await deleteMediaItems(ids);
    const idSet = new Set(ids);
    setGallery((prev) => prev.filter((item) => !idSet.has(item.id)));
  }, []);

  const handleClearTrash = useCallback(async () => {
    const trashedIds = gallery
      .filter((item) => typeof item.deletedAt === 'number')
      .map((item) => item.id);
    if (trashedIds.length === 0) return;
    await deleteMediaItems(trashedIds);
    const idSet = new Set(trashedIds);
    setGallery((prev) => prev.filter((item) => !idSet.has(item.id)));
  }, [gallery]);

  const handleSaveNote = useCallback(
    async (note: DecryptedNote): Promise<boolean> => {
      if (!sessionPin) return false;
      const encrypted = await encryptNoteRecord(sessionPin, note);
      const existing = getStoredEncryptedNotes();
      const idx = existing.findIndex((r) => r.id === note.id);
      const nextEncrypted =
        idx >= 0
          ? existing.map((r) => (r.id === note.id ? encrypted : r))
          : [encrypted, ...existing];

      const saved = saveStoredEncryptedNotes(nextEncrypted);
      if (saved) {
        setNotes((prev) => {
          const exists = prev.some((n) => n.id === note.id);
          return exists ? prev.map((n) => (n.id === note.id ? note : n)) : [note, ...prev];
        });
      }
      return saved;
    },
    [sessionPin]
  );

  const handleDeleteNote = useCallback((id: string) => {
    const existing = getStoredEncryptedNotes();
    const nextEncrypted = existing.filter((r) => r.id !== id);
    saveStoredEncryptedNotes(nextEncrypted);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleBackupExported = useCallback((timestamp: number) => {
    saveLastBackupAt(timestamp);
    setLastBackupAt(timestamp);
  }, []);

  const handleRestoreMerge = useCallback(
    async (restoredMedia: GalleryItem[], restoredNotes: DecryptedNote[], decryptPin?: string) => {
      const activeKey = sessionPin || decryptPin || '1234';

      const existingMediaIds = new Set(gallery.map((g) => g.id));
      const newMedia = restoredMedia.filter((g) => g && g.id && !existingMediaIds.has(g.id));
      if (newMedia.length > 0) {
        await putMediaItems(newMedia);
        setGallery((prev) => [...newMedia, ...prev]);
      }

      const existingNotesMap = new Map(notes.map((n) => [n.id, n]));
      for (const note of restoredNotes) {
        if (note && note.id) {
          existingNotesMap.set(note.id, note);
        }
      }
      const mergedNotes = Array.from(existingNotesMap.values());
      const encryptedAll = await Promise.all(
        mergedNotes.map((n) => encryptNoteRecord(activeKey, n))
      );
      saveStoredEncryptedNotes(encryptedAll);
      setNotes(mergedNotes);
    },
    [gallery, notes, sessionPin]
  );

  const handleResetPasscode = useCallback(
    async (currentPin: string, newPin: string): Promise<'ok' | 'wrong_current'> => {
      if (pinRecord) {
        const valid = await verifyPinRecord(currentPin, pinRecord);
        if (!valid) return 'wrong_current';
      }

      const newRecord: PinRecord = {
        ...(await createPinRecord(newPin)),
        isDefaultPin: false,
      };
      const reEncryptedNotes = await Promise.all(
        notes.map((n) => encryptNoteRecord(newPin, n))
      );
      saveStoredEncryptedNotes(reEncryptedNotes);
      saveStoredPinRecord(newRecord);
      setPinRecord(newRecord);
      setSessionPin(newPin);
      return 'ok';
    },
    [notes, pinRecord]
  );

  const handleResetPinToDefault = useCallback(async () => {
    const newRecord: PinRecord = {
      ...(await createPinRecord('1234')),
      isDefaultPin: true,
    };
    const reEncryptedNotes = await Promise.all(
      notes.map((n) => encryptNoteRecord('1234', n))
    );
    saveStoredEncryptedNotes(reEncryptedNotes);
    saveStoredPinRecord(newRecord);
    setPinRecord(newRecord);
    setSessionPin('1234');
  }, [notes]);

  const handleSetupFirstPin = useCallback(
    async (newPin: string) => {
      setIsLoadingVault(true);
      const record: PinRecord = {
        ...(await createPinRecord(newPin)),
        isDefaultPin: false,
      };
      saveStoredPinRecord(record);
      setPinRecord(record);
      await loadVaultContents(newPin);
      await new Promise((r) => setTimeout(r, 250));
      setSessionPin(newPin);
      setActiveTab('gallery');
      setIsLoadingVault(false);
      showToast(TRANSLATIONS[settings.language].calculator.pinSavedToast);
    },
    [loadVaultContents, settings.language, showToast]
  );

  const handleResetForgottenLock = useCallback(async () => {
    // Clear current PIN record so user returns to First-Time Setup mode;
    // IndexedDB Private Gallery files remain completely intact.
    clearStoredPinRecord();
    saveStoredEncryptedNotes([]);
    setPinRecord(null);
    showToast(TRANSLATIONS[settings.language].calculator.resetLockToast);
  }, [settings.language, showToast]);

  if (!isUnlocked) {
    return (
      <>
        <HolographicBackdrop theme={settings.theme} />
        <div className="relative z-10">
          <CalculatorGateway
            pinRecord={pinRecord}
            language={settings.language}
            t={t}
            onToggleLanguage={handleToggleLanguage}
            onUnlock={(pin) => void handleUnlock(pin)}
            onSetupPin={handleSetupFirstPin}
            onResetForgottenLock={handleResetForgottenLock}
          />
          <OfflineIndicator t={t} />
        </div>
      </>
    );
  }

  const navItems: Array<{
    key: VaultTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'gallery', label: t.nav.gallery, icon: Images },
    { key: 'notes', label: t.nav.notes, icon: FileLock2 },
    { key: 'backup', label: t.nav.backup, icon: HardDriveDownload },
    { key: 'settings', label: t.nav.settings, icon: SettingsIcon },
  ];

  const activeGallery = gallery.filter((g) => typeof g.deletedAt !== 'number');
  const trashedGallery = gallery.filter((g) => typeof g.deletedAt === 'number');
  const totalItems = activeGallery.length + notes.length;
  const totalBytes = activeGallery.reduce((sum, g) => sum + (g.sizeBytes || 0), 0);

  return (
    <div className="relative h-dvh overflow-hidden text-slate-900 dark:text-[#EAF0FF] flex flex-col">
      <HolographicBackdrop theme={settings.theme} />
      <div className="relative z-10 flex h-dvh flex-col overflow-hidden">
      {/* Sleek Native Mobile App Header */}
      <header className="shrink-0 z-30 h-9.5 border-b border-slate-200/80 dark:border-[#24304D]/80 bg-white/84 dark:bg-[#090D16]/78 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-full max-w-4xl items-center justify-between gap-1.5 px-2 sm:px-4">
          {/* 1-Click Theme Switcher Logo Badge + Active Theme Pill */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={handleCycleTheme}
              title={t.themes.switchTooltip}
              aria-label={t.themes.switchTooltip}
              className="group flex items-center gap-1.5 rounded-md pr-1 py-0.5 text-left transition-transform active:scale-95 cursor-pointer min-w-0"
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-2xs transition-colors ${
                  settings.theme === 'emerald'
                    ? 'bg-emerald-600'
                    : settings.theme === 'cosmic'
                      ? 'bg-indigo-600'
                      : 'bg-blue-600'
                }`}
              >
                <Shield className="h-3 w-3" aria-hidden="true" />
              </div>
              <div className="min-w-0 leading-none">
                <h1 className="truncate text-[11.5px] font-bold tracking-tight text-slate-900 dark:text-[#EAF0FF] whitespace-nowrap">
                  {t.vaultHeaderTitle}
                </h1>
                <p className="mt-0.5 truncate text-[8.5px] font-medium text-slate-500 dark:text-[#94A3B8] whitespace-nowrap">
                  {t.brandSubtitle}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleCycleTheme}
              title={t.themes.switchTooltip}
              className={`inline-flex h-5 shrink-0 items-center rounded-full border px-1.5 text-[9px] font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                settings.theme === 'emerald'
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                  : settings.theme === 'cosmic'
                    ? 'border-purple-400/40 bg-purple-500/15 text-purple-200'
                    : 'border-blue-200 bg-blue-50/90 text-blue-700'
              }`}
            >
              <span>
                {settings.theme === 'emerald'
                  ? t.themes.emerald
                  : settings.theme === 'cosmic'
                    ? t.themes.cosmic
                    : t.themes.light}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleLanguage}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-slate-200 dark:border-[#242E49] bg-slate-50/90 dark:bg-[#121829]/85 px-1.5 text-[9.5px] font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1A2238] active:scale-95 whitespace-nowrap cursor-pointer"
              aria-label="Toggle language"
            >
              <Globe className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>{t.langToggleLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(14);
                lockVault();
              }}
              className="inline-flex h-6 items-center gap-1 rounded-md bg-slate-900 dark:bg-[#1A2238] border border-slate-900 dark:border-[#242E49] px-1.5 text-[9.5px] font-semibold text-white hover:bg-slate-800 dark:hover:border-blue-500 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Lock className="h-2.5 w-2.5" aria-hidden="true" />
              <span>{t.lockNow}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Smoothly Scrollable Workspace Above Fixed Bottom Nav */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex min-h-full w-full max-w-4xl gap-3.5 px-2 sm:px-4 pt-1 pb-13 lg:pb-4">
        {/* Desktop Navigation Rail */}
        <aside className="hidden lg:flex lg:w-48 lg:shrink-0 lg:flex-col lg:justify-between">
          <nav aria-label="Vault navigation" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleTabChange(item.key)}
                  className={`flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-blue-50/90 text-blue-600 border border-blue-200/80 backdrop-blur-md dark:bg-[#0F1626]/80 dark:text-blue-400 dark:border-[#24304D]/80'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100/80 dark:hover:bg-[#0F1626]/55 hover:text-slate-900 dark:hover:text-[#EAF0FF]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2 text-[10px] text-slate-500 dark:text-[#94A3B8] space-y-0.5 shadow-2xs">
            <p className="font-bold text-slate-900 dark:text-[#EAF0FF]">{t.appTitle}</p>
            <p className="font-mono tabular-nums">
              {t.stats.mediaCount(activeGallery.length)} · {t.stats.notesCount(notes.length)}
            </p>
            <p className="font-mono tabular-nums">
              {t.stats.storageLabel}: {formatByteSize(totalBytes)}
            </p>
          </div>
        </aside>

        {/* Scrollable Content Region */}
        <main className="min-w-0 flex-1 flex flex-col space-y-1 overflow-x-hidden">
          {/* Ultra-Slim Status Pill */}
          <div className="flex shrink-0 items-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-500/15 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800 dark:text-emerald-300 font-mono tabular-nums">
              <ShieldCheck className="h-2.5 w-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>{t.vaultStatusPill(totalItems)}</span>
            </div>
          </div>

          <div
            key={activeTab}
            className={`flex-1 flex flex-col space-y-1 ${
              slideDirection === 'right' ? 'animate-tab-right' : 'animate-tab-left'
            }`}
          >
            {activeTab === 'gallery' && (
              <GalleryTab
                items={activeGallery}
                trashedItems={trashedGallery}
                isLoading={isLoadingVault}
                t={t}
                onAddMedia={handleAddMedia}
                onMoveToTrash={handleMoveToTrash}
                onRestoreFromTrash={handleRestoreFromTrash}
                onPermanentDeleteMany={handlePermanentDeleteMedia}
                onClearTrash={handleClearTrash}
                onNotify={showToast}
                onBeforeFilePicker={handleBeforeFilePicker}
              />
            )}

            {activeTab === 'notes' && (
              <div className="flex flex-1 flex-col justify-between gap-3">
                <NotesTab
                  notes={notes}
                  isLoading={isLoadingVault}
                  t={t}
                  onSaveNote={handleSaveNote}
                  onDeleteNote={handleDeleteNote}
                  onNotify={showToast}
                />
                {/* Centered 300x250 Adsterra Display Slot Anchored Near Bottom Nav in Notes Tab */}
                <AdsterraBannerSlot t={t} />
              </div>
            )}

            {activeTab === 'backup' && (
              <BackupTab
                sessionPin={sessionPin}
                gallery={activeGallery}
                notes={notes}
                lastBackupAt={lastBackupAt}
                t={t}
                onBackupExported={handleBackupExported}
                onRestoreMerge={handleRestoreMerge}
                onNotify={showToast}
                onBeforeFilePicker={handleBeforeFilePicker}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                hasPinRecord={!!pinRecord}
                t={t}
                onUpdateSettings={handleUpdateSettings}
                onResetPasscode={handleResetPasscode}
                onResetPinToDefault={handleResetPinToDefault}
                onNotify={showToast}
              />
            )}
          </div>
        </main>
        </div>
      </div>

      {/* Sleek Native Bottom Navigation Bar */}
      <nav
        aria-label="Mobile vault navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 dark:border-[#24304D]/80 bg-white/88 dark:bg-[#090D16]/85 backdrop-blur-md pb-safe lg:hidden"
      >
        <div className="grid h-10.5 grid-cols-4 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleTabChange(item.key)}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-1 transition-colors cursor-pointer ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#EAF0FF]'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="text-[9.5px] font-semibold tracking-tight leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator t={t} />

      {/* Compact Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-13 lg:bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-blue-600 px-3 py-1 text-center text-[10.5px] font-semibold text-white shadow-xl max-w-[90vw] whitespace-nowrap"
        >
          {toast}
        </div>
      )}
      </div>
    </div>
  );
}

export default App;

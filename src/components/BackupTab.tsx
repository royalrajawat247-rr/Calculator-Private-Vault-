import React, { useRef, useState } from 'react';
import { AlertCircle, Database, Download, ShieldCheck, Upload, X } from 'lucide-react';
import type { DecryptedNote, GalleryItem } from '../types/vault';
import type { TranslationDict } from '../i18n/translations';
import { createEncryptedBackupJson, decryptBackupJson } from '../utils/crypto';
import { dataUrlToBlob, serializeGalleryForBackup } from '../utils/mediaDb';
import { formatByteSize, formatTodayDate } from '../utils/storage';

interface BackupTabProps {
  sessionPin: string | null;
  gallery: GalleryItem[];
  notes: DecryptedNote[];
  lastBackupAt: number | null;
  t: TranslationDict;
  onBackupExported: (timestamp: number) => void;
  onRestoreMerge: (
    restoredGallery: GalleryItem[],
    restoredNotes: DecryptedNote[],
    decryptPin?: string
  ) => Promise<void>;
  onNotify: (msg: string) => void;
  onBeforeFilePicker: () => void;
}

export const BackupTab: React.FC<BackupTabProps> = ({
  sessionPin,
  gallery,
  notes,
  lastBackupAt,
  t,
  onBackupExported,
  onRestoreMerge,
  onNotify,
  onBeforeFilePicker,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingBackupText, setPendingBackupText] = useState<string | null>(null);
  const [restorePin, setRestorePin] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const totalBytes = gallery.reduce((sum, g) => sum + (g.sizeBytes || 0), 0);
  const sizeText = formatByteSize(totalBytes);

  const handleExport = async () => {
    if (!sessionPin) {
      onNotify(t.backup.pinNeededForBackup);
      return;
    }
    setIsExporting(true);
    try {
      const now = Date.now();
      const serializableGallery = await serializeGalleryForBackup(gallery);
      const jsonText = await createEncryptedBackupJson(sessionPin, {
        app: 'RoyalCalculatorVault',
        version: 2,
        exportedAt: now,
        gallery: serializableGallery,
        notes,
      });

      const blob = new Blob([jsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `royal-vault-backup-${formatTodayDate()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);

      onBackupExported(now);
      onNotify(t.backup.exportSuccessToast);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenRestorePicker = () => {
    onBeforeFilePicker();
    fileInputRef.current?.click();
  };

  const handleBackupFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    setPendingBackupText(text);
    setRestorePin('');
  };

  const handleConfirmRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingBackupText || !/^\d{4}$/.test(restorePin)) {
      onNotify(t.backup.restoreErrorToast);
      return;
    }

    setIsRestoring(true);
    try {
      const bundle = await decryptBackupJson(restorePin, pendingBackupText);
      const rawGallery = Array.isArray(bundle.gallery) ? bundle.gallery : [];
      const restoredMedia: GalleryItem[] = await Promise.all(
        rawGallery.map(async (g) => {
          const kind =
            g.kind ||
            (g.mimeType === 'application/pdf'
              ? ('pdf' as const)
              : g.mimeType?.startsWith('video/')
                ? ('video' as const)
                : ('image' as const));
          let blob = g.blob;
          if (!blob && g.dataUrl) {
            blob = await dataUrlToBlob(g.dataUrl, g.mimeType);
          }
          return {
            id: g.id,
            name: g.name,
            kind,
            mimeType: g.mimeType || 'application/octet-stream',
            blob,
            sizeBytes: blob ? blob.size : g.sizeBytes || 0,
            createdAt: g.createdAt || Date.now(),
          };
        })
      );

      const restoredNotes = (Array.isArray(bundle.notes) ? bundle.notes : []).map((n) => ({
        ...n,
        tags: Array.isArray(n.tags) ? n.tags : [],
      }));

      await onRestoreMerge(restoredMedia, restoredNotes, restorePin);
      setPendingBackupText(null);
      setRestorePin('');
      onNotify(t.backup.restoreSuccessToast(restoredMedia.length, restoredNotes.length));
    } catch {
      onNotify(t.backup.restoreErrorToast);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Compact Unified Backup & Restore Action Card */}
      <section className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-[#EAF0FF] leading-tight">
                {t.backup.heading}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] truncate leading-tight">
                {t.backup.subheading}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30 px-2 py-0.5 font-mono tabular-nums text-[10px] font-semibold text-blue-700 dark:text-blue-300">
            <Database className="h-2.5 w-2.5" aria-hidden="true" />
            <span>{sizeText}</span>
          </span>
        </div>

        {/* Sleek 40px Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isExporting}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{isExporting ? t.backup.exporting : t.backup.exportBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenRestorePicker}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-[#2B3757] bg-slate-50/90 dark:bg-[#161F33]/85 px-3 text-xs font-semibold text-slate-800 dark:text-[#EAF0FF] hover:bg-slate-100 dark:hover:bg-[#1E2A45] active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>{t.backup.importBtn}</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={(e) => void handleBackupFileSelected(e)}
          className="hidden"
        />

        {/* Compact Status & Backup Timestamp Footer */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-[#1E2740] text-[10.5px] text-slate-500 dark:text-[#94A3B8]">
          <span className="font-mono tabular-nums">
            {lastBackupAt
              ? `${t.backup.lastBackupPrefix}: ${new Date(lastBackupAt).toLocaleString()}`
              : t.backup.neverBackedUp}
          </span>
          <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
            {t.backup.storageUsedText(sizeText, gallery.length + notes.length)}
          </span>
        </div>
      </section>

      {/* Compact Safety Notice */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/75 dark:bg-amber-500/10 backdrop-blur-md px-2.5 py-1.5">
        <AlertCircle
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <p className="text-[10.5px] leading-snug text-amber-900 dark:text-amber-100">
          {t.backup.warningNotice}
        </p>
      </div>

      {/* Restore Passcode Prompt Modal */}
      {pendingBackupText !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-pin-title"
        >
          <form
            onSubmit={(e) => void handleConfirmRestore(e)}
            className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-[#24304D] bg-white/95 dark:bg-[#101728]/95 backdrop-blur-xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h3
                id="restore-pin-title"
                className="text-sm font-bold text-slate-900 dark:text-[#EAF0FF]"
              >
                {t.backup.restoreModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setPendingBackupText(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A2238] cursor-pointer"
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-[#94A3B8]">
              {t.backup.restoreModalBody}
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={restorePin}
              onChange={(e) => setRestorePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder={t.backup.restorePinPlaceholder}
              autoFocus
              className="mt-3 h-10 w-full rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-3 text-center font-mono text-base tracking-[0.45em] text-slate-900 dark:text-[#EAF0FF] placeholder:tracking-normal placeholder:text-xs placeholder-slate-400 focus:border-blue-600 focus:outline-none"
            />
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPendingBackupText(null)}
                className="h-9 flex-1 rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-100 dark:bg-[#1A2238] px-3 text-xs font-semibold text-slate-700 dark:text-[#EAF0FF] hover:bg-slate-200 whitespace-nowrap cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={isRestoring || restorePin.length !== 4}
                className="h-9 flex-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {t.backup.restoreConfirmBtn}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpDown,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Database,
  Download,
  FileText,
  Film,
  FolderLock,
  Image as ImageIcon,
  ImagePlus,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { GalleryItem } from '../types/vault';
import type { TranslationDict } from '../i18n/translations';
import { getRemainingTrashDays } from '../utils/mediaDb';
import {
  createItemId,
  fileToIndexedDbMedia,
  formatByteSize,
} from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import { ConfirmDialog } from './ConfirmDialog';

type GallerySortOrder = 'newest' | 'oldest' | 'size-desc' | 'size-asc';
type GalleryFolder = 'library' | 'trash';

interface GalleryTabProps {
  items: GalleryItem[];
  trashedItems: GalleryItem[];
  isLoading?: boolean;
  t: TranslationDict;
  onAddMedia: (newItems: GalleryItem[]) => Promise<boolean>;
  onMoveToTrash: (ids: string[]) => Promise<void>;
  onRestoreFromTrash: (ids: string[]) => Promise<void>;
  onPermanentDeleteMany: (ids: string[]) => Promise<void>;
  onClearTrash: () => Promise<void>;
  onNotify: (msg: string) => void;
  onBeforeFilePicker: () => void;
}

const LONG_PRESS_MS = 450;

export const GalleryTab: React.FC<GalleryTabProps> = ({
  items,
  trashedItems,
  isLoading = false,
  t,
  onAddMedia,
  onMoveToTrash,
  onRestoreFromTrash,
  onPermanentDeleteMany,
  onClearTrash,
  onNotify,
  onBeforeFilePicker,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);

  const [pickerAccept, setPickerAccept] = useState('image/*,video/*,application/pdf,.pdf');
  const [isImporting, setIsImporting] = useState(false);
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const touchSwipeStartXRef = useRef<number | null>(null);

  // Folder, Selection Mode & Sort state
  const [folder, setFolder] = useState<GalleryFolder>('library');
  const [sortBy, setSortBy] = useState<GallerySortOrder>('newest');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [clearTrashOpen, setClearTrashOpen] = useState(false);

  const displayedSource = folder === 'trash' ? trashedItems : items;

  const sortedItems = useMemo(() => {
    const copy = [...displayedSource];
    switch (sortBy) {
      case 'oldest':
        return copy.sort((a, b) => a.createdAt - b.createdAt);
      case 'size-desc':
        return copy.sort(
          (a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0) || b.createdAt - a.createdAt
        );
      case 'size-asc':
        return copy.sort(
          (a, b) => (a.sizeBytes || 0) - (b.sizeBytes || 0) || b.createdAt - a.createdAt
        );
      case 'newest':
      default:
        return copy.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [displayedSource, sortBy]);

  // Manage zero-lag Object URLs for native IndexedDB Blobs (fallback to legacy dataUrl)
  const objectUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of sortedItems) {
      if (item.blob instanceof Blob) {
        map.set(item.id, URL.createObjectURL(item.blob));
      } else if (item.dataUrl) {
        map.set(item.id, item.dataUrl);
      }
    }
    return map;
  }, [sortedItems]);

  useEffect(() => {
    return () => {
      for (const [id, url] of objectUrlMap.entries()) {
        const item = sortedItems.find((i) => i.id === id);
        if (item?.blob instanceof Blob && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }
    };
  }, [objectUrlMap, sortedItems]);

  const totalBytes = sortedItems.reduce((sum, g) => sum + (g.sizeBytes || 0), 0);
  const storageSizeText = formatByteSize(totalBytes);

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pointerStartRef.current = null;
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const switchFolder = (nextFolder: GalleryFolder) => {
    if (nextFolder === folder) return;
    triggerHaptic(10);
    setFolder(nextFolder);
    exitSelectionMode();
    setActiveItem(null);
    setDeleteTarget(null);
  };

  const toggleItemSelection = (id: string) => {
    triggerHaptic(10);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    triggerHaptic(10);
    if (selectedIds.size === sortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map((i) => i.id)));
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (selectionMode) return;
    clearLongPress();
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      suppressNextClickRef.current = true;
      // Distinct, stronger press-and-hold haptic confirmation pattern for Selection Mode
      triggerHaptic([35, 25, 65]);
      setSelectionMode(true);
      setSelectedIds(new Set([id]));
      longPressTimerRef.current = null;
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > 8 || dy > 8) {
      clearLongPress();
    }
  };

  const handleThumbnailClick = (media: GalleryItem) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }
    if (selectionMode) {
      toggleItemSelection(media.id);
    } else {
      triggerHaptic(12);
      setIsZoomed(false);
      setActiveItem(media);
    }
  };

  const activeIndex = useMemo(
    () => (activeItem ? sortedItems.findIndex((item) => item.id === activeItem.id) : -1),
    [activeItem, sortedItems]
  );

  const closeLightbox = useCallback(() => {
    triggerHaptic(10);
    setIsZoomed(false);
    setActiveItem(null);
  }, []);

  const stepLightbox = useCallback(
    (direction: -1 | 1) => {
      if (activeIndex < 0 || sortedItems.length <= 1) return;
      const nextIndex = (activeIndex + direction + sortedItems.length) % sortedItems.length;
      triggerHaptic(10);
      setIsZoomed(false);
      setActiveItem(sortedItems[nextIndex]);
    },
    [activeIndex, sortedItems]
  );

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepLightbox(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeItem, closeLightbox, stepLightbox]);

  const handleOpenPicker = (acceptFilter = 'image/*,video/*,application/pdf,.pdf') => {
    triggerHaptic(12);
    setPickerAccept(acceptFilter);
    onBeforeFilePicker();
    window.setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (!files.length) return;

    const validFiles = files.filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.type.startsWith('video/') ||
        f.type === 'application/pdf' ||
        f.name.toLowerCase().endsWith('.pdf')
    );
    if (!validFiles.length) {
      onNotify(t.gallery.noValidMedia);
      return;
    }

    setIsImporting(true);
    try {
      const created: GalleryItem[] = [];
      for (const file of validFiles) {
        const processed = await fileToIndexedDbMedia(file);
        created.push({
          id: createItemId(),
          name: file.name,
          kind: processed.kind,
          mimeType: processed.mimeType,
          blob: processed.blob,
          sizeBytes: processed.sizeBytes,
          createdAt: Date.now(),
        });
      }

      const ok = await onAddMedia(created);
      if (!ok) {
        onNotify(t.gallery.saveError);
      } else {
        onNotify(t.gallery.importedToast(created.length));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!deleteTarget) return;
    const isInTrash = typeof deleteTarget.deletedAt === 'number';
    if (isInTrash) {
      await onPermanentDeleteMany([deleteTarget.id]);
      onNotify(t.gallery.deletedToast);
    } else {
      await onMoveToTrash([deleteTarget.id]);
      onNotify(t.gallery.movedToTrashToast);
    }
    if (activeItem?.id === deleteTarget.id) {
      setActiveItem(null);
    }
    setDeleteTarget(null);
  };

  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (folder === 'trash') {
      await onPermanentDeleteMany(ids);
      exitSelectionMode();
      onNotify(t.gallery.bulkDeletedToast(ids.length));
    } else {
      await onMoveToTrash(ids);
      exitSelectionMode();
      onNotify(t.gallery.bulkMovedToTrashToast(ids.length));
    }
  };

  const handleBulkRestore = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await onRestoreFromTrash(ids);
    exitSelectionMode();
    onNotify(t.gallery.restoredToast(ids.length));
  };

  const handleSingleRestore = async (item: GalleryItem) => {
    await onRestoreFromTrash([item.id]);
    if (activeItem?.id === item.id) {
      setActiveItem(null);
    }
    onNotify(t.gallery.restoredToast(1));
  };

  const handleConfirmClearTrash = async () => {
    await onClearTrash();
    setClearTrashOpen(false);
    exitSelectionMode();
    setActiveItem(null);
    onNotify(t.gallery.trashClearedToast);
  };

  const triggerDownload = (item: GalleryItem) => {
    const url = objectUrlMap.get(item.id) || item.dataUrl;
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download =
      item.name ||
      `royal-vault-${item.id}.${
        item.kind === 'pdf' ? 'pdf' : item.kind === 'video' ? 'mp4' : 'jpg'
      }`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleBulkExport = () => {
    const targets = sortedItems.filter((item) => selectedIds.has(item.id));
    if (targets.length === 0) return;

    targets.forEach((item, idx) => {
      window.setTimeout(() => {
        triggerDownload(item);
      }, idx * 140);
    });

    onNotify(t.gallery.bulkExportedToast(targets.length));
    exitSelectionMode();
  };

  const activeUrl = activeItem ? objectUrlMap.get(activeItem.id) || activeItem.dataUrl || '' : '';

  return (
    <div className="space-y-1">
      {/* Compact Native Card Header (Warm Gold/Amber Accent) */}
      <div className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <ImagePlus className="h-3 w-3" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold tracking-tight text-slate-900 dark:text-[#EAF0FF] leading-tight">
                {t.gallery.heading}
              </h2>
              <p className="truncate text-[9.5px] text-slate-500 dark:text-[#94A3B8] leading-tight">
                {t.gallery.subheading}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenPicker()}
            disabled={isImporting}
            className="inline-flex h-7.5 shrink-0 items-center justify-center gap-1 rounded-lg bg-amber-400 px-2.5 text-[11px] font-bold text-slate-950 shadow-2xs transition-transform hover:bg-amber-500 active:scale-95 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
            <span>{isImporting ? t.gallery.importing : t.gallery.importBtn}</span>
          </button>
        </div>

        {/* Folder Toggle (Library vs Recently Deleted) + Storage, Sort & Select */}
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-[#1E2740]">
          <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-[#242E49] bg-slate-100 dark:bg-[#0A0E1A] p-0.5">
            <button
              type="button"
              onClick={() => switchFolder('library')}
              className={`h-5 rounded px-1.5 text-[9.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                folder === 'library'
                  ? 'bg-white text-amber-700 shadow-2xs dark:bg-[#1A2238] dark:text-amber-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#EAF0FF]'
              }`}
            >
              {t.gallery.folderLibrary} ({items.length})
            </button>
            <button
              type="button"
              onClick={() => switchFolder('trash')}
              className={`inline-flex h-5 items-center gap-1 rounded px-1.5 text-[9.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                folder === 'trash'
                  ? 'bg-white text-rose-600 shadow-2xs dark:bg-[#1A2238] dark:text-rose-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#EAF0FF]'
              }`}
            >
              <Trash2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              <span>{t.gallery.folderTrash(trashedItems.length)}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 ml-auto">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200/80 dark:border-amber-500/30 px-1.5 py-0.5 font-mono tabular-nums text-[9px] font-semibold text-amber-800 dark:text-amber-300">
              <Database className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              <span>{t.gallery.storageChip(storageSizeText)}</span>
            </span>

            {sortedItems.length > 0 && (
              <div className="relative inline-flex items-center">
                <ArrowUpDown
                  className="pointer-events-none absolute left-1.5 h-2.5 w-2.5 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    triggerHaptic(10);
                    setSortBy(e.target.value as GallerySortOrder);
                  }}
                  aria-label={t.gallery.sortLabel}
                  className="h-5.5 rounded-md border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] pl-5 pr-1.5 text-[9.5px] font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#232D49] focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="newest">{t.gallery.sortNewest}</option>
                  <option value="oldest">{t.gallery.sortOldest}</option>
                  <option value="size-desc">{t.gallery.sortLargest}</option>
                  <option value="size-asc">{t.gallery.sortSmallest}</option>
                </select>
              </div>
            )}

            {sortedItems.length > 0 && !selectionMode && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(12);
                  setSelectionMode(true);
                  setSelectedIds(new Set());
                }}
                className="inline-flex h-5.5 items-center gap-1 rounded-md border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-1.5 text-[9.5px] font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#232D49] whitespace-nowrap cursor-pointer"
              >
                <CheckSquare className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span>{t.gallery.selectBtn}</span>
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={pickerAccept}
          multiple
          onChange={(e) => void handleFilesSelected(e)}
          className="hidden"
        />
      </div>

      {/* Recently Deleted 30-Day Retention Bar + Clear Trash Button */}
      {folder === 'trash' && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-rose-200/80 dark:border-rose-500/30 bg-rose-50/75 dark:bg-rose-500/10 backdrop-blur-md px-2 py-1 shadow-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Clock className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <p className="text-[10px] font-medium text-rose-900 dark:text-rose-200 leading-tight">
              {t.gallery.trashNotice}
            </p>
          </div>
          {trashedItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(14);
                setClearTrashOpen(true);
              }}
              className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md bg-red-600 px-2 text-[10px] font-semibold text-white hover:bg-red-700 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
              <span>{t.gallery.clearTrashBtn}</span>
            </button>
          )}
        </div>
      )}

      {/* Multi-Select Bulk Action Toolbar */}
      {selectionMode && (
        <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/90 dark:bg-[#121829] px-2 py-1 shadow-2xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 font-mono tabular-nums">
              {t.gallery.selectedCount(selectedIds.size)}
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100/80 dark:hover:bg-[#1A2238] cursor-pointer"
            >
              {selectedIds.size === sortedItems.length
                ? t.gallery.clearSelection
                : t.gallery.selectAll}
            </button>
          </div>

          <div className="flex items-center gap-1">
            {folder === 'trash' ? (
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => void handleBulkRestore()}
                className="inline-flex h-6 items-center gap-1 rounded-md bg-emerald-600 px-2 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5" aria-hidden="true" />
                <span>{t.gallery.restoreSelectedBtn}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={handleBulkExport}
                className="inline-flex h-6 items-center gap-1 rounded-md bg-amber-500 px-2 text-[10px] font-semibold text-slate-950 hover:bg-amber-600 disabled:opacity-40 whitespace-nowrap cursor-pointer"
              >
                <Download className="h-2.5 w-2.5" aria-hidden="true" />
                <span>{t.gallery.exportSelected}</span>
              </button>
            )}

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setBulkDeleteOpen(true)}
              className="inline-flex h-6 items-center gap-1 rounded-md bg-red-600 px-2 text-[10px] font-semibold text-white hover:bg-red-700 disabled:opacity-40 whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
              <span>{t.gallery.deleteSelected}</span>
            </button>

            <button
              type="button"
              onClick={exitSelectionMode}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 dark:border-[#242E49] bg-white dark:bg-[#1A2238] text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 cursor-pointer"
              aria-label={t.common.cancel}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Shimmer Skeleton Loader OR Empty State OR Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-1.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-lg bg-slate-200 dark:bg-[#1A2238] animate-pulse border border-slate-300/40 dark:border-[#2B3757]/60"
            />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        folder === 'trash' ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2 shadow-2xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[11px] font-bold text-slate-900 dark:text-[#EAF0FF]">
                {t.gallery.emptyTrashTitle}
              </h3>
              <p className="text-[9.5px] text-slate-500 dark:text-[#94A3B8] leading-snug">
                {t.gallery.emptyTrashBody}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="min-w-0">
                <h3 className="text-[11px] font-bold text-slate-900 dark:text-[#EAF0FF]">
                  {t.gallery.emptyTitle}
                </h3>
                <p className="text-[9.5px] text-slate-500 dark:text-[#94A3B8] truncate">
                  {t.gallery.emptyBody}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200/70 dark:border-amber-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                IndexedDB
              </span>
            </div>

            {/* Crisp 2-Column Native Action Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenPicker('image/*')}
                className="flex items-center gap-2 rounded-lg border border-amber-200/75 dark:border-amber-500/25 bg-amber-50/75 dark:bg-amber-500/10 p-1.5 text-left transition-all hover:bg-amber-100/75 dark:hover:bg-amber-500/18 active:scale-[0.97] cursor-pointer"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/25 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300">
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-900 dark:text-[#EAF0FF] leading-tight">
                    {t.gallery.quickPhotos}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 dark:text-[#94A3B8]">
                    {t.gallery.quickPhotosSub}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPicker('video/*')}
                className="flex items-center gap-2 rounded-lg border border-blue-200/75 dark:border-blue-500/25 bg-blue-50/75 dark:bg-blue-500/10 p-1.5 text-left transition-all hover:bg-blue-100/75 dark:hover:bg-blue-500/18 active:scale-[0.97] cursor-pointer"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Film className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-900 dark:text-[#EAF0FF] leading-tight">
                    {t.gallery.quickVideos}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 dark:text-[#94A3B8]">
                    {t.gallery.quickVideosSub}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPicker('application/pdf,.pdf')}
                className="flex items-center gap-2 rounded-lg border border-indigo-200/75 dark:border-indigo-500/25 bg-indigo-50/75 dark:bg-indigo-500/10 p-1.5 text-left transition-all hover:bg-indigo-100/75 dark:hover:bg-indigo-500/18 active:scale-[0.97] cursor-pointer"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-900 dark:text-[#EAF0FF] leading-tight">
                    {t.gallery.quickPdfs}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 dark:text-[#94A3B8]">
                    {t.gallery.quickPdfsSub}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPicker('image/*,video/*,application/pdf,.pdf')}
                className="flex items-center gap-2 rounded-lg border border-emerald-200/75 dark:border-emerald-500/25 bg-emerald-50/75 dark:bg-emerald-500/10 p-1.5 text-left transition-all hover:bg-emerald-100/75 dark:hover:bg-emerald-500/18 active:scale-[0.97] cursor-pointer"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <FolderLock className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-900 dark:text-[#EAF0FF] leading-tight">
                    {t.gallery.quickSecureFolder}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 dark:text-[#94A3B8]">
                    {t.gallery.quickSecureFolderSub}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-1">
          {!selectionMode && (
            <p className="text-[9.5px] text-slate-400 dark:text-[#64748B] px-0.5">
              {t.gallery.longPressHint}
            </p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-1.5">
            {sortedItems.map((media) => {
              const isSelected = selectedIds.has(media.id);
              const mediaUrl = objectUrlMap.get(media.id) || media.dataUrl || '';

              return (
                <button
                  key={media.id}
                  type="button"
                  onPointerDown={(e) => handlePointerDown(e, media.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={clearLongPress}
                  onPointerCancel={clearLongPress}
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => handleThumbnailClick(media)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border bg-slate-100 dark:bg-[#121829] select-none focus-visible:outline-2 focus-visible:outline-amber-500 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500 scale-[0.96]'
                      : 'border-slate-200 dark:border-[#242E49] active:scale-[0.96]'
                  }`}
                  aria-label={media.name}
                  aria-pressed={selectionMode ? isSelected : undefined}
                >
                  {media.kind === 'pdf' ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-amber-50/70 dark:bg-[#161F33] p-2 text-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        <FileText className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <span className="mt-1.5 line-clamp-2 text-[10px] font-semibold text-slate-700 dark:text-[#CBD5E1] leading-tight break-all">
                        {media.name}
                      </span>
                      <span className="mt-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                        {t.gallery.pdfBadge}
                      </span>
                    </div>
                  ) : media.kind === 'video' ? (
                    <div className="relative h-full w-full bg-slate-900 flex items-center justify-center">
                      <video
                        src={mediaUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover opacity-80 pointer-events-none"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm">
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" aria-hidden="true" />
                        </span>
                      </div>
                      <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-medium text-white pointer-events-none">
                        <Film className="h-2.5 w-2.5" aria-hidden="true" />
                        {t.gallery.videoBadge}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={media.name}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 pointer-events-none"
                      loading="lazy"
                    />
                  )}

                  {typeof media.deletedAt === 'number' && (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-md bg-rose-600/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow-xs pointer-events-none">
                      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                      {t.gallery.daysLeftShort(getRemainingTrashDays(media.deletedAt))}
                    </span>
                  )}

                  {selectionMode && (
                    <span
                      className={`absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-sm'
                          : 'border-white/80 bg-black/40 text-transparent'
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Full-Screen Lightbox Media / PDF Preview (Portaled to document.body) */}
      {activeItem &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex h-dvh w-screen flex-col bg-black/95 backdrop-blur-xl select-none"
            role="dialog"
            aria-modal="true"
            aria-label={activeItem.name}
          >
            {/* Top Overlay Bar */}
            <div className="flex items-center justify-between gap-2.5 border-b border-white/10 bg-black/45 px-3.5 sm:px-5 py-2.5 pt-safe">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{activeItem.name}</p>
                <p className="mt-0.5 font-mono tabular-nums text-[11px] text-slate-400">
                  {activeIndex >= 0 ? `${activeIndex + 1} / ${sortedItems.length} · ` : ''}
                  {activeItem.kind === 'pdf'
                    ? t.gallery.pdfBadge
                    : activeItem.kind === 'video'
                      ? t.gallery.videoBadge
                      : t.gallery.photoBadge}{' '}
                  · {formatByteSize(activeItem.sizeBytes)} ·{' '}
                  {new Date(activeItem.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeItem.kind === 'image' && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(10);
                      setIsZoomed((z) => !z);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 cursor-pointer"
                    aria-label={isZoomed ? t.gallery.zoomOut : t.gallery.zoomIn}
                    title={isZoomed ? t.gallery.zoomOut : t.gallery.zoomIn}
                  >
                    {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeLightbox}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 cursor-pointer"
                  aria-label={t.gallery.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Full-Screen Viewport Stage with Touch Swipe & Side Arrows */}
            <div
              className="relative flex flex-1 items-center justify-center overflow-auto p-2 sm:p-6"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeLightbox();
                }
              }}
              onTouchStart={(e) => {
                if (isZoomed || e.touches.length !== 1) return;
                touchSwipeStartXRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (isZoomed || touchSwipeStartXRef.current === null || e.changedTouches.length !== 1) {
                  touchSwipeStartXRef.current = null;
                  return;
                }
                const deltaX = e.changedTouches[0].clientX - touchSwipeStartXRef.current;
                touchSwipeStartXRef.current = null;
                if (Math.abs(deltaX) > 48) {
                  stepLightbox(deltaX < 0 ? 1 : -1);
                }
              }}
            >
              {sortedItems.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stepLightbox(-1);
                  }}
                  className="hidden sm:flex absolute left-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-md hover:bg-white/25 active:scale-95 cursor-pointer"
                  aria-label={t.gallery.prevItem}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {activeItem.kind === 'pdf' ? (
                <iframe
                  key={activeItem.id}
                  src={activeUrl}
                  title={activeItem.name}
                  className="h-full w-full max-w-4xl rounded-xl bg-white shadow-2xl"
                />
              ) : activeItem.kind === 'video' ? (
                <video
                  key={activeItem.id}
                  src={activeUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full rounded-xl shadow-2xl bg-black"
                />
              ) : (
                <img
                  key={activeItem.id}
                  src={activeUrl}
                  alt={activeItem.name}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  onDoubleClick={() => {
                    triggerHaptic(10);
                    setIsZoomed((z) => !z);
                  }}
                  onClick={() => {
                    if (isZoomed) {
                      setIsZoomed(false);
                    }
                  }}
                  className={`rounded-xl object-contain transition-all duration-200 ${
                    isZoomed
                      ? 'w-[165%] max-w-none max-h-none cursor-zoom-out'
                      : 'max-h-full max-w-full cursor-zoom-in'
                  }`}
                />
              )}

              {sortedItems.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stepLightbox(1);
                  }}
                  className="hidden sm:flex absolute right-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-md hover:bg-white/25 active:scale-95 cursor-pointer"
                  aria-label={t.gallery.nextItem}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="flex items-center justify-center gap-2.5 border-t border-white/10 bg-black/50 px-4 py-2.5 pb-safe">
              {sortedItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => stepLightbox(-1)}
                  className="inline-flex sm:hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white active:scale-95 cursor-pointer"
                  aria-label={t.gallery.prevItem}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {typeof activeItem.deletedAt === 'number' ? (
                <button
                  type="button"
                  onClick={() => void handleSingleRestore(activeItem)}
                  className="inline-flex h-9 flex-1 max-w-[180px] items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.gallery.restoreSingleBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => triggerDownload(activeItem)}
                  className="inline-flex h-9 flex-1 max-w-[180px] items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.gallery.downloadMedia}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDeleteTarget(activeItem)}
                className="inline-flex h-9 flex-1 max-w-[140px] items-center justify-center gap-1.5 rounded-lg bg-red-500/20 border border-red-500/40 px-3 text-xs font-semibold text-red-300 hover:bg-red-500/30 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.gallery.deleteMedia}</span>
              </button>

              {sortedItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => stepLightbox(1)}
                  className="inline-flex sm:hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white active:scale-95 cursor-pointer"
                  aria-label={t.gallery.nextItem}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>,
          document.body
        )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={
          typeof deleteTarget?.deletedAt === 'number'
            ? t.gallery.confirmDeleteTitle
            : t.gallery.confirmTrashMoveTitle
        }
        body={
          typeof deleteTarget?.deletedAt === 'number'
            ? t.gallery.confirmDeleteBody
            : t.gallery.confirmTrashMoveBody
        }
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        destructive
        onConfirm={() => void handleConfirmDeleteSingle()}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={
          folder === 'trash'
            ? t.gallery.confirmBulkDeleteTitle(selectedIds.size)
            : t.gallery.confirmBulkTrashMoveTitle(selectedIds.size)
        }
        body={
          folder === 'trash'
            ? t.gallery.confirmBulkDeleteBody(selectedIds.size)
            : t.gallery.confirmBulkTrashMoveBody(selectedIds.size)
        }
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        destructive
        onConfirm={() => void handleConfirmBulkDelete()}
        onCancel={() => setBulkDeleteOpen(false)}
      />

      <ConfirmDialog
        open={clearTrashOpen}
        title={t.gallery.confirmClearTrashTitle}
        body={t.gallery.confirmClearTrashBody(trashedItems.length)}
        confirmLabel={t.gallery.clearTrashBtn}
        cancelLabel={t.common.cancel}
        destructive
        onConfirm={() => void handleConfirmClearTrash()}
        onCancel={() => setClearTrashOpen(false)}
      />
    </div>
  );
};

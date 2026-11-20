import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  FileLock2,
  KeyRound,
  Plus,
  StickyNote,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import type {
  DecryptedNote,
  NoteFilter,
  NoteKind,
  NoteTagFilter,
  NoteTagPreset,
} from '../types/vault';
import type { TranslationDict } from '../i18n/translations';
import { createItemId, formatTodayDate } from '../utils/storage';
import { triggerHaptic } from '../utils/haptics';
import { ConfirmDialog } from './ConfirmDialog';

interface NotesTabProps {
  notes: DecryptedNote[];
  isLoading?: boolean;
  t: TranslationDict;
  onSaveNote: (note: DecryptedNote) => Promise<boolean>;
  onDeleteNote: (id: string) => void;
  onNotify: (msg: string) => void;
}

const PRESET_TAGS: NoteTagPreset[] = ['work', 'personal', 'ideas', 'passwords'];

export const NotesTab: React.FC<NotesTabProps> = ({
  notes,
  isLoading = false,
  t,
  onSaveNote,
  onDeleteNote,
  onNotify,
}) => {
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [tagFilter, setTagFilter] = useState<NoteTagFilter>('all');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DecryptedNote | null>(null);
  const [kind, setKind] = useState<NoteKind>('note');
  const [title, setTitle] = useState('');
  const [entryDate, setEntryDate] = useState(formatTodayDate());
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteTarget, setDeleteTarget] = useState<DecryptedNote | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');
  const savedBadgeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (savedBadgeTimerRef.current) {
        window.clearTimeout(savedBadgeTimerRef.current);
      }
    };
  }, []);

  const getTagDisplayLabel = (tag: string): string => {
    if (tag === 'work') return t.notes.tagPresets.work;
    if (tag === 'personal') return t.notes.tagPresets.personal;
    if (tag === 'ideas') return t.notes.tagPresets.ideas;
    if (tag === 'passwords') return t.notes.tagPresets.passwords;
    return tag;
  };

  // Collect preset tags + any custom tags used across saved notes
  const availableFilterTags = useMemo(() => {
    const customSet = new Set<string>();
    for (const note of notes) {
      for (const tag of note.tags || []) {
        if (!PRESET_TAGS.includes(tag as NoteTagPreset)) {
          customSet.add(tag);
        }
      }
    }
    return [...PRESET_TAGS, ...Array.from(customSet)];
  }, [notes]);

  const filteredNotes = useMemo(
    () =>
      notes
        .filter((n) => (filter === 'all' ? true : n.kind === filter))
        .filter((n) =>
          tagFilter === 'all' ? true : Array.isArray(n.tags) && n.tags.includes(tagFilter)
        )
        .sort((a, b) => {
          if (a.kind === 'diary' && b.kind === 'diary' && a.entryDate !== b.entryDate) {
            return b.entryDate.localeCompare(a.entryDate);
          }
          return b.updatedAt - a.updatedAt;
        }),
    [filter, notes, tagFilter]
  );

  const buildDraftSnapshot = (
    draftKind: NoteKind,
    draftTitle: string,
    draftBody: string,
    draftTags: string[],
    draftDate: string
  ) =>
    JSON.stringify({
      kind: draftKind,
      title: draftTitle.trim(),
      body: draftBody.trim(),
      tags: draftTags,
      entryDate: draftKind === 'diary' ? draftDate || formatTodayDate() : formatTodayDate(),
    });

  const openCreateEditor = (opts?: {
    presetKind?: NoteKind;
    presetTags?: string[];
    presetTitle?: string;
  }) => {
    const nextKind = opts?.presetKind || (filter === 'diary' ? 'diary' : 'note');
    const nextTitle = opts?.presetTitle || '';
    const nextDate = formatTodayDate();
    const nextTags = opts?.presetTags || (tagFilter !== 'all' ? [tagFilter] : []);
    setEditingNote(null);
    setKind(nextKind);
    setTitle(nextTitle);
    setEntryDate(nextDate);
    setBody('');
    setTags(nextTags);
    setCustomTagInput('');
    setAutoSaveState('idle');
    lastSavedSnapshotRef.current = buildDraftSnapshot(nextKind, nextTitle, '', nextTags, nextDate);
    setEditorOpen(true);
  };

  const openEditEditor = (note: DecryptedNote) => {
    const nextDate = note.entryDate || formatTodayDate();
    const nextTags = Array.isArray(note.tags) ? note.tags : [];
    setEditingNote(note);
    setKind(note.kind);
    setTitle(note.title);
    setEntryDate(nextDate);
    setBody(note.body);
    setTags(nextTags);
    setCustomTagInput('');
    setAutoSaveState('idle');
    lastSavedSnapshotRef.current = buildDraftSnapshot(
      note.kind,
      note.title,
      note.body,
      nextTags,
      nextDate
    );
    setEditorOpen(true);
  };

  const toggleEditorTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const cleaned = customTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!cleaned) return;
    if (!tags.includes(cleaned)) {
      setTags((prev) => [...prev, cleaned]);
    }
    setCustomTagInput('');
  };

  const persistCurrentDraft = async (closeAfterSave: boolean): Promise<boolean> => {
    if (!title.trim() && !body.trim()) {
      if (closeAfterSave) {
        onNotify(t.notes.emptyFieldsToast);
      }
      return false;
    }

    const currentSnapshot = buildDraftSnapshot(kind, title, body, tags, entryDate);
    if (!closeAfterSave && currentSnapshot === lastSavedSnapshotRef.current) {
      return false;
    }

    if (closeAfterSave) {
      setIsSaving(true);
    } else {
      setAutoSaveState('saving');
    }

    try {
      const now = Date.now();
      const nextNote: DecryptedNote = {
        id: editingNote ? editingNote.id : createItemId(),
        kind,
        title: title.trim(),
        body: body.trim(),
        tags,
        entryDate: kind === 'diary' ? entryDate || formatTodayDate() : formatTodayDate(),
        createdAt: editingNote ? editingNote.createdAt : now,
        updatedAt: now,
      };

      const ok = await onSaveNote(nextNote);
      if (ok) {
        lastSavedSnapshotRef.current = currentSnapshot;
        setEditingNote(nextNote);
        if (closeAfterSave) {
          setEditorOpen(false);
          onNotify(t.notes.savedToast);
        } else {
          setAutoSaveState('saved');
          if (savedBadgeTimerRef.current) {
            window.clearTimeout(savedBadgeTimerRef.current);
          }
          savedBadgeTimerRef.current = window.setTimeout(() => {
            setAutoSaveState((prev) => (prev === 'saved' ? 'idle' : prev));
          }, 2600);
        }
      } else if (!closeAfterSave) {
        setAutoSaveState('idle');
      }
      return ok;
    } finally {
      if (closeAfterSave) {
        setIsSaving(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistCurrentDraft(true);
  };

  const handleTextareaBlur = () => {
    if (!editorOpen || isSaving) return;
    void persistCurrentDraft(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteNote(deleteTarget.id);
    if (editingNote?.id === deleteTarget.id) {
      setEditorOpen(false);
    }
    setDeleteTarget(null);
    onNotify(t.notes.deletedToast);
  };

  return (
    <div className="space-y-1">
      {/* Compact Native Card Header (Royal Blue Accent) */}
      <div className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <FileLock2 className="h-3 w-3" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold tracking-tight text-slate-900 dark:text-[#EAF0FF] leading-tight">
                {t.notes.heading}
              </h2>
              <p className="truncate text-[9.5px] text-slate-500 dark:text-[#94A3B8] leading-tight">
                {t.notes.subheading}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic(12);
              openCreateEditor();
            }}
            className="inline-flex h-7.5 shrink-0 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-bold text-white shadow-2xs transition-transform hover:bg-blue-700 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
            <span>{t.notes.newEntryBtn}</span>
          </button>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-100 dark:border-[#1E2740]">
          {/* Slim Modern AES-256 Counter Chip */}
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30 px-1.5 py-0.5 font-mono tabular-nums text-[9px] font-semibold text-blue-700 dark:text-blue-300">
            <FileLock2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            <span>{t.notes.countChip(notes.length)}</span>
          </span>

          {/* Segmented Type Filter */}
          <div className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-[#242E49] bg-slate-100 dark:bg-[#0A0E1A] p-0.5">
            {(
              [
                { key: 'all', label: t.notes.filterAll },
                { key: 'note', label: t.notes.filterNotes },
                { key: 'diary', label: t.notes.filterDiary },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setFilter(tab.key);
                  }}
                  className={`h-5 rounded px-1.5 text-[9.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-blue-600 shadow-2xs dark:bg-[#1A2238] dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#EAF0FF]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Horizontal Tag Filter Control */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
        <button
          type="button"
          onClick={() => {
            triggerHaptic(10);
            setTagFilter('all');
          }}
          className={`inline-flex h-5.5 shrink-0 items-center gap-1 rounded-full px-2 text-[9.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
            tagFilter === 'all'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#EAF0FF]'
          }`}
        >
          <Tag className="h-2.5 w-2.5" aria-hidden="true" />
          <span>{t.notes.allTagsFilter}</span>
        </button>

        {availableFilterTags.map((tagKey) => {
          const active = tagFilter === tagKey;
          return (
            <button
              key={tagKey}
              type="button"
              onClick={() => {
                triggerHaptic(10);
                setTagFilter(active ? 'all' : tagKey);
              }}
              className={`inline-flex h-5.5 shrink-0 items-center rounded-full px-2 text-[9.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md text-slate-600 dark:text-[#94A3B8] hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              #{getTagDisplayLabel(tagKey)}
            </button>
          );
        })}
      </div>

      {/* Shimmer Skeleton Loader OR Empty State OR Note Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 p-2 animate-pulse space-y-1.5"
            >
              <div className="h-3.5 bg-slate-200 dark:bg-[#1A2238] rounded w-3/4" />
              <div className="h-2.5 bg-slate-200 dark:bg-[#1A2238] rounded w-1/2" />
              <div className="h-6 bg-slate-200 dark:bg-[#1A2238] rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <FileLock2 className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[11px] font-bold text-slate-900 dark:text-[#EAF0FF] leading-tight">
                {t.notes.emptyTitle}
              </h3>
              <p className="mt-0.5 text-[9.5px] text-slate-500 dark:text-[#94A3B8] truncate">
                {t.notes.emptyBody}
              </p>
            </div>
          </div>

          {/* Compact Horizontal Pill / Tile Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                openCreateEditor({ presetKind: 'note', presetTags: ['work'] });
              }}
              className="inline-flex h-7.5 flex-1 min-w-[92px] items-center justify-center gap-1 rounded-lg border border-blue-200/80 dark:border-blue-500/30 bg-blue-50/85 dark:bg-blue-500/12 px-2 text-[10px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 active:scale-[0.97] whitespace-nowrap cursor-pointer"
            >
              <StickyNote className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{t.notes.quickNote}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                openCreateEditor({ presetKind: 'diary', presetTags: ['personal'] });
              }}
              className="inline-flex h-7.5 flex-1 min-w-[98px] items-center justify-center gap-1 rounded-lg border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/85 dark:bg-indigo-500/12 px-2 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-[0.97] whitespace-nowrap cursor-pointer"
            >
              <BookOpen className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{t.notes.personalDiary}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(12);
                openCreateEditor({
                  presetKind: 'note',
                  presetTags: ['passwords'],
                  presetTitle: t.notes.passwordTemplateTitle,
                });
              }}
              className="inline-flex h-7.5 flex-1 min-w-[104px] items-center justify-center gap-1 rounded-lg border border-emerald-200/80 dark:border-emerald-500/30 bg-emerald-50/85 dark:bg-emerald-500/12 px-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-[0.97] whitespace-nowrap cursor-pointer"
            >
              <KeyRound className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{t.notes.passwordMemo}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-[#24304D]/80 bg-white/82 dark:bg-[#0F1626]/78 backdrop-blur-md p-2 shadow-2xs transition-colors hover:border-blue-300 dark:hover:border-blue-500/40"
            >
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  openEditEditor(note);
                }}
                className="w-full text-left focus-visible:outline-2 focus-visible:outline-blue-600 rounded-md cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-[#1A2238] text-blue-600 dark:text-blue-400">
                      {note.kind === 'diary' ? (
                        <BookOpen className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <FileLock2 className="h-3 w-3" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[11px] font-bold text-slate-900 dark:text-[#EAF0FF]">
                        {note.title || t.notes.untitled}
                      </h3>
                      <p className="mt-0.5 text-[9px] text-slate-500 dark:text-[#94A3B8] font-mono tabular-nums">
                        {note.kind === 'diary' ? t.notes.kindDiary : t.notes.kindNote} ·{' '}
                        {note.kind === 'diary'
                          ? note.entryDate
                          : new Date(note.updatedAt).toLocaleDateString()}{' '}
                        · {t.notes.encryptedBadge}
                      </p>
                    </div>
                  </div>
                </div>

                {note.body && (
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-600 dark:text-[#CBD5E1]">
                    {note.body}
                  </p>
                )}

                {note.tags && note.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                    {note.tags.map((tag) => (
                      <span key={tag}>#{getTagDisplayLabel(tag)}</span>
                    ))}
                  </div>
                )}
              </button>

              <div className="mt-1 flex items-center justify-end border-t border-slate-100 dark:border-[#1E2740] pt-0.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(note)}
                  className="inline-flex h-5.5 items-center gap-1 rounded px-1.5 text-[9.5px] font-medium text-slate-500 dark:text-[#94A3B8] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400 cursor-pointer"
                  aria-label={`${t.notes.deleteBtn}: ${note.title || t.notes.untitled}`}
                >
                  <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>{t.common.delete}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Encrypted Note / Diary Editor Sheet with Tag Picker */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-editor-title"
        >
          <form
            onSubmit={(e) => void handleSave(e)}
            className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-[#242E49] bg-white dark:bg-[#121829] p-4 shadow-2xl"
          >
            <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-200 dark:bg-[#2B3757] sm:hidden" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <h3
                  id="note-editor-title"
                  className="text-sm font-bold text-slate-900 dark:text-[#EAF0FF] truncate"
                >
                  {editingNote ? t.notes.editorEditTitle : t.notes.editorCreateTitle}
                </h3>
                {autoSaveState !== 'idle' && (
                  <span
                    role="status"
                    aria-live="polite"
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                      autoSaveState === 'saved'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-500/30'
                        : 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-500/30'
                    }`}
                  >
                    {autoSaveState === 'saved' && (
                      <Check className="h-2.5 w-2.5 stroke-[2.5]" aria-hidden="true" />
                    )}
                    <span>
                      {autoSaveState === 'saving'
                        ? t.notes.autoSavingLabel
                        : t.notes.autoSavedLabel}
                    </span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1A2238] cursor-pointer"
                aria-label={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-0.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8] mb-1">
                    {t.notes.typeLabel}
                  </label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as NoteKind)}
                    className="h-9 w-full rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-2.5 text-xs font-medium text-slate-900 dark:text-[#EAF0FF] focus:border-blue-600 focus:outline-none"
                  >
                    <option value="note">{t.notes.kindNote}</option>
                    <option value="diary">{t.notes.kindDiary}</option>
                  </select>
                </div>

                {kind === 'diary' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8] mb-1">
                      {t.notes.dateLabel}
                    </label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-2.5 text-xs text-slate-900 dark:text-[#EAF0FF] font-mono focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8] mb-1">
                  {t.notes.titleLabel}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.notes.titlePlaceholder}
                  className="h-9 w-full rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-3 text-xs text-slate-900 dark:text-[#EAF0FF] placeholder-slate-400 dark:placeholder-[#64748B] focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Tags Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8] mb-1.5">
                  {t.notes.tagsLabel}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((preset) => {
                    const selected = tags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => toggleEditorTag(preset)}
                        className={`h-7 rounded-full px-2.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                          selected
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] text-slate-600 dark:text-[#CBD5E1]'
                        }`}
                      >
                        #{getTagDisplayLabel(preset)}
                      </button>
                    );
                  })}
                  {tags
                    .filter((tag) => !PRESET_TAGS.includes(tag as NoteTagPreset))
                    .map((custom) => (
                      <button
                        key={custom}
                        type="button"
                        onClick={() => toggleEditorTag(custom)}
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-blue-600 px-2.5 text-[11px] font-semibold text-white cursor-pointer"
                      >
                        <span>#{custom}</span>
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    ))}
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder={t.notes.customTagPlaceholder}
                    className="h-8 flex-1 rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-2.5 text-xs text-slate-900 dark:text-[#EAF0FF] placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="h-8 rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-100 dark:bg-[#1A2238] px-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-200 dark:hover:bg-[#232D49] cursor-pointer"
                  >
                    {t.notes.addTagBtn}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                    {t.notes.bodyLabel}
                  </label>
                  {autoSaveState === 'saved' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
                      <span>{t.notes.autoSavedLabel}</span>
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    if (autoSaveState === 'saved') {
                      setAutoSaveState('idle');
                    }
                  }}
                  onBlur={handleTextareaBlur}
                  placeholder={t.notes.bodyPlaceholder}
                  className="w-full rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-50 dark:bg-[#1A2238] px-3 py-2 text-xs leading-relaxed text-slate-900 dark:text-[#EAF0FF] placeholder-slate-400 dark:placeholder-[#64748B] focus:border-blue-600 focus:outline-none resize-y"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-[#1E2740]">
              {editingNote && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(editingNote)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-3 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer"
                  aria-label={t.notes.deleteBtn}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="h-9 flex-1 rounded-lg border border-slate-200 dark:border-[#242E49] bg-slate-100 dark:bg-[#1A2238] px-3 text-xs font-semibold text-slate-700 dark:text-[#EAF0FF] hover:bg-slate-200 whitespace-nowrap cursor-pointer"
              >
                {t.notes.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="h-9 flex-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {t.notes.saveBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t.notes.confirmDeleteTitle}
        body={t.notes.confirmDeleteBody}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

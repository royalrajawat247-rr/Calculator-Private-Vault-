import type {
  EncryptedNoteRecord,
  GalleryItem,
  PinRecord,
  VaultSettings,
} from '../types/vault';

const KEYS = {
  PIN: 'rcv_pin_record_v2',
  GALLERY_LEGACY: 'rcv_gallery_v2',
  NOTES: 'rcv_notes_v2',
  SETTINGS: 'rcv_settings_v4',
  LAST_BACKUP: 'rcv_last_backup_v2',
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function getStoredPinRecord(): PinRecord | null {
  return readJson<PinRecord | null>(KEYS.PIN, null);
}

export function saveStoredPinRecord(record: PinRecord): boolean {
  return writeJson(KEYS.PIN, record);
}

export function clearStoredPinRecord(): void {
  try {
    localStorage.removeItem(KEYS.PIN);
  } catch {
    // Ignore storage removal errors
  }
}

export function popLegacyLocalGallery(): GalleryItem[] {
  const legacy = readJson<GalleryItem[]>(KEYS.GALLERY_LEGACY, []);
  if (legacy.length > 0) {
    try {
      localStorage.removeItem(KEYS.GALLERY_LEGACY);
    } catch {
      // Ignore removal error
    }
  }
  return legacy.map((item) => ({
    ...item,
    kind: item.mimeType?.startsWith('video/') ? 'video' : 'image',
  }));
}

export function getStoredEncryptedNotes(): EncryptedNoteRecord[] {
  return readJson<EncryptedNoteRecord[]>(KEYS.NOTES, []);
}

export function saveStoredEncryptedNotes(items: EncryptedNoteRecord[]): boolean {
  return writeJson(KEYS.NOTES, items);
}

export function getStoredSettings(): VaultSettings {
  const raw = readJson<{ theme?: string; language?: string }>(KEYS.SETTINGS, {});
  const rawTheme = raw.theme;
  const theme =
    rawTheme === 'cosmic' || rawTheme === 'emerald' || rawTheme === 'light'
      ? rawTheme
      : rawTheme === 'dark'
        ? 'cosmic'
        : 'light';
  const language = raw.language === 'hi' ? 'hi' : 'en';
  return { theme, language };
}

export function saveStoredSettings(settings: VaultSettings): boolean {
  return writeJson(KEYS.SETTINGS, settings);
}

export function getLastBackupAt(): number | null {
  return readJson<number | null>(KEYS.LAST_BACKUP, null);
}

export function saveLastBackupAt(timestamp: number): boolean {
  return writeJson(KEYS.LAST_BACKUP, timestamp);
}

export function getLocalStorageUsageKb(): number {
  let totalBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const v = localStorage.getItem(k) || '';
      totalBytes += (k.length + v.length) * 2;
    }
  } catch {
    return 0;
  }
  return Math.round(totalBytes / 1024);
}

export function formatTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function createItemId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export async function fileToIndexedDbMedia(file: File): Promise<{
  kind: 'image' | 'video' | 'pdf';
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
}> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    return {
      kind: 'pdf',
      blob: file,
      mimeType: 'application/pdf',
      sizeBytes: file.size,
    };
  }

  if (file.type.startsWith('video/')) {
    return {
      kind: 'video',
      blob: file,
      mimeType: file.type || 'video/mp4',
      sizeBytes: file.size,
    };
  }

  return {
    kind: 'image',
    blob: file,
    mimeType: file.type || 'image/jpeg',
    sizeBytes: file.size,
  };
}

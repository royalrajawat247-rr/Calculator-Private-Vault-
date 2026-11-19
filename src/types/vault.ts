export type Language = 'en' | 'hi';

export type ThemeMode = 'light' | 'cosmic' | 'emerald';

export type MediaKind = 'image' | 'video' | 'pdf';

export type VaultTab = 'gallery' | 'notes' | 'backup' | 'settings';

export type NoteKind = 'note' | 'diary';

export type NoteFilter = 'all' | 'note' | 'diary';

export type NoteTagPreset = 'work' | 'personal' | 'ideas' | 'passwords';

export type NoteTagFilter = 'all' | string;

export interface PinRecord {
  hashHex: string;
  saltHex: string;
  iterations: number;
  isDefaultPin?: boolean;
}

export interface GalleryItem {
  id: string;
  name: string;
  kind: MediaKind;
  mimeType: string;
  dataUrl?: string;
  blob?: Blob;
  sizeBytes: number;
  createdAt: number;
  deletedAt?: number | null;
}

export interface EncryptedNoteRecord {
  id: string;
  kind: NoteKind;
  entryDate: string;
  createdAt: number;
  updatedAt: number;
  saltHex: string;
  ivHex: string;
  ciphertextB64: string;
}

export interface DecryptedNote {
  id: string;
  kind: NoteKind;
  title: string;
  body: string;
  tags: string[];
  entryDate: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultSettings {
  theme: ThemeMode;
  language: Language;
}

export interface VaultBackupBundle {
  app: 'RoyalCalculatorVault';
  version: number;
  exportedAt: number;
  gallery: GalleryItem[];
  notes: DecryptedNote[];
}

export interface EncryptedBackupFile {
  app: 'RoyalCalculatorVault';
  version: number;
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  saltHex: string;
  ivHex: string;
  ciphertextB64: string;
  exportedAt: number;
}

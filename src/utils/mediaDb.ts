import type { GalleryItem } from '../types/vault';

const DB_NAME = 'RoyalVaultMediaDB';
const DB_VERSION = 2;
const STORE_NAME = 'media';
export const TRASH_RETENTION_DAYS = 30;
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function getRemainingTrashDays(deletedAt: number, now = Date.now()): number {
  const remainingMs = deletedAt + TRASH_RETENTION_MS - now;
  return Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openMediaDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to serialize blob'));
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string, fallbackMime = 'application/octet-stream'): Promise<Blob> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  if (blob.type) return blob;
  return new Blob([blob], { type: fallbackMime });
}

export async function serializeGalleryForBackup(items: GalleryItem[]): Promise<GalleryItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.dataUrl) {
        return {
          id: item.id,
          name: item.name,
          kind: item.kind,
          mimeType: item.mimeType,
          dataUrl: item.dataUrl,
          sizeBytes: item.sizeBytes,
          createdAt: item.createdAt,
        };
      }
      if (item.blob) {
        const dataUrl = await blobToDataUrl(item.blob);
        return {
          id: item.id,
          name: item.name,
          kind: item.kind,
          mimeType: item.mimeType,
          dataUrl,
          sizeBytes: item.sizeBytes,
          createdAt: item.createdAt,
        };
      }
      return item;
    })
  );
}

export async function getAllMediaItems(): Promise<GalleryItem[]> {
  try {
    const db = await openMediaDb();
    const raw = await new Promise<GalleryItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as GalleryItem[]) || []);
      req.onerror = () => reject(req.error);
    });

    const now = Date.now();
    const expiredIds: string[] = [];
    const activeRecords: GalleryItem[] = [];

    for (const item of raw) {
      if (typeof item.deletedAt === 'number' && now - item.deletedAt >= TRASH_RETENTION_MS) {
        expiredIds.push(item.id);
        continue;
      }
      activeRecords.push({
        ...item,
        kind:
          item.kind ||
          (item.mimeType === 'application/pdf'
            ? 'pdf'
            : item.mimeType?.startsWith('video/')
              ? 'video'
              : 'image'),
      });
    }

    if (expiredIds.length > 0) {
      void deleteMediaItems(expiredIds);
    }

    return activeRecords;
  } catch {
    return [];
  }
}

export async function putMediaItems(items: GalleryItem[]): Promise<boolean> {
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const item of items) {
        // Store native Blob cleanly inside IndexedDB when available to avoid Base64 bloat
        const record: GalleryItem = item.blob
          ? {
              id: item.id,
              name: item.name,
              kind: item.kind,
              mimeType: item.mimeType,
              blob: item.blob,
              sizeBytes: item.sizeBytes,
              createdAt: item.createdAt,
              ...(typeof item.deletedAt === 'number' ? { deletedAt: item.deletedAt } : {}),
            }
          : item;
        store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

export async function updateMediaDeletedAt(
  ids: string[],
  deletedAt: number | null
): Promise<boolean> {
  if (ids.length === 0) return true;
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) {
        const req = store.get(id);
        req.onsuccess = () => {
          const existing = req.result as GalleryItem | undefined;
          if (!existing) return;
          if (deletedAt === null) {
            const { deletedAt: _removed, ...rest } = existing;
            void _removed;
            store.put(rest);
          } else {
            store.put({ ...existing, deletedAt });
          }
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteMediaItem(id: string): Promise<boolean> {
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteMediaItems(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  try {
    const db = await openMediaDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) {
        store.delete(id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

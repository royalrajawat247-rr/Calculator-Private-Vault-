import type {
  DecryptedNote,
  EncryptedBackupFile,
  EncryptedNoteRecord,
  PinRecord,
  VaultBackupBundle,
} from '../types/vault';

const PBKDF2_ITERATIONS = 150_000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const pairs = hex.match(/.{1,2}/g);
  if (!pairs) return new Uint8Array(0);
  return Uint8Array.from(pairs.map((p) => parseInt(p, 16)));
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveKeyMaterial(
  pin: string,
  salt: Uint8Array,
  iterations: number,
  usage: 'bits' | 'aes-key'
): Promise<ArrayBuffer | CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const params: Pbkdf2Params = {
    name: 'PBKDF2',
    salt: toExactArrayBuffer(salt),
    iterations,
    hash: 'SHA-256',
  };

  if (usage === 'bits') {
    return crypto.subtle.deriveBits(params, keyMaterial, 256);
  }

  return crypto.subtle.deriveKey(
    params,
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function createPinRecord(pin: string): Promise<PinRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = (await deriveKeyMaterial(pin, salt, PBKDF2_ITERATIONS, 'bits')) as ArrayBuffer;
  return {
    hashHex: bytesToHex(new Uint8Array(bits)),
    saltHex: bytesToHex(salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function verifyPinRecord(pin: string, record: PinRecord): Promise<boolean> {
  const salt = hexToBytes(record.saltHex);
  const bits = (await deriveKeyMaterial(
    pin,
    salt,
    record.iterations || PBKDF2_ITERATIONS,
    'bits'
  )) as ArrayBuffer;
  return bytesToHex(new Uint8Array(bits)) === record.hashHex;
}

export async function encryptNoteRecord(
  pin: string,
  note: DecryptedNote
): Promise<EncryptedNoteRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = (await deriveKeyMaterial(pin, salt, PBKDF2_ITERATIONS, 'aes-key')) as CryptoKey;

  const plaintext = new TextEncoder().encode(
    JSON.stringify({
      title: note.title,
      body: note.body,
      tags: Array.isArray(note.tags) ? note.tags : [],
      entryDate: note.entryDate,
    })
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toExactArrayBuffer(iv) },
    aesKey,
    plaintext
  );

  return {
    id: note.id,
    kind: note.kind,
    entryDate: note.entryDate,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    saltHex: bytesToHex(salt),
    ivHex: bytesToHex(iv),
    ciphertextB64: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptNoteRecord(
  pin: string,
  record: EncryptedNoteRecord
): Promise<DecryptedNote> {
  const salt = hexToBytes(record.saltHex);
  const iv = hexToBytes(record.ivHex);
  const aesKey = (await deriveKeyMaterial(pin, salt, PBKDF2_ITERATIONS, 'aes-key')) as CryptoKey;

  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toExactArrayBuffer(iv) },
    aesKey,
    toExactArrayBuffer(base64ToBytes(record.ciphertextB64))
  );

  const parsed = JSON.parse(new TextDecoder().decode(plaintextBuf)) as {
    title: string;
    body: string;
    tags?: string[];
    entryDate?: string;
  };

  return {
    id: record.id,
    kind: record.kind,
    title: parsed.title || '',
    body: parsed.body || '',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    entryDate: parsed.entryDate || record.entryDate,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function createEncryptedBackupJson(
  pin: string,
  bundle: VaultBackupBundle
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = (await deriveKeyMaterial(pin, salt, PBKDF2_ITERATIONS, 'aes-key')) as CryptoKey;

  const plaintext = new TextEncoder().encode(JSON.stringify(bundle));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toExactArrayBuffer(iv) },
    aesKey,
    plaintext
  );

  const filePayload: EncryptedBackupFile = {
    app: 'RoyalCalculatorVault',
    version: 2,
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    saltHex: bytesToHex(salt),
    ivHex: bytesToHex(iv),
    ciphertextB64: bytesToBase64(new Uint8Array(ciphertext)),
    exportedAt: bundle.exportedAt,
  };

  return JSON.stringify(filePayload, null, 2);
}

export async function decryptBackupJson(
  pin: string,
  rawJsonText: string
): Promise<VaultBackupBundle> {
  const parsed = JSON.parse(rawJsonText) as EncryptedBackupFile;
  if (
    !parsed ||
    parsed.app !== 'RoyalCalculatorVault' ||
    !parsed.saltHex ||
    !parsed.ivHex ||
    !parsed.ciphertextB64
  ) {
    throw new Error('Invalid backup format');
  }

  const salt = hexToBytes(parsed.saltHex);
  const iv = hexToBytes(parsed.ivHex);
  const iterations = parsed.iterations || PBKDF2_ITERATIONS;
  const aesKey = (await deriveKeyMaterial(pin, salt, iterations, 'aes-key')) as CryptoKey;

  const plaintextBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toExactArrayBuffer(iv) },
    aesKey,
    toExactArrayBuffer(base64ToBytes(parsed.ciphertextB64))
  );

  const bundle = JSON.parse(new TextDecoder().decode(plaintextBuf)) as VaultBackupBundle;
  if (!bundle || bundle.app !== 'RoyalCalculatorVault') {
    throw new Error('Corrupted backup payload');
  }
  return bundle;
}

export function safeEvaluateMath(rawExpression: string): number {
  const src = rawExpression.replace(/\s+/g, '');
  if (!src) throw new Error('EMPTY');
  let cursor = 0;

  function parseNumber(): number {
    const slice = src.slice(cursor);
    const match = slice.match(/^(\d+\.?\d*|\.\d+)/);
    if (!match) throw new Error('SYNTAX');
    cursor += match[0].length;
    let value = parseFloat(match[0]);
    while (src[cursor] === '%') {
      value /= 100;
      cursor++;
    }
    return value;
  }

  function parseFactor(): number {
    if (src[cursor] === '-') {
      cursor++;
      return -parseFactor();
    }
    if (src[cursor] === '+') {
      cursor++;
      return parseFactor();
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (src[cursor] === '*' || src[cursor] === '/') {
      const op = src[cursor++];
      const right = parseFactor();
      if (op === '*') {
        value *= right;
      } else {
        if (right === 0) throw new Error('DIV_ZERO');
        value /= right;
      }
    }
    return value;
  }

  function parseExpression(): number {
    let value = parseTerm();
    while (src[cursor] === '+' || src[cursor] === '-') {
      const op = src[cursor++];
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  const result = parseExpression();
  if (cursor !== src.length || !Number.isFinite(result)) {
    throw new Error('SYNTAX');
  }
  return Math.round(result * 1e10) / 1e10;
}

import { EncryptedPayload } from '../types';

/**
 * Checks if the current execution context has access to the native WebCrypto API.
 * In browsers, requires a secure context (HTTPS or localhost).
 */
export function isWebCryptoSupported(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.subtle !== 'undefined'
  );
}

export function getCrypto(): Crypto {
  if (!isWebCryptoSupported()) {
    throw new Error('WebCrypto API is unavailable in this insecure context.');
  }
  return globalThis.crypto;
}

export function getSubtleCrypto(): SubtleCrypto {
  return getCrypto().subtle;
}

// --- Base64 Utilities ---

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new ArrayBuffer(len);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// --- Symmetric Key (AES-256-GCM) ---

/**
 * Generate a cryptographically secure 256-bit AES-GCM room key in browser memory.
 */
export async function generateRoomKey(): Promise<CryptoKey> {
  return getSubtleCrypto().generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // Extractable so it can be exported for URL hash or ECDH key wrapping
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey to a URL-safe Base64 string (for URL hash fragment #key=...).
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = await getSubtleCrypto().exportKey('raw', key);
  return arrayBufferToBase64(raw);
}

/**
 * Import an AES-256-GCM CryptoKey from a Base64 string.
 */
export async function importKeyFromBase64(base64Key: string): Promise<CryptoKey> {
  const rawBytes = base64ToArrayBuffer(base64Key);
  if (rawBytes.byteLength !== 32) {
    throw new Error('Invalid key length: expected 256 bits (32 bytes).');
  }
  return getSubtleCrypto().importKey(
    'raw',
    rawBytes as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    true, // Keep extractable for ECDH handshake wrapping
    ['encrypt', 'decrypt']
  );
}

// --- Authenticated Encryption with Associated Data (AEAD) ---

/**
 * Encrypt arbitrary bytes with AES-256-GCM using room_id as Additional Authenticated Data (AAD).
 */
export async function encryptBytes(
  key: CryptoKey,
  data: Uint8Array,
  roomId: string
): Promise<EncryptedPayload> {
  // 12 bytes (96 bits) random IV per NIST SP 800-38D
  const iv = getCrypto().getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode(`room:${roomId}`);

  const ciphertextBuffer = await getSubtleCrypto().encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      additionalData: aad,
      tagLength: 128,
    },
    key,
    data as unknown as BufferSource
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv),
    v: 2,
  };
}

/**
 * Decrypt an EncryptedPayload with AES-256-GCM and verify AAD.
 * Throws an error if the tag is invalid, the data was tampered with, or the room_id doesn't match.
 */
export async function decryptBytes(
  key: CryptoKey,
  payload: EncryptedPayload,
  roomId: string
): Promise<Uint8Array> {
  const iv = base64ToArrayBuffer(payload.iv);
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);
  const aad = new TextEncoder().encode(`room:${roomId}`);

  try {
    const decryptedBuffer = await getSubtleCrypto().decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
        additionalData: aad,
        tagLength: 128,
      },
      key,
      ciphertext as unknown as BufferSource
    );
    return new Uint8Array(decryptedBuffer);
  } catch {
    throw new Error('Decryption failed: invalid authentication tag or corrupted ciphertext.');
  }
}

/**
 * Pads bytes to a multiple of blockSize (default 256 bytes, minimum 256 bytes)
 * using a 4-byte big-endian length prefix and cryptographically random noise.
 * Mitigates network traffic analysis and packet length inference side-channels.
 */
export function padBytes(data: Uint8Array, blockSize: number = 256): Uint8Array {
  const dataLen = data.byteLength;
  const headerLen = 4;
  const totalNeeded = headerLen + dataLen;
  const remainder = totalNeeded % blockSize;
  const paddingLen = remainder === 0 ? 0 : blockSize - remainder;
  const totalLen = Math.max(blockSize, totalNeeded + paddingLen);

  const padded = new Uint8Array(totalLen);
  const view = new DataView(padded.buffer);
  view.setUint32(0, dataLen, false);

  padded.set(data, headerLen);

  if (totalLen > totalNeeded) {
    const noise = new Uint8Array(totalLen - totalNeeded);
    getCrypto().getRandomValues(noise);
    padded.set(noise, totalNeeded);
  }

  return padded;
}

/**
 * Strips the 4-byte length prefix and random padding.
 * Falls back gracefully to raw bytes if data was not padded (backwards compatibility).
 */
export function unpadBytes(padded: Uint8Array): Uint8Array {
  if (padded.byteLength >= 4) {
    const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
    const dataLen = view.getUint32(0, false);
    if (dataLen <= padded.byteLength - 4) {
      return padded.subarray(4, 4 + dataLen);
    }
  }
  return padded;
}

/**
 * Encrypt a JSON object into an EncryptedPayload with traffic analysis resistance padding.
 */
export async function encryptJson<T>(
  key: CryptoKey,
  data: T,
  roomId: string
): Promise<EncryptedPayload> {
  const jsonStr = JSON.stringify(data);
  const rawBytes = new TextEncoder().encode(jsonStr);
  const paddedBytes = padBytes(rawBytes);
  return encryptBytes(key, paddedBytes, roomId);
}

/**
 * Decrypt an EncryptedPayload back into a parsed JSON object, stripping cryptographic padding.
 */
export async function decryptJson<T>(
  key: CryptoKey,
  payload: EncryptedPayload,
  roomId: string
): Promise<T> {
  const decryptedBytes = await decryptBytes(key, payload, roomId);
  const unpaddedBytes = unpadBytes(decryptedBytes);
  const jsonStr = new TextDecoder().decode(unpaddedBytes);
  return JSON.parse(jsonStr) as T;
}

// --- Ephemeral Diffie-Hellman Handshake (ECDH P-256) ---

export interface ECDHKeyPair {
  keyPair: CryptoKeyPair;
  publicKeyBase64: string;
}

/**
 * Generate an ephemeral ECDH keypair (P-256) for peer-to-peer key exchange.
 */
export async function generateHandshakeKeyPair(): Promise<ECDHKeyPair> {
  const keyPair = await getSubtleCrypto().generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );

  const rawPublic = await getSubtleCrypto().exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = arrayBufferToBase64(rawPublic);

  return {
    keyPair,
    publicKeyBase64,
  };
}

/**
 * Derive an AES-256-GCM wrapping key from our private key and peer's public key.
 */
export async function deriveWrappingKey(
  myPrivateKey: CryptoKey,
  peerPublicKeyBase64: string
): Promise<CryptoKey> {
  const peerPublicBytes = base64ToArrayBuffer(peerPublicKeyBase64);
  const peerPublicKey = await getSubtleCrypto().importKey(
    'raw',
    peerPublicBytes as unknown as BufferSource,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false,
    []
  );

  return getSubtleCrypto().deriveKey(
    {
      name: 'ECDH',
      public: peerPublicKey,
    },
    myPrivateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Wrap (encrypt) the room key with the derived wrapping key.
 */
export async function wrapRoomKey(
  wrappingKey: CryptoKey,
  roomKey: CryptoKey
): Promise<{ wrappedKeyBase64: string; ivBase64: string }> {
  const rawRoomKey = await getSubtleCrypto().exportKey('raw', roomKey);
  const iv = getCrypto().getRandomValues(new Uint8Array(12));

  const wrappedBuffer = await getSubtleCrypto().encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    wrappingKey,
    rawRoomKey
  );

  return {
    wrappedKeyBase64: arrayBufferToBase64(wrappedBuffer),
    ivBase64: arrayBufferToBase64(iv),
  };
}

/**
 * Unwrap (decrypt) the room key using the derived wrapping key.
 */
export async function unwrapRoomKey(
  wrappingKey: CryptoKey,
  wrappedKeyBase64: string,
  ivBase64: string
): Promise<CryptoKey> {
  const wrappedBytes = base64ToArrayBuffer(wrappedKeyBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  const rawRoomKeyBuffer = await getSubtleCrypto().decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    wrappingKey,
    wrappedBytes as unknown as BufferSource
  );

  return getSubtleCrypto().importKey(
    'raw',
    rawRoomKeyBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// --- Short Authentication String (SAS / Fingerprint) ---

const SAS_WORDS = [
  'COBALT', 'SHADOW', 'ORBIT', 'AURORA', 'ECHO', 'VORTEX', 'NEBULA', 'PULSE',
  'CYPHER', 'ZENITH', 'FALCON', 'MIRAGE', 'SOLAR', 'TITAN', 'PRISM', 'SUMMIT',
];

/**
 * Generate a 4-word Short Authentication String (SAS) fingerprint from the room key
 * for visual out-of-band verification against MITM attacks.
 */
export async function generateFingerprint(roomKey: CryptoKey): Promise<string> {
  const raw = await getSubtleCrypto().exportKey('raw', roomKey);
  const hashBuffer = await getSubtleCrypto().digest('SHA-256', raw);
  const hashBytes = new Uint8Array(hashBuffer);

  const word1 = SAS_WORDS[hashBytes[0]! % SAS_WORDS.length];
  const word2 = SAS_WORDS[hashBytes[1]! % SAS_WORDS.length];
  const word3 = SAS_WORDS[hashBytes[2]! % SAS_WORDS.length];
  const word4 = SAS_WORDS[hashBytes[3]! % SAS_WORDS.length];

  return `${word1}-${word2}-${word3}-${word4}`;
}

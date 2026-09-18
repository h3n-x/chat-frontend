import { describe, it, expect } from 'vitest';
import {
  generateRoomKey,
  exportKeyToBase64,
  importKeyFromBase64,
  encryptJson,
  decryptJson,
  generateHandshakeKeyPair,
  deriveWrappingKey,
  wrapRoomKey,
  unwrapRoomKey,
  generateFingerprint,
} from './webcrypto';

describe('WebCrypto E2EE Primitives', () => {
  it('should generate, export, and re-import an AES-256-GCM room key', async () => {
    const originalKey = await generateRoomKey();
    const base64Key = await exportKeyToBase64(originalKey);

    expect(typeof base64Key).toBe('string');
    expect(base64Key.length).toBeGreaterThan(30);

    const importedKey = await importKeyFromBase64(base64Key);
    const reExported = await exportKeyToBase64(importedKey);

    expect(reExported).toBe(base64Key);
  });

  it('should encrypt and decrypt JSON messages with AAD matching', async () => {
    const key = await generateRoomKey();
    const roomId = 'SECURE_42';
    const payloadData = {
      id: 'msg-1',
      sender_name: 'Ghost',
      color: '#4ECDC4',
      text: 'Top secret test',
      timestamp: 1726630000000,
    };

    const envelope = await encryptJson(key, payloadData, roomId);
    expect(envelope.ciphertext).toBeDefined();
    expect(envelope.iv).toBeDefined();
    expect(envelope.v).toBe(2);

    // Decrypt with correct room_id
    const decrypted = await decryptJson<typeof payloadData>(key, envelope, roomId);
    expect(decrypted).toEqual(payloadData);

    // Decrypt with wrong room_id (AAD mismatch) must throw
    await expect(
      decryptJson(key, envelope, 'DIFFERENT_ROOM')
    ).rejects.toThrow();
  });

  it('should successfully complete ECDH key agreement and key wrap/unwrap', async () => {
    // Alice generates room key
    const roomKey = await generateRoomKey();
    const originalB64 = await exportKeyToBase64(roomKey);

    // Alice and Bob generate ephemeral ECDH key pairs
    const aliceHandshake = await generateHandshakeKeyPair();
    const bobHandshake = await generateHandshakeKeyPair();

    // Alice derives wrapping key using Bob's public key
    const aliceWrapKey = await deriveWrappingKey(
      aliceHandshake.keyPair.privateKey,
      bobHandshake.publicKeyBase64
    );

    // Bob derives wrapping key using Alice's public key
    const bobWrapKey = await deriveWrappingKey(
      bobHandshake.keyPair.privateKey,
      aliceHandshake.publicKeyBase64
    );

    // Alice wraps roomKey
    const { wrappedKeyBase64, ivBase64 } = await wrapRoomKey(aliceWrapKey, roomKey);

    // Bob unwraps roomKey
    const bobUnwrappedKey = await unwrapRoomKey(bobWrapKey, wrappedKeyBase64, ivBase64);
    const bobB64 = await exportKeyToBase64(bobUnwrappedKey);

    expect(bobB64).toBe(originalB64);
  });

  it('should generate a 4-word Short Authentication String (SAS) fingerprint', async () => {
    const key = await generateRoomKey();
    const fingerprint = await generateFingerprint(key);

    const parts = fingerprint.split('-');
    expect(parts.length).toBe(4);
    for (const part of parts) {
      expect(part.length).toBeGreaterThan(0);
    }
  });
});

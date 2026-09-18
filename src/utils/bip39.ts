/**
 * BIP-39 Mnemonic Phrase Utility
 * Converts 256-bit symmetric room keys into 24-word standard BIP-39 mnemonics,
 * and recovers the 256-bit key from a 24-word mnemonic with SHA-256 checksum verification.
 */

import words from './bip39_words.json';

const WORD_LIST: string[] = words;
const WORD_MAP: Map<string, number> = new Map(
  WORD_LIST.map((word, index) => [word.toLowerCase(), index])
);

/**
 * Converts a 32-byte (256-bit) raw key into a standard 24-word BIP-39 mnemonic.
 * @param entropy 32-byte Uint8Array key
 * @returns 24-word string separated by spaces
 */
export async function entropyToMnemonic(entropy: Uint8Array): Promise<string> {
  if (entropy.length !== 32) {
    throw new Error(`Entropy must be exactly 32 bytes (256 bits), received ${entropy.length} bytes`);
  }

  // Calculate SHA-256 checksum (first 8 bits = 1 byte)
  const hashBuffer = await crypto.subtle.digest('SHA-256', entropy as unknown as BufferSource);
  const hashArray = new Uint8Array(hashBuffer);
  const checksum = hashArray[0]!;

  // Build 264 bit string: 256 entropy bits + 8 checksum bits
  let bits = '';
  for (let i = 0; i < entropy.length; i++) {
    bits += entropy[i]!.toString(2).padStart(8, '0');
  }
  bits += checksum.toString(2).padStart(8, '0');

  // Split into 24 chunks of 11 bits
  const resultWords: string[] = [];
  for (let i = 0; i < 24; i++) {
    const chunk = bits.slice(i * 11, (i + 1) * 11);
    const index = parseInt(chunk, 2);
    const word = WORD_LIST[index];
    if (!word) {
      throw new Error(`Invalid BIP-39 index: ${index}`);
    }
    resultWords.push(word);
  }

  return resultWords.join(' ');
}

/**
 * Converts a 24-word BIP-39 mnemonic back into the original 32-byte (256-bit) key.
 * Verifies the 8-bit SHA-256 checksum to prevent typos or corruption.
 * @param mnemonic 24 words separated by whitespace
 * @returns 32-byte Uint8Array
 */
export async function mnemonicToEntropy(mnemonic: string): Promise<Uint8Array> {
  const wordsArray = mnemonic
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (wordsArray.length !== 24) {
    throw new Error(`Mnemonic must contain exactly 24 words. Received ${wordsArray.length} words.`);
  }

  // Convert words to 264-bit string
  let bits = '';
  for (let i = 0; i < wordsArray.length; i++) {
    const word = wordsArray[i]!;
    const index = WORD_MAP.get(word);
    if (index === undefined) {
      throw new Error(`Invalid word in mnemonic at position ${i + 1}: "${word}"`);
    }
    bits += index.toString(2).padStart(11, '0');
  }

  // First 256 bits = entropy, last 8 bits = checksum
  const entropyBits = bits.slice(0, 256);
  const checksumBits = bits.slice(256, 264);

  const entropyBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    entropyBytes[i] = parseInt(entropyBits.slice(i * 8, (i + 1) * 8), 2);
  }

  // Verify checksum
  const hashBuffer = await crypto.subtle.digest('SHA-256', entropyBytes as unknown as BufferSource);
  const hashArray = new Uint8Array(hashBuffer);
  const calculatedChecksum = hashArray[0]!;
  const parsedChecksum = parseInt(checksumBits, 2);

  if (calculatedChecksum !== parsedChecksum) {
    throw new Error('Checksum verification failed. The mnemonic contains invalid or corrupted words.');
  }

  return entropyBytes;
}

/**
 * Converts Base64 RoomKey string to BIP-39 mnemonic
 */
export async function base64KeyToMnemonic(base64Key: string): Promise<string> {
  const binary = atob(base64Key);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return entropyToMnemonic(bytes);
}

/**
 * Converts BIP-39 mnemonic to Base64 RoomKey string
 */
export async function mnemonicToBase64Key(mnemonic: string): Promise<string> {
  const entropy = await mnemonicToEntropy(mnemonic);
  let binary = '';
  for (let i = 0; i < entropy.length; i++) {
    binary += String.fromCharCode(entropy[i]!);
  }
  return btoa(binary);
}

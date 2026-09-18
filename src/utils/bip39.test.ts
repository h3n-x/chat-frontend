import { describe, it, expect } from 'vitest';
import { entropyToMnemonic, mnemonicToEntropy, base64KeyToMnemonic, mnemonicToBase64Key } from './bip39';

describe('BIP-39 Mnemonic Utility', () => {
  it('converts 32-byte entropy to 24-word mnemonic and recovers exactly the same bytes', async () => {
    const entropy = new Uint8Array(32);
    crypto.getRandomValues(entropy);

    const mnemonic = await entropyToMnemonic(entropy);
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(24);

    const recovered = await mnemonicToEntropy(mnemonic);
    expect(recovered).toEqual(entropy);
  });

  it('converts Base64 key to mnemonic and back to Base64 key', async () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const base64Key = btoa(String.fromCharCode(...bytes));

    const mnemonic = await base64KeyToMnemonic(base64Key);
    const recoveredBase64 = await mnemonicToBase64Key(mnemonic);

    expect(recoveredBase64).toBe(base64Key);
  });

  it('fails if mnemonic contains invalid word', async () => {
    const entropy = new Uint8Array(32);
    crypto.getRandomValues(entropy);
    const mnemonic = await entropyToMnemonic(entropy);
    const words = mnemonic.split(' ');
    words[0] = 'notarealwordxyz';

    await expect(mnemonicToEntropy(words.join(' '))).rejects.toThrow(/Invalid word/);
  });

  it('fails if mnemonic checksum is corrupted', async () => {
    const entropy = new Uint8Array(32);
    crypto.getRandomValues(entropy);
    const mnemonic = await entropyToMnemonic(entropy);
    const words = mnemonic.split(' ');
    // Swap last two words to ruin the checksum
    const tmp = words[22]!;
    words[22] = words[23]!;
    words[23] = tmp;

    await expect(mnemonicToEntropy(words.join(' '))).rejects.toThrow(/Checksum verification failed/);
  });
});

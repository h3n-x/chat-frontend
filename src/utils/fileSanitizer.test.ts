import { describe, it, expect } from 'vitest';
import { generateAnonymousFilename } from './fileSanitizer';

describe('File Sanitizer and Privacy Utilities', () => {
  it('should sanitize identifying image filenames into anonymous identifiers', () => {
    const original = 'IMG_20260918_143022_h3n_pixel8_pro.jpg';
    const anonymized = generateAnonymousFilename(original, 'image/jpeg');

    expect(anonymized).not.toContain('IMG');
    expect(anonymized).not.toContain('h3n');
    expect(anonymized).not.toContain('pixel8');
    expect(anonymized).toMatch(/^foto-anonima-[a-f0-9]{4}\.jpg$/);
  });

  it('should sanitize identifying PDF and document filenames', () => {
    const original = 'Contrato_Confidencial_JuanPerez_123.pdf';
    const anonymized = generateAnonymousFilename(original, 'application/pdf');

    expect(anonymized).not.toContain('JuanPerez');
    expect(anonymized).not.toContain('Contrato');
    expect(anonymized).toMatch(/^archivo-cifrado-[a-f0-9]{4}\.pdf$/);
  });

  it('should fallback to mime type extension when file has no extension', () => {
    const original = 'archivo_sin_extension';
    const anonymized = generateAnonymousFilename(original, 'image/png');

    expect(anonymized).toMatch(/^foto-anonima-[a-f0-9]{4}\.png$/);
  });
});

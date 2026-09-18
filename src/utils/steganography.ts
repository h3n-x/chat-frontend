/**
 * Image LSB (Least Significant Bit) Steganography Utility
 * Embeds encrypted or hidden text payloads into the least significant bit of RGB channels
 * of an image. Always exports as lossless PNG to preserve LSB data across transmission.
 */

const MAGIC_HEADER = new Uint8Array([0x5a, 0x4b, 0x53, 0x54]); // "ZKST"

/**
 * Encodes a text message into an image file using LSB steganography.
 * @param imageFile The carrier image File or Blob
 * @param secretMessage The message to conceal
 * @returns A lossless PNG Blob containing the concealed data
 */
export async function encodeLsbMessage(
  imageFile: File | Blob,
  secretMessage: string
): Promise<Blob> {
  const imageBitmap = await createImageBitmap(imageFile);
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable');
  }

  ctx.drawImage(imageBitmap, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Prepare payload: MAGIC (4 bytes) + LENGTH (4 bytes BigEndian) + UTF-8 BYTES
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(secretMessage);
  const payloadLen = textBytes.length;

  const fullPayload = new Uint8Array(4 + 4 + payloadLen);
  fullPayload.set(MAGIC_HEADER, 0);

  // 32-bit length Big Endian
  fullPayload[4] = (payloadLen >>> 24) & 0xff;
  fullPayload[5] = (payloadLen >>> 16) & 0xff;
  fullPayload[6] = (payloadLen >>> 8) & 0xff;
  fullPayload[7] = payloadLen & 0xff;
  fullPayload.set(textBytes, 8);

  const totalBitsNeeded = fullPayload.length * 8;
  const totalColorChannels = canvas.width * canvas.height * 3; // R, G, B per pixel

  if (totalBitsNeeded > totalColorChannels) {
    throw new Error(
      `Capacidad insuficiente: La imagen puede almacenar hasta ${Math.floor(
        (totalColorChannels - 64) / 8
      )} bytes, pero el mensaje requiere ${payloadLen} bytes.`
    );
  }

  // Embed bits into R, G, B channels
  let bitIndex = 0;
  for (let i = 0; i < data.length && bitIndex < totalBitsNeeded; i += 4) {
    // Channel R
    if (bitIndex < totalBitsNeeded) {
      const byteIdx = Math.floor(bitIndex / 8);
      const bitOffset = 7 - (bitIndex % 8);
      const bit = (fullPayload[byteIdx]! >>> bitOffset) & 1;
      data[i] = (data[i]! & 0xfe) | bit;
      bitIndex++;
    }

    // Channel G
    if (bitIndex < totalBitsNeeded) {
      const byteIdx = Math.floor(bitIndex / 8);
      const bitOffset = 7 - (bitIndex % 8);
      const bit = (fullPayload[byteIdx]! >>> bitOffset) & 1;
      data[i + 1] = (data[i + 1]! & 0xfe) | bit;
      bitIndex++;
    }

    // Channel B
    if (bitIndex < totalBitsNeeded) {
      const byteIdx = Math.floor(bitIndex / 8);
      const bitOffset = 7 - (bitIndex % 8);
      const bit = (fullPayload[byteIdx]! >>> bitOffset) & 1;
      data[i + 2] = (data[i + 2]! & 0xfe) | bit;
      bitIndex++;
    }
    // data[i+3] is Alpha -> remain untouched
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Error al serializar imagen esteganográfica PNG'));
    }, 'image/png');
  });
}

/**
 * Extracts and decodes a hidden LSB message from an image Blob/File.
 * Returns null if the image does not contain the ZKST steganographic signature.
 */
export async function decodeLsbMessage(imageFile: File | Blob): Promise<string | null> {
  try {
    const imageBitmap = await createImageBitmap(imageFile);
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(imageBitmap, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Helper to extract N bytes
    const extractBytes = (startBit: number, numBytes: number): Uint8Array => {
      const bytes = new Uint8Array(numBytes);
      let currentBit = startBit;
      for (let b = 0; b < numBytes; b++) {
        let val = 0;
        for (let bit = 0; bit < 8; bit++) {
          const pixelIndex = Math.floor(currentBit / 3);
          const channelOffset = currentBit % 3; // 0=R, 1=G, 2=B
          const dataIdx = pixelIndex * 4 + channelOffset;
          if (dataIdx >= data.length) return bytes;
          const bitVal = data[dataIdx]! & 1;
          val = (val << 1) | bitVal;
          currentBit++;
        }
        bytes[b] = val;
      }
      return bytes;
    };

    // 1. Check Magic Header (4 bytes = 32 bits)
    const headerBytes = extractBytes(0, 4);
    for (let i = 0; i < 4; i++) {
      if (headerBytes[i] !== MAGIC_HEADER[i]) {
        return null; // Not a steganographic image
      }
    }

    // 2. Read length (4 bytes = 32 bits, starting at bit 32)
    const lengthBytes = extractBytes(32, 4);
    const payloadLen =
      ((lengthBytes[0]! << 24) |
        (lengthBytes[1]! << 16) |
        (lengthBytes[2]! << 8) |
        lengthBytes[3]!) >>>
      0;

    // Guard against corrupted or impossibly large length
    const maxPossibleBytes = Math.floor((canvas.width * canvas.height * 3 - 64) / 8);
    if (payloadLen <= 0 || payloadLen > maxPossibleBytes) {
      return null;
    }

    // 3. Read payload bytes (starting at bit 64)
    const payloadBytes = extractBytes(64, payloadLen);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(payloadBytes);
  } catch (err) {
    console.warn('Failed to decode steganography:', err);
    return null;
  }
}

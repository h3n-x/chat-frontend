/**
 * Fallback de cifrado simple cuando Web Crypto API no está disponible
 * NOTA: Este no es cifrado real, solo ofuscación para desarrollo/demo
 */

// Función simple de codificación Base64 mejorada
export const simpleEncode = (text: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(text)))
  } catch (e) {
    return text
  }
}

// Función simple de decodificación Base64 mejorada
export const simpleDecode = (encoded: string): string => {
  try {
    return decodeURIComponent(escape(atob(encoded)))
  } catch (e) {
    return encoded
  }
}

// Cifrado XOR simple (para desarrollo cuando Web Crypto no está disponible)
export const simpleXORCipher = (text: string, key: string): string => {
  if (!text || !key) return text
  
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result += String.fromCharCode(charCode)
  }
  return simpleEncode(result)
}

// Descifrado XOR simple
export const simpleXORDecipher = (encoded: string, key: string): string => {
  if (!encoded || !key) return encoded
  
  try {
    const decoded = simpleDecode(encoded)
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  } catch (e) {
    return encoded
  }
}

// Generar clave simple para fallback
export const generateSimpleKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

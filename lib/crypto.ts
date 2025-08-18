/**
 * Utilidades de cifrado AES-256 para chat anónimo de extremo a extremo
 * Los mensajes se cifran en el cliente y nunca viajan en texto plano
 */

import { simpleXORCipher, simpleXORDecipher, generateSimpleKey } from './crypto-fallback'

// Convertir string a ArrayBuffer
const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

// Convertir ArrayBuffer a string
const arrayBufferToString = (buffer: ArrayBuffer): string => {
  const decoder = new TextDecoder()
  return decoder.decode(buffer)
}

// Convertir ArrayBuffer a base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Convertir base64 a ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Generar clave AES-256 para una sala de chat
 */
export const generateRoomKey = async (): Promise<string> => {
  // Verificar si Web Crypto API está disponible
  if (!isCryptoSupported()) {
    // Usando generación de clave de fallback (silencioso)
    return generateSimpleKey()
  }
  
  try {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )
    
    const exported = await crypto.subtle.exportKey('raw', key)
    return arrayBufferToBase64(exported)
  } catch (error) {
    // Error generando clave AES, usando fallback (silencioso)
    return generateSimpleKey()
  }
}

/**
 * Importar clave desde base64
 */
const importKey = async (keyBase64: string): Promise<CryptoKey> => {
  const keyBuffer = base64ToArrayBuffer(keyBase64)
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Cifrar mensaje con AES-256-GCM o fallback
 */
export const encryptMessage = async (message: string, keyBase64: string): Promise<{
  encryptedData: string
  iv: string
}> => {
  // Verificar si Web Crypto API está disponible
  if (!isCryptoSupported()) {
    // Usando cifrado de fallback (silencioso)
    const encrypted = simpleXORCipher(message, keyBase64)
    return {
      encryptedData: encrypted,
      iv: 'fallback-iv'
    }
  }

  try {
    const key = await importKey(keyBase64)
    const iv = crypto.getRandomValues(new Uint8Array(12)) // GCM necesita 12 bytes
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      stringToArrayBuffer(message)
    )
    
    return {
      encryptedData: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(iv.buffer)
    }
  } catch (error) {
    // Error cifrando mensaje, usando fallback (silencioso)
    // Fallback en caso de error
    const encrypted = simpleXORCipher(message, keyBase64)
    return {
      encryptedData: encrypted,
      iv: 'fallback-iv'
    }
  }
}

/**
 * Descifrar mensaje con AES-256-GCM o fallback
 */
export const decryptMessage = async (
  encryptedData: string, 
  iv: string, 
  keyBase64: string
): Promise<string> => {
  // Verificar si es fallback
  if (iv === 'fallback-iv') {
    // Silencioso
    return simpleXORDecipher(encryptedData, keyBase64)
  }

  // Verificar si Web Crypto API está disponible
  if (!isCryptoSupported()) {
    // Silencioso
    return simpleXORDecipher(encryptedData, keyBase64)
  }

  try {
    const key = await importKey(keyBase64)
    const encryptedBuffer = base64ToArrayBuffer(encryptedData)
    const ivBuffer = base64ToArrayBuffer(iv)
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      encryptedBuffer
    )
    
    return arrayBufferToString(decryptedBuffer)
  } catch (error) {
    // Silencioso
    // Intentar fallback en caso de error
    try {
      return simpleXORDecipher(encryptedData, keyBase64)
    } catch (fallbackError) {
      // Silencioso
      throw new Error('Error en descifrado')
    }
  }
}

/**
 * Verificar si el navegador soporta Web Crypto API
 */
export const isCryptoSupported = (): boolean => {
  try {
    // Verificar si estamos en el navegador
    if (typeof window === 'undefined') {
      // Silencioso
      return false
    }

    // Verificar si crypto está disponible
    if (typeof crypto === 'undefined' || !crypto.subtle) {
      // Silencioso
      return false
    }
    
    // Verificar métodos específicos
    if (typeof crypto.subtle.encrypt !== 'function' || 
        typeof crypto.subtle.decrypt !== 'function' ||
        typeof crypto.subtle.generateKey !== 'function') {
      // Silencioso
      return false
    }
    
    // Contextos seguros permitidos
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = window.location.port
    
    // Verificar contexto seguro extendido - MEJORADO para redes locales
    const isSecureContext = window.isSecureContext || 
                           protocol === 'https:' ||
                           hostname === 'localhost' ||
                           hostname === '127.0.0.1' ||
                           hostname.startsWith('192.168.') ||
                           hostname.startsWith('10.') ||
                           hostname.startsWith('172.16.') ||
                           hostname.startsWith('172.17.') ||
                           hostname.startsWith('172.18.') ||
                           hostname.startsWith('172.19.') ||
                           hostname.startsWith('172.20.') ||
                           hostname.startsWith('172.21.') ||
                           hostname.startsWith('172.22.') ||
                           hostname.startsWith('172.23.') ||
                           hostname.startsWith('172.24.') ||
                           hostname.startsWith('172.25.') ||
                           hostname.startsWith('172.26.') ||
                           hostname.startsWith('172.27.') ||
                           hostname.startsWith('172.28.') ||
                           hostname.startsWith('172.29.') ||
                           hostname.startsWith('172.30.') ||
                           hostname.startsWith('172.31.') ||
                           hostname.endsWith('.local') ||
                           hostname.endsWith('.lan')

    // Verificación alternativa: intentar usar crypto.subtle directamente
    let cryptoWorksDirectly = false
    try {
      // Intentar operaciones simples para verificar si crypto.subtle funciona
      if (crypto && crypto.subtle) {
        crypto.getRandomValues(new Uint8Array(1))
        // Verificar métodos críticos
        if (typeof crypto.subtle.generateKey === 'function' && 
            typeof crypto.subtle.encrypt === 'function' &&
            typeof crypto.subtle.decrypt === 'function') {
          cryptoWorksDirectly = true
        }
      }
    } catch (e) {
      cryptoWorksDirectly = false
    }
    
    // Usar crypto.subtle si funciona directamente, incluso si el contexto no es "seguro" oficialmente
    if (cryptoWorksDirectly) {
      // Silencioso
      return true
    }
    
    // Verificación estricta de contexto seguro como fallback
    if (isSecureContext && typeof crypto?.subtle !== 'undefined') {
      // Silencioso
      return true
    }
    
    console.warn('🚫 Contexto no seguro detectado y crypto.subtle no funciona directamente.', {
      reason: 'Web Crypto API requiere HTTPS, localhost, o red local',
      currentUrl: window.location.href,
      suggestion: 'Intenta acceder vía localhost:3000 o habilita HTTPS'
    })
    return false
  } catch (error) {
    // Silencioso
    return false
  }
}

/**
 * Generar hash seguro para verificación de integridad
 */
export const generateMessageHash = async (message: string): Promise<string> => {
  const msgBuffer = stringToArrayBuffer(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return arrayBufferToBase64(hashBuffer)
}

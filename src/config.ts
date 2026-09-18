const isProduction = import.meta.env.PROD;

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (isProduction ? 'https://chat-backend-haeb.onrender.com' : 'http://localhost:8000');

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  (API_BASE_URL.startsWith('https://')
    ? API_BASE_URL.replace('https://', 'wss://')
    : API_BASE_URL.replace('http://', 'ws://'));

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_MESSAGE_LENGTH = 2000;

/**
 * Blind Notification & Tab Privacy Title Utility
 * Emits zero-metadata alerts when the browser tab is blurred or hidden.
 */

let unreadCount = 0;
let titleFlashInterval: number | null = null;
const ORIGINAL_TITLE = 'Chat Anónimo v2.0 | Zero-Knowledge Relay';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function notifyNewEncryptedMessage(): void {
  if (typeof document === 'undefined') return;

  // Only trigger if tab is currently in background
  if (document.hidden) {
    unreadCount += 1;
    startTitleBlink();

    // OS-level Blind Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Chat Blindado', {
          body: '🔒 Señal cifrada recibida (contenido protegido)',
          icon: '/favicon.ico',
          tag: 'zk-chat-msg',
          silent: false,
        });
      } catch (err) {
        console.warn('Notification trigger error:', err);
      }
    }
  }
}

function startTitleBlink(): void {
  if (titleFlashInterval !== null) return;

  let isAlert = true;
  titleFlashInterval = window.setInterval(() => {
    if (document.hidden) {
      document.title = isAlert ? `(${unreadCount}) 🔒 Mensaje cifrado` : ORIGINAL_TITLE;
      isAlert = !isAlert;
    } else {
      clearUnreadAlerts();
    }
  }, 1200);
}

export function clearUnreadAlerts(): void {
  unreadCount = 0;
  if (titleFlashInterval !== null) {
    window.clearInterval(titleFlashInterval);
    titleFlashInterval = null;
  }
  if (typeof document !== 'undefined') {
    document.title = ORIGINAL_TITLE;
  }
}

// Global listener to auto-clear alerts when tab returns to foreground
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      clearUnreadAlerts();
    }
  });
  window.addEventListener('focus', () => {
    clearUnreadAlerts();
  });
}

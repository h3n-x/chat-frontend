/**
 * Secure Clipboard Utility with Auto-Scrubbing
 * Overwrites clipboard with empty contents after a timeout to prevent
 * OS clipboard managers from storing keys, tokens, or sensitive chat text.
 */

let activeScrubTimer: number | null = null;

export type ClipboardScrubCallback = (remainingSec: number) => void;

/**
 * Checks whether an automatic clipboard wipe is scheduled.
 */
export function isClipboardScrubPending(): boolean {
  return activeScrubTimer !== null;
}

/**
 * Copies text to the OS clipboard and schedules an automatic wipe.
 * @param text The text to copy
 * @param timeoutSec Time in seconds before the clipboard is overwritten (default 30s)
 */
export async function copyWithAutoScrub(
  text: string,
  timeoutSec: number = 30
): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } else {
      await navigator.clipboard.writeText(text);
    }

    if (activeScrubTimer !== null) {
      window.clearTimeout(activeScrubTimer);
    }

    activeScrubTimer = window.setTimeout(async () => {
      try {
        // Attempt to clear the clipboard
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText('');
        }
      } catch (err) {
        console.warn('Auto-scrub clipboard clear error:', err);
      } finally {
        activeScrubTimer = null;
      }
    }, timeoutSec * 1000);

    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Immediately scrubs the clipboard if sensitive data was previously copied.
 */
export async function forceScrubClipboard(): Promise<void> {
  if (activeScrubTimer !== null) {
    window.clearTimeout(activeScrubTimer);
    activeScrubTimer = null;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText('');
    }
  } catch {}
}

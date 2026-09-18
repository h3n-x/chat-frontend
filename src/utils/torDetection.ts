/**
 * Tor & Onion Network Detection and Custom Relay Routing Utility
 */

export interface NetworkPrivacyProfile {
  isOnionHost: boolean;
  isTorLikely: boolean;
  activeRelayUrl: string;
  isCustomRelay: boolean;
}

const CUSTOM_RELAY_STORAGE_KEY = 'chat_zk_custom_relay_endpoint';

export function getCustomRelayUrl(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(CUSTOM_RELAY_STORAGE_KEY);
}

export function setCustomRelayUrl(url: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem(CUSTOM_RELAY_STORAGE_KEY);
  } else {
    localStorage.setItem(CUSTOM_RELAY_STORAGE_KEY, url.trim());
  }
}

/**
 * Heuristics to detect whether the user is browsing via Tor Browser or Onion routing
 */
export function detectNetworkPrivacy(): NetworkPrivacyProfile {
  const isOnionHost =
    typeof window !== 'undefined' && window.location.hostname.endsWith('.onion');

  // Heuristic signals typical of Tor Browser (letterboxing, zero plugins, fixed hardware concurrency)
  let torScore = 0;

  if (typeof window !== 'undefined') {
    if (isOnionHost) torScore += 5;

    // Tor Browser reports 0 plugins and mimeTypes
    if (navigator.plugins && navigator.plugins.length === 0) {
      torScore += 1;
    }

    // Tor Browser standardizes hardwareConcurrency to 2 or 4
    if (navigator.hardwareConcurrency === 2 || navigator.hardwareConcurrency === 4) {
      torScore += 1;
    }

    // Tor Browser letterboxing (viewport multiples of 200x100)
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w % 200 === 0 && h % 100 === 0) {
      torScore += 2;
    }
  }

  const customRelay = getCustomRelayUrl();

  return {
    isOnionHost,
    isTorLikely: torScore >= 3 || isOnionHost,
    activeRelayUrl: customRelay || '',
    isCustomRelay: !!customRelay,
  };
}

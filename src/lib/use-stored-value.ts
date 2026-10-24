"use client";

import { useSyncExternalStore } from "react";

const EVENT = "fr:storage";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/**
 * localStorage değerini hidrasyon uyumsuzluğu olmadan okur. Sunucuda ve ilk hidrasyonda
 * `undefined` döner; tarayıcıda değer (yoksa null). Erişim engelliyse null.
 */
export function useStoredValue(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

export function writeStoredValue(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

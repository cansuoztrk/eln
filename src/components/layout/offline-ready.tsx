"use client";

import { useEffect } from "react";

/** Registers the small service worker that shows a calm page when the network is gone. */
export function OfflineReady() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Without it the site simply behaves like any other page when offline.
    });
  }, []);
  return null;
}

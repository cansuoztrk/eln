"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GIFT_SEEN_KEY } from "@/features/gift/constants";

/**
 * On a device that has never been through the gift, Eln is taken to it first.
 * The check lives entirely in her browser; nothing about it reaches the server.
 */
export function FirstVisit() {
  const router = useRouter();
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(GIFT_SEEN_KEY)) router.replace("/gift");
    } catch {
      // Storage unavailable: stay on the home page rather than loop.
    }
  }, [router]);
  return null;
}

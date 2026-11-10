"use client";

import { useEffect } from "react";

/**
 * Puts the person's chosen accent on the document itself, so dialogs and
 * menus (which render outside the page's own wrapper) wear it too.
 */
export function ThemeApplier({ theme }: { theme: string }) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "blush") delete root.dataset.theme;
    else root.dataset.theme = theme;
    return () => {
      delete root.dataset.theme;
    };
  }, [theme]);
  return null;
}

"use client";

import { useStoredValue, writeStoredValue } from "@/lib/use-stored-value";
import { Icon } from "../icons";

type Mode = "system" | "light" | "dark";
const KEY = "fr:theme";

/** Tema: sistem → açık → koyu. İlk boyamadan önce <head> içindeki betik uygular (yanıp sönme olmaz). */
export function ThemeToggle() {
  const saved = useStoredValue(KEY);
  const mode: Mode = saved === "light" || saved === "dark" ? saved : "system";
  function apply(next: Mode) {
    writeStoredValue(KEY, next === "system" ? null : next);
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
  }
  const next: Mode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
  const label = mode === "system" ? "Tema: sistem" : mode === "light" ? "Tema: açık" : "Tema: koyu";
  return (
    <button
      type="button"
      onClick={() => apply(next)}
      className="grid size-9 place-items-center rounded-md text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      aria-label={`${label}. Değiştirmek için tıklayın.`}
      title={label}
    >
      <Icon name={mode === "system" ? "monitorTheme" : mode === "light" ? "sun" : "moon"} className="size-[18px]" />
    </button>
  );
}

export const themeScript = `(()=>{try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})()`;

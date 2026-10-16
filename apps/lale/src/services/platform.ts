import { Capacitor } from '@capacitor/core';
import { store } from '../meta/state';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'select';

export async function haptic(kind: HapticKind): Promise<void> {
  if (!store.data.settings.haptics) return;
  try {
    if (isNative) {
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
      if (kind === 'success') await Haptics.notification({ type: NotificationType.Success });
      else if (kind === 'warning') await Haptics.notification({ type: NotificationType.Warning });
      else if (kind === 'select') await Haptics.selectionChanged();
      else await Haptics.impact({ style: kind === 'heavy' ? ImpactStyle.Heavy : kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
    } else if ('vibrate' in navigator) {
      const ms = { light: 8, select: 5, medium: 16, heavy: 30, success: [10, 40, 20], warning: [30, 50, 30] }[kind];
      navigator.vibrate(ms as number | number[]);
    }
  } catch {
    /* best-effort */
  }
}

/**
 * Privacy-first analytics facade: Lale ships WITHOUT any analytics SDK (many
 * users are minors). Events only go to the dev console; if aggregate,
 * non-identifying analytics are ever added, wire them here.
 */
export function track(event: string, params: Record<string, string | number | boolean> = {}): void {
  if (import.meta.env.DEV) console.debug('[track]', event, params);
}

export async function onAppState(cb: (active: boolean) => void): Promise<void> {
  if (isNative) {
    const { App } = await import('@capacitor/app');
    await App.addListener('appStateChange', ({ isActive }) => cb(isActive));
  } else {
    document.addEventListener('visibilitychange', () => cb(!document.hidden));
  }
}

export async function onBackButton(cb: () => void): Promise<void> {
  if (platform !== 'android') return;
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', cb);
}

export async function setStatusBar(dark: boolean): Promise<void> {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    if (platform === 'android') await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    /* ignore */
  }
}

export async function hideSplash(): Promise<void> {
  if (!isNative) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {
    /* ignore */
  }
}

/** Keeps the screen on during a focus session (Screen Wake Lock API, supported by modern WebViews). */
let lock: { release: () => Promise<void> } | null = null;
export async function keepAwake(on: boolean): Promise<void> {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    if (on && store.data.settings.awake && wl && !lock) lock = await wl.request('screen');
    if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    lock = null;
  }
}

import { Capacitor } from '@capacitor/core';
import { store } from '../meta/state';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

// ───────────── haptics ─────────────

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
    } else if ('vibrate' in navigator && (navigator.userActivation?.hasBeenActive ?? true)) {
      // Browsers refuse (and log) vibration before the first user gesture, e.g. a lose dialog on a resumed run.
      const ms = { light: 8, select: 5, medium: 16, heavy: 30, success: [10, 40, 20], warning: [30, 50, 30] }[kind];
      navigator.vibrate(ms as number | number[]);
    }
  } catch {
    /* haptics are best-effort */
  }
}

// ───────────── analytics ─────────────

/**
 * Thin analytics facade. Events are named after the funnel steps we optimise
 * (tutorial, level start/win/fail, ad shown, purchase). Wire to Firebase
 * Analytics / GameAnalytics in production; in dev they go to the console.
 */
export function track(event: string, params: Record<string, string | number | boolean> = {}): void {
  if (import.meta.env.DEV) console.debug('[track]', event, params);
}

// ───────────── app lifecycle ─────────────

export async function onAppState(cb: (active: boolean) => void): Promise<void> {
  document.addEventListener('visibilitychange', () => cb(!document.hidden));
  if (isNative) {
    const { App } = await import('@capacitor/app');
    await App.addListener('appStateChange', ({ isActive }) => cb(isActive));
  }
}

export async function onBackButton(cb: () => void): Promise<void> {
  if (platform !== 'android') return;
  const { App } = await import('@capacitor/app');
  await App.addListener('backButton', cb);
}

export async function setupStatusBar(): Promise<void> {
  if (!isNative) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
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

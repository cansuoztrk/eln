import '@fontsource/baloo-2/500.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import './styles.css';
import { setLang } from './i18n';
import { game } from './meta/game';
import { store } from './meta/state';
import { audio } from './services/audio';
import { iap } from './services/iap';
import { hideSplash, setupStatusBar } from './services/platform';
import { App } from './ui/app';
import { fx } from './ui/fx';

/** Tablets: scale the UI up so it does not look like a phone app floating in space. */
function applyUiZoom(): void {
  const z = Math.max(1, Math.min(1.6, Math.min(window.innerWidth / 440, window.innerHeight / 900)));
  document.documentElement.style.setProperty('--z', z.toFixed(3));
}

async function boot(): Promise<void> {
  applyUiZoom();
  window.addEventListener('resize', applyUiZoom);
  await store.load();
  setLang(store.data.settings.lang);
  audio.setSfx(store.data.settings.sound);
  audio.setMusic(store.data.settings.music);
  void setupStatusBar();
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
  } catch {
    /* ignore */
  }
  fx.attach(document.getElementById('fx') as HTMLCanvasElement);
  const app = new App(document.getElementById('ui')!);
  if (location.search.includes('e2e')) (window as unknown as Record<string, unknown>).__simit = { app, game, store, debug: () => app.debug() };
  app.start();
  void iap.init(game).then(() => app.refresh());
  // Audio can only start after a user gesture.
  const unlock = () => {
    audio.unlock();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  document.getElementById('boot')?.remove();
  void hideSplash();
}

void boot();

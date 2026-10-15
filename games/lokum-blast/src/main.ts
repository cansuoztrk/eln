import '@fontsource/baloo-2/500.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import './styles.css';
import { setLang } from './i18n';
import { store } from './meta/state';
import { audio } from './services/audio';
import { iap } from './services/iap';
import { hideSplash, setupStatusBar } from './services/platform';
import { App } from './ui/app';

/** Tablets: scale the DOM UI up so it does not look like a phone app floating in space. */
function applyUiZoom(): void {
  const z = Math.max(1, Math.min(1.7, Math.min(window.innerWidth / 440, window.innerHeight / 900)));
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
  // Fonts must be ready before canvas text (banners, score pops) is drawn.
  try {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
  } catch {
    /* ignore */
  }
  const app = new App(document.getElementById('ui')!);
  if (location.search.includes('e2e')) {
    const { bestMove } = await import('./core/bot');
    const { SHAPE_BY_ID, makePiece } = await import('./core/pieces');
    (window as unknown as Record<string, unknown>).__lokum = { app, store, bestMove, setLang, SHAPE_BY_ID, makePiece };
  }
  app.start();
  void iap.init().then(() => app.refresh());
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

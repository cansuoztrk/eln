import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/800.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/900.css';
import './styles.css';
import './ui/screens.css';
import { setLang } from './i18n';
import { store } from './meta/state';
import { ads } from './services/ads';
import { audio } from './services/audio';
import { iap } from './services/iap';
import { hideSplash, setupStatusBar } from './services/platform';
import { App } from './ui/app';
import { confirmDialog } from './ui/modal';
import { t, tk } from './i18n';
import { fallbackPrice } from './meta/catalog';
import { currentLang } from './i18n';

async function boot(): Promise<void> {
  await store.load();
  setLang(store.data.settings.lang);
  audio.setSfx(store.data.settings.sound);
  audio.setMusic(store.data.settings.music);
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock, { passive: true });
  iap.demoConfirm = (p) => confirmDialog(tk(`product.${p.id}`, p.id), `${t('shop.demoQ')}\n\n${fallbackPrice(p, currentLang())}`, t('common.buy'), t('common.cancel'));
  const app = new App();
  app.start();
  if (new URLSearchParams(location.search).has('e2e')) (window as unknown as { __bookcat: unknown }).__bookcat = app.debug();
  document.getElementById('boot')?.classList.add('hide');
  setTimeout(() => document.getElementById('boot')?.remove(), 400);
  void setupStatusBar();
  void hideSplash();
  void ads.init();
  void iap.init();
}

void boot();

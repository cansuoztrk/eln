import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './styles.css';
import './ui/screens.css';
import { setLang } from './i18n';
import { store } from './meta/state';
import { App } from './ui/app';

async function boot(): Promise<void> {
  await store.load();
  setLang(store.data.settings.lang);
  await new App().start();
}

void boot();

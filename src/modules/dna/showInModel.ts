import { useView } from '@/core/store/viewStore';
import { VIEWS } from '@/world/camera/views';
import { worldApi } from '@/world/worldApi';
import { PARAM_GUIDE } from './paramGuide';

/** Frames the part of the model a parameter changes; lighting choices switch a daytime view to night. */
export function showInModel(key: string) {
  const g = PARAM_GUIDE[key];
  if (!g) return;
  const v = useView.getState();
  if (g.night && v.env === 'day') {
    v.set({ env: 'night' });
    v.toast('Işık seçimleri karanlıkta okunur: gece görünümüne geçildi.', 'info');
  }
  worldApi.flyTo(VIEWS[g.view], { mode: 'explorer' });
}

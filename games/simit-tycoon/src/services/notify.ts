import { t } from '../i18n';
import { offlineCapHours } from '../meta/game';
import { store } from '../meta/state';
import { isNative } from './platform';

/**
 * Local re-engagement notifications (no server needed). Rescheduled every
 * time the app goes to the background, so they always match the state.
 *   1  the till is full (offline cap reached) — the strongest idle hook
 *   2  daily reward / streak (tomorrow 19:00)
 *   3  win-back after 3 days
 *   4  win-back after 7 days
 */
const IDS = [1, 2, 3, 4];

async function plugin() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

/** Ask at a happy moment (first cat manager hired), never at launch. */
export async function requestNotifications(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const ln = await plugin();
    return (await ln.requestPermissions()).display === 'granted';
  } catch {
    return false;
  }
}

function atLocal(daysAhead: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function rescheduleNotifications(): Promise<void> {
  if (!isNative || !store.data.settings.notifications) return;
  try {
    const ln = await plugin();
    if ((await ln.checkPermissions()).display !== 'granted') return;
    await ln.cancel({ notifications: IDS.map((id) => ({ id })) });
    type N = { id: number; title: string; body: string; schedule: { at: Date; allowWhileIdle: boolean }; isExactNotification: boolean };
    // Reminders do not need exact alarms (they would require the Android
    // "Alarms & reminders" permission screen).
    const n = (id: number, title: string, body: string, at: Date): N => ({ id, title, body, schedule: { at, allowWhileIdle: true }, isExactNotification: false });
    const list: N[] = [];
    const d = store.data;
    if (d.run.managers.some(Boolean)) {
      const capH = offlineCapHours();
      list.push(n(1, t('notif.full.title'), t('notif.full.body', { h: capH }), new Date(Date.now() + capH * 3_600_000)));
    }
    const streak = d.login.streak;
    list.push(n(2, t('notif.daily.title'), streak >= 2 ? t('notif.streak.body', { n: streak }) : t('notif.daily.body'), atLocal(1, 19)));
    list.push(n(3, t('notif.miss.title'), t('notif.miss.body'), atLocal(3, 19, 30)));
    list.push(n(4, t('notif.miss2.title'), t('notif.miss2.body'), atLocal(7, 19, 30)));
    await ln.schedule({ notifications: list });
  } catch (e) {
    console.warn('notifications', e);
  }
}

export async function cancelNotifications(): Promise<void> {
  if (!isNative) return;
  try {
    const ln = await plugin();
    await ln.cancel({ notifications: IDS.map((id) => ({ id })) });
  } catch {
    /* ignore */
  }
}

import { t } from '../i18n';
import { todayKey } from '../meta/daily';
import { store } from '../meta/state';
import { isNative } from './platform';

/**
 * Local re-engagement notifications (no server needed). Rescheduled every
 * time the app goes to background, so they always reflect the current state.
 *   1  Daily Shelf ready (tomorrow 09:30), or today 19:00 if it is still open
 *   2  streak reminder (tomorrow 19:30, only with a streak of 2+)
 *   3  win-back after 3 days
 *   4  win-back after 7 days
 */
const IDS = [1, 2, 3, 4];

async function plugin() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

export async function notificationsAllowed(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const ln = await plugin();
    return (await ln.checkPermissions()).display === 'granted';
  } catch {
    return false;
  }
}

/** Ask at a happy moment (after the first level win), never at launch. */
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
    const list: Array<{ id: number; title: string; body: string; schedule: { at: Date; allowWhileIdle: boolean }; isExactNotification: boolean }> = [];
    const n = (id: number, title: string, body: string, at: Date) => ({ id, title, body, schedule: { at, allowWhileIdle: true }, isExactNotification: false });
    const d = store.data;
    const doneToday = d.daily.last === todayKey();
    const evening = atLocal(0, 19);
    // Reminders do not need exact alarms; exact ones would open the Android
    // "Alarms & reminders" settings screen.
    list.push(!doneToday && evening.getTime() > Date.now() + 30 * 60_000 ? n(1, t('notif.daily.title'), t('notif.daily.body'), evening) : n(1, t('notif.daily.title'), t('notif.daily.body'), atLocal(1, 9, 30)));
    if (d.daily.streak >= 2) list.push(n(2, t('notif.streak.title', { n: d.daily.streak }), t('notif.streak.body'), atLocal(1, 19, 30)));
    list.push(n(3, t('notif.miss.title'), t('notif.miss.body'), atLocal(3, 19, 30)));
    list.push(n(4, t('notif.miss.title'), t('notif.miss.body'), atLocal(7, 19, 30)));
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

import { t } from '../i18n';
import { msToFullLives } from '../meta/economy';
import { store } from '../meta/state';
import { isNative } from './platform';

/**
 * Local re-engagement notifications (no server needed). Rescheduled every
 * time the app goes to background, so they always reflect the current state.
 *   1  lives refilled
 *   2  daily gift / streak reminder (tomorrow 19:00)
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
    const full = msToFullLives();
    if (full > 0) {
      list.push({ id: 1, title: t('notif.lives.title'), body: t('notif.lives.body'), schedule: { at: new Date(Date.now() + full), allowWhileIdle: true }, isExactNotification: false });
    }
    const streak = store.data.login.streak;
    list.push({
      id: 2,
      title: t('notif.daily.title'),
      body: streak >= 2 ? t('notif.streak.body', { n: streak }) : t('notif.daily.body'),
      schedule: { at: atLocal(1, 19), allowWhileIdle: true },
      // Reminders do not need exact alarms; exact ones would open the Android
      // "Alarms & reminders" settings screen.
      isExactNotification: false,
    });
    list.push({ id: 3, title: t('notif.miss.title'), body: t('notif.miss.body'), schedule: { at: atLocal(3, 19, 30), allowWhileIdle: true }, isExactNotification: false });
    list.push({ id: 4, title: t('notif.miss2.title'), body: t('notif.miss2.body'), schedule: { at: atLocal(7, 19, 30), allowWhileIdle: true }, isExactNotification: false });
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

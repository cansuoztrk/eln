import { minutesOn } from '../core/records';
import { atRisk, dayKey } from '../core/streak';
import { endsAt, type Running } from '../core/timer';
import { t } from '../i18n';
import { store } from '../meta/state';
import { isNative } from './platform';

/**
 * Local notifications only (no push server):
 *   10  the running countdown finished (scheduled at its end time)
 *   1   daily goal reminder at the chosen time, only if the goal is not met
 *   2   streak at risk at 21:30, only when the streak would break tonight
 * Rescheduled whenever the app goes to the background.
 */
const SESSION_ID = 10;
const DAILY_ID = 1;
const STREAK_ID = 2;
const STRICT_ID = 11;

async function plugin() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

export async function requestNotifications(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const ln = await plugin();
    return (await ln.requestPermissions()).display === 'granted';
  } catch {
    return false;
  }
}

/** Notify when the running countdown ends (the app may be in the background). */
export async function scheduleSessionEnd(r: Running | null): Promise<void> {
  if (!isNative) return;
  try {
    const ln = await plugin();
    await ln.cancel({ notifications: [{ id: SESSION_ID }] });
    const at = r ? endsAt(r) : null;
    if (!r || !at || at <= Date.now() + 2000) return;
    const focus = r.phase === 'focus';
    await ln.schedule({
      notifications: [
        {
          id: SESSION_ID,
          title: t(focus ? 'notif.done.title' : 'notif.break.title'),
          body: t(focus ? 'notif.done.body' : 'notif.break.body'),
          schedule: { at: new Date(at), allowWhileIdle: true },
          smallIcon: 'ic_stat_lale',
        },
      ],
    });
  } catch {
    /* permission missing */
  }
}

function nextAt(hhmm: string, now: Date, offsetDays = 0): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, h, m);
  return d;
}

export async function rescheduleReminders(): Promise<void> {
  if (!isNative) return;
  const d = store.data;
  try {
    const ln = await plugin();
    await ln.cancel({ notifications: [{ id: DAILY_ID }, { id: STREAK_ID }] });
    if (!d.settings.notifications) return;
    const now = new Date();
    const today = dayKey(now);
    const done = minutesOn(d.sessions, today);
    const list = [];
    let daily = nextAt(d.settings.reminder, now);
    if (daily <= now || done >= d.goals.minutes) daily = nextAt(d.settings.reminder, now, 1);
    const left = daily.getDate() === now.getDate() ? Math.max(1, d.goals.minutes - done) : d.goals.minutes;
    list.push({ id: DAILY_ID, title: t('notif.daily.title'), body: t('notif.daily.body', { n: left }), schedule: { at: daily, allowWhileIdle: true }, smallIcon: 'ic_stat_lale' });
    const risk = nextAt('21:30', now);
    if (risk > now && atRisk(d.streak, today)) {
      list.push({ id: STREAK_ID, title: t('notif.streak.title', { n: d.streak.count }), body: t('notif.streak.body'), schedule: { at: risk, allowWhileIdle: true }, smallIcon: 'ic_stat_lale' });
    }
    await ln.schedule({ notifications: list });
  } catch {
    /* ignore */
  }
}

/** Strict mode: a nudge right after leaving the app, before the tulip wilts. */
export async function strictWarning(on: boolean): Promise<void> {
  if (!isNative) return;
  try {
    const ln = await plugin();
    await ln.cancel({ notifications: [{ id: STRICT_ID }] });
    if (!on) return;
    await ln.schedule({ notifications: [{ id: STRICT_ID, title: t('notif.strict.title'), body: t('notif.strict.body'), schedule: { at: new Date(Date.now() + 1500), allowWhileIdle: true }, smallIcon: 'ic_stat_lale' }] });
  } catch {
    /* permission missing */
  }
}

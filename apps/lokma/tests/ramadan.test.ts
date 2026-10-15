import { describe, expect, it } from 'vitest';
import { CITIES, cityById, dayTimes, isFastingHours, nextEvent, ramadanStatus, ramadansStartingIn } from '../src/core/ramadan';

// Diyanet imsakiye for İstanbul, Ramadan 2026 (via NTV): day, imsak, güneş, akşam.
const DIYANET_ISTANBUL: [number, number, string, string, string][] = [
  [1, 19, '06:22', '07:47', '18:49'], [1, 20, '06:20', '07:45', '18:51'], [1, 21, '06:19', '07:44', '18:52'],
  [1, 25, '06:13', '07:38', '18:56'], [2, 1, '06:08', '07:32', '19:01'], [2, 5, '06:01', '07:26', '19:06'],
  [2, 10, '05:53', '07:18', '19:11'], [2, 15, '05:45', '07:09', '19:17'], [2, 19, '05:38', '07:03', '19:21'],
];

const hhmm = (d: Date) => d.toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
const minutes = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

describe('prayer times', () => {
  it('matches Diyanet within one minute, always on the safe side', () => {
    const ist = cityById('istanbul')!;
    for (const [month, d, imsak, sunrise, iftar] of DIYANET_ISTANBUL) {
      const t = dayTimes(ist, new Date(2026, month, d, 12));
      const di = minutes(hhmm(t.imsak)) - minutes(imsak);
      const df = minutes(hhmm(t.iftar)) - minutes(iftar);
      expect(Math.abs(di), `imsak ${d}.${month + 1}`).toBeLessThanOrEqual(1);
      expect(Math.abs(df), `iftar ${d}.${month + 1}`).toBeLessThanOrEqual(1);
      expect(Math.abs(minutes(hhmm(t.sunrise)) - minutes(sunrise))).toBeLessThanOrEqual(1);
      expect(di, 'imsak must never be later than Diyanet').toBeLessThanOrEqual(0);
      expect(df, 'iftar must never be earlier than Diyanet').toBeGreaterThanOrEqual(0);
    }
  });

  it('covers all 81 provinces and diaspora cities with valid times', () => {
    expect(CITIES.filter((c) => c.country === 'TR')).toHaveLength(81);
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length);
    for (const c of CITIES) {
      for (const day of [new Date(2027, 1, 8, 12), new Date(2027, 5, 21, 12)]) {
        const t = dayTimes(c, day);
        expect(t.imsak < t.sunrise && t.sunrise < t.iftar, `${c.id} ${day.toDateString()}`).toBe(true);
      }
    }
  });

  it('finds the next event and fasting hours', () => {
    const ist = cityById('istanbul')!;
    const t = dayTimes(ist, new Date(2026, 1, 20, 12));
    const noon = new Date(t.imsak.getTime() + 6 * 3_600_000);
    expect(isFastingHours(ist, noon)).toBe(true);
    expect(nextEvent(ist, noon).kind).toBe('iftar');
    const night = new Date(t.iftar.getTime() + 2 * 3_600_000);
    expect(isFastingHours(ist, night)).toBe(false);
    expect(nextEvent(ist, night).kind).toBe('imsak');
  });
});

describe('ramadan calendar', () => {
  it('uses Diyanet dates where published', () => {
    expect(ramadansStartingIn(2026)[0]).toEqual({ first: '2026-02-19', last: '2027-03-19'.replace('2027', '2026'), days: 29 });
    expect(ramadansStartingIn(2027)[0]).toMatchObject({ first: '2027-02-08', last: '2027-03-08' });
  });

  it('falls back to the Umm al-Qura calendar', () => {
    expect(ramadansStartingIn(2028)[0]?.first).toBe('2028-01-28');
  });

  it('reports countdowns and day numbers', () => {
    expect(ramadanStatus(new Date(2026, 9, 15, 12))).toMatchObject({ kind: 'before', daysLeft: 116 });
    expect(ramadanStatus(new Date(2027, 1, 10, 12))).toMatchObject({ kind: 'during', day: 3 });
    expect(ramadanStatus(new Date(2027, 2, 9, 12)).kind).toBe('before');
  });
});

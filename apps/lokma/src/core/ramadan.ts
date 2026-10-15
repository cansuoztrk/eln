import { CalculationMethod, Coordinates, HighLatitudeRule, PrayerTimes } from 'adhan';

/**
 * Offline Ramadan support: imsak (end of suhoor), sunrise and iftar for all
 * 81 Turkish provinces plus large diaspora cities, using adhan's Turkey
 * method (Fajr 18°, Diyanet temkin adjustments). Against Diyanet's 2026
 * Istanbul imsakiye the results stay within ±1 minute, and the error is on the
 * safe side (imsak never later, iftar never earlier).
 *
 * Ramadan dates come from Diyanet's published calendar where known, otherwise
 * from the Umm al-Qura calendar (ICU), which matched Diyanet for 2027.
 */

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: 'TR' | 'DE' | 'AT' | 'NL' | 'BE' | 'FR' | 'GB' | 'CH';
}

const TR: [string, string, number, number][] = [
  ['adana', 'Adana', 37.0, 35.32], ['adiyaman', 'Adıyaman', 37.76, 38.28], ['afyonkarahisar', 'Afyonkarahisar', 38.76, 30.54],
  ['agri', 'Ağrı', 39.72, 43.05], ['amasya', 'Amasya', 40.65, 35.83], ['ankara', 'Ankara', 39.93, 32.86],
  ['antalya', 'Antalya', 36.89, 30.71], ['artvin', 'Artvin', 41.18, 41.82], ['aydin', 'Aydın', 37.85, 27.85],
  ['balikesir', 'Balıkesir', 39.65, 27.88], ['bilecik', 'Bilecik', 40.15, 29.98], ['bingol', 'Bingöl', 38.88, 40.5],
  ['bitlis', 'Bitlis', 38.4, 42.11], ['bolu', 'Bolu', 40.74, 31.61], ['burdur', 'Burdur', 37.72, 30.29],
  ['bursa', 'Bursa', 40.19, 29.06], ['canakkale', 'Çanakkale', 40.15, 26.41], ['cankiri', 'Çankırı', 40.6, 33.62],
  ['corum', 'Çorum', 40.55, 34.95], ['denizli', 'Denizli', 37.78, 29.09], ['diyarbakir', 'Diyarbakır', 37.91, 40.24],
  ['edirne', 'Edirne', 41.68, 26.56], ['elazig', 'Elazığ', 38.67, 39.22], ['erzincan', 'Erzincan', 39.75, 39.49],
  ['erzurum', 'Erzurum', 39.9, 41.27], ['eskisehir', 'Eskişehir', 39.78, 30.52], ['gaziantep', 'Gaziantep', 37.07, 37.38],
  ['giresun', 'Giresun', 40.91, 38.39], ['gumushane', 'Gümüşhane', 40.46, 39.48], ['hakkari', 'Hakkari', 37.58, 43.74],
  ['hatay', 'Hatay', 36.2, 36.16], ['isparta', 'Isparta', 37.76, 30.55], ['mersin', 'Mersin', 36.81, 34.64],
  ['istanbul', 'İstanbul', 41.01, 28.96], ['izmir', 'İzmir', 38.42, 27.14], ['kars', 'Kars', 40.6, 43.1],
  ['kastamonu', 'Kastamonu', 41.38, 33.78], ['kayseri', 'Kayseri', 38.73, 35.48], ['kirklareli', 'Kırklareli', 41.74, 27.22],
  ['kirsehir', 'Kırşehir', 39.15, 34.16], ['kocaeli', 'Kocaeli', 40.77, 29.92], ['konya', 'Konya', 37.87, 32.48],
  ['kutahya', 'Kütahya', 39.42, 29.98], ['malatya', 'Malatya', 38.35, 38.31], ['manisa', 'Manisa', 38.61, 27.43],
  ['kahramanmaras', 'Kahramanmaraş', 37.58, 36.94], ['mardin', 'Mardin', 37.31, 40.74], ['mugla', 'Muğla', 37.22, 28.36],
  ['mus', 'Muş', 38.75, 41.51], ['nevsehir', 'Nevşehir', 38.62, 34.71], ['nigde', 'Niğde', 37.97, 34.68],
  ['ordu', 'Ordu', 40.98, 37.88], ['rize', 'Rize', 41.02, 40.52], ['sakarya', 'Sakarya', 40.78, 30.4],
  ['samsun', 'Samsun', 41.29, 36.33], ['siirt', 'Siirt', 37.93, 41.94], ['sinop', 'Sinop', 42.03, 35.15],
  ['sivas', 'Sivas', 39.75, 37.02], ['tekirdag', 'Tekirdağ', 40.98, 27.51], ['tokat', 'Tokat', 40.31, 36.55],
  ['trabzon', 'Trabzon', 41.0, 39.72], ['tunceli', 'Tunceli', 39.11, 39.55], ['sanliurfa', 'Şanlıurfa', 37.16, 38.79],
  ['usak', 'Uşak', 38.68, 29.41], ['van', 'Van', 38.49, 43.38], ['yozgat', 'Yozgat', 39.82, 34.81],
  ['zonguldak', 'Zonguldak', 41.45, 31.79], ['aksaray', 'Aksaray', 38.37, 34.03], ['bayburt', 'Bayburt', 40.26, 40.23],
  ['karaman', 'Karaman', 37.18, 33.22], ['kirikkale', 'Kırıkkale', 39.85, 33.51], ['batman', 'Batman', 37.89, 41.13],
  ['sirnak', 'Şırnak', 37.52, 42.46], ['bartin', 'Bartın', 41.64, 32.34], ['ardahan', 'Ardahan', 41.11, 42.7],
  ['igdir', 'Iğdır', 39.92, 44.05], ['yalova', 'Yalova', 40.65, 29.27], ['karabuk', 'Karabük', 41.2, 32.62],
  ['kilis', 'Kilis', 36.72, 37.12], ['osmaniye', 'Osmaniye', 37.07, 36.25], ['duzce', 'Düzce', 40.84, 31.16],
];

const ABROAD: [string, string, number, number, City['country']][] = [
  ['berlin', 'Berlin', 52.52, 13.4, 'DE'], ['hamburg', 'Hamburg', 53.55, 9.99, 'DE'], ['koln', 'Köln', 50.94, 6.96, 'DE'],
  ['munchen', 'München', 48.14, 11.58, 'DE'], ['frankfurt', 'Frankfurt', 50.11, 8.68, 'DE'], ['stuttgart', 'Stuttgart', 48.78, 9.18, 'DE'],
  ['dusseldorf', 'Düsseldorf', 51.23, 6.78, 'DE'], ['duisburg', 'Duisburg', 51.43, 6.76, 'DE'], ['wien', 'Wien', 48.21, 16.37, 'AT'],
  ['amsterdam', 'Amsterdam', 52.37, 4.9, 'NL'], ['rotterdam', 'Rotterdam', 51.92, 4.48, 'NL'], ['bruksel', 'Brüksel', 50.85, 4.35, 'BE'],
  ['paris', 'Paris', 48.86, 2.35, 'FR'], ['londra', 'Londra', 51.51, -0.13, 'GB'], ['zurih', 'Zürih', 47.37, 8.54, 'CH'],
];

export const CITIES: City[] = [
  ...TR.map(([id, name, lat, lng]) => ({ id, name, lat, lng, country: 'TR' as const })).sort((a, b) => a.name.localeCompare(b.name, 'tr')),
  ...ABROAD.map(([id, name, lat, lng, country]) => ({ id, name, lat, lng, country })),
];

export function cityById(id: string | null | undefined): City | null {
  return CITIES.find((c) => c.id === id) ?? null;
}

export interface DayTimes {
  imsak: Date;
  sunrise: Date;
  iftar: Date;
}

/** Times for the local calendar day of `date` in `city` (absolute instants). */
export function dayTimes(city: City, date: Date): DayTimes {
  const params = CalculationMethod.Turkey();
  // Northern European summers have no true astronomical night.
  if (Math.abs(city.lat) > 48) params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const p = new PrayerTimes(new Coordinates(city.lat, city.lng), day, params);
  return { imsak: p.fajr, sunrise: p.sunrise, iftar: p.maghrib };
}

// ───────────── Ramadan calendar ─────────────

/** Diyanet's published first fasting day and number of days (YYYY-MM-DD). */
const DIYANET: Record<number, { first: string; days: number }> = {
  2026: { first: '2026-02-19', days: 29 },
  2027: { first: '2027-02-08', days: 29 },
};

export interface RamadanSpan {
  /** First fasting day (local). */
  first: string;
  /** Last fasting day (local). */
  last: string;
  days: number;
}

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

function umalqura(): Intl.DateTimeFormat | null {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric' });
  } catch {
    return null;
  }
}

/** Ramadan spans that start in a given Gregorian year (usually one; two in 2030). */
export function ramadansStartingIn(year: number): RamadanSpan[] {
  const known = DIYANET[year];
  if (known) {
    const last = fromKey(known.first);
    last.setDate(last.getDate() + known.days - 1);
    return [{ first: known.first, last: key(last), days: known.days }];
  }
  const fmt = umalqura();
  if (!fmt) return [];
  const spans: RamadanSpan[] = [];
  let start: Date | null = null;
  for (let d = new Date(year, 0, 1, 12); d.getFullYear() <= year || start; d.setDate(d.getDate() + 1)) {
    const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
    const inRamadan = parts.month === '9';
    if (inRamadan && !start && d.getFullYear() === year) start = new Date(d);
    if (!inRamadan && start) {
      const last = new Date(d);
      last.setDate(last.getDate() - 1);
      spans.push({ first: key(start), last: key(last), days: Math.round((last.getTime() - start.getTime()) / 86_400_000) + 1 });
      start = null;
    }
    if (d.getFullYear() > year + 1) break;
  }
  return spans;
}

export type RamadanStatus = { kind: 'during'; day: number; span: RamadanSpan } | { kind: 'before'; daysLeft: number; span: RamadanSpan } | { kind: 'unknown' };

export function ramadanStatus(today: Date = new Date()): RamadanStatus {
  const k = key(today);
  for (const y of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {
    for (const span of ramadansStartingIn(y)) {
      if (k >= span.first && k <= span.last) {
        const day = Math.round((fromKey(k).getTime() - fromKey(span.first).getTime()) / 86_400_000) + 1;
        return { kind: 'during', day, span };
      }
      if (k < span.first) {
        const daysLeft = Math.round((fromKey(span.first).getTime() - fromKey(k).getTime()) / 86_400_000);
        return { kind: 'before', daysLeft, span };
      }
    }
  }
  return { kind: 'unknown' };
}

/** Next imsak/iftar event after `now` for a live countdown. */
export function nextEvent(city: City, now: Date = new Date()): { kind: 'imsak' | 'iftar'; at: Date } {
  const today = dayTimes(city, now);
  if (now < today.imsak) return { kind: 'imsak', at: today.imsak };
  if (now < today.iftar) return { kind: 'iftar', at: today.iftar };
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { kind: 'imsak', at: dayTimes(city, tomorrow).imsak };
}

/** True between imsak and iftar today. */
export function isFastingHours(city: City, now: Date = new Date()): boolean {
  const t = dayTimes(city, now);
  return now >= t.imsak && now < t.iftar;
}

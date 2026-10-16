/**
 * Exam presets: the Turkish central exams Lale is built around, plus a
 * generic profile for everyone else (Abitur, EBAU, finals...).
 *
 * Two levels of detail:
 *  - `tests` are the booklets of the real exam; mock exams (deneme) are
 *    entered per test and nets are computed with the exam's penalty.
 *  - `subjects` are what a student actually studies; focus sessions and
 *    question practice are logged per subject.
 *
 * Question counts follow the ÖSYM/MEB booklet structure in force for 2026.
 * Dates marked `estimated` are unofficial until ÖSYM/MEB publish their
 * calendar; the user can always override them. Lale is not affiliated with
 * ÖSYM or MEB.
 */
export type Lang = 'tr' | 'en' | 'de' | 'es';
export type L10n = Record<Lang, string>;

export type ExamId = 'yks' | 'lgs' | 'kpss' | 'ales' | 'dgs' | 'yds' | 'msu' | 'other';
export type YksField = 'say' | 'ea' | 'soz' | 'dil';

export interface Subject {
  id: string;
  name: L10n;
  /** Hue for charts and chips (0–360). */
  hue: number;
}

export interface Test {
  id: string;
  name: L10n;
  questions: number;
  /** Booklet group, e.g. 'tyt' or 'ayt' (used for mock kinds and countdowns). */
  group: string;
}

export interface MockKind {
  id: string;
  name: L10n;
  tests: string[];
  /** Limit to a YKS field (AYT mocks differ per field). */
  field?: YksField;
}

export interface ExamDate {
  year: number;
  /** Booklet group this session belongs to ('tyt', 'ayt', 'ydt', 'lgs'...). */
  group: string;
  /** Local Istanbul time, ISO without zone. */
  at: string;
  estimated: boolean;
}

export interface Exam {
  id: ExamId;
  name: L10n;
  short: string;
  /** Wrong answers that cancel one right answer (0 = no penalty). */
  penalty: number;
  subjects: Subject[];
  tests: Test[];
  mocks: MockKind[];
  dates: ExamDate[];
}

const l = (tr: string, en: string, de = en, es = en): L10n => ({ tr, en, de, es });

const S = {
  turkce: { id: 'turkce', name: l('Türkçe', 'Turkish', 'Türkisch', 'Turco'), hue: 4 },
  matematik: { id: 'matematik', name: l('Matematik', 'Maths', 'Mathe', 'Matemáticas'), hue: 214 },
  geometri: { id: 'geometri', name: l('Geometri', 'Geometry', 'Geometrie', 'Geometría'), hue: 232 },
  fizik: { id: 'fizik', name: l('Fizik', 'Physics', 'Physik', 'Física'), hue: 262 },
  kimya: { id: 'kimya', name: l('Kimya', 'Chemistry', 'Chemie', 'Química'), hue: 290 },
  biyoloji: { id: 'biyoloji', name: l('Biyoloji', 'Biology', 'Biologie', 'Biología'), hue: 130 },
  fen: { id: 'fen', name: l('Fen Bilimleri', 'Science', 'Naturwissenschaften', 'Ciencias'), hue: 150 },
  edebiyat: { id: 'edebiyat', name: l('Edebiyat', 'Literature', 'Literatur', 'Literatura'), hue: 340 },
  tarih: { id: 'tarih', name: l('Tarih', 'History', 'Geschichte', 'Historia'), hue: 28 },
  inkilap: { id: 'inkilap', name: l('İnkılap Tarihi', 'Revolution History', 'Revolutionsgeschichte', 'Historia de la Revolución'), hue: 22 },
  cografya: { id: 'cografya', name: l('Coğrafya', 'Geography', 'Erdkunde', 'Geografía'), hue: 175 },
  felsefe: { id: 'felsefe', name: l('Felsefe', 'Philosophy', 'Philosophie', 'Filosofía'), hue: 48 },
  din: { id: 'din', name: l('Din Kültürü', 'Religious Culture', 'Religionskultur', 'Cultura religiosa'), hue: 64 },
  dil: { id: 'dil', name: l('Yabancı Dil', 'Foreign Language', 'Fremdsprache', 'Idioma extranjero'), hue: 196 },
  vatandaslik: { id: 'vatandaslik', name: l('Vatandaşlık', 'Civics', 'Staatsbürgerkunde', 'Educación cívica'), hue: 356 },
  guncel: { id: 'guncel', name: l('Güncel Bilgiler', 'Current Affairs', 'Aktuelles', 'Actualidad'), hue: 84 },
  sayisal: { id: 'sayisal', name: l('Sayısal', 'Quantitative', 'Quantitativ', 'Cuantitativo'), hue: 214 },
  sozel: { id: 'sozel', name: l('Sözel', 'Verbal', 'Verbal', 'Verbal'), hue: 4 },
} satisfies Record<string, Subject>;

const t = (id: string, name: L10n, questions: number, group: string): Test => ({ id, name, questions, group });

export const EXAMS: Record<ExamId, Exam> = {
  yks: {
    id: 'yks',
    name: l('YKS (TYT · AYT · YDT)', 'YKS (Turkish university entrance)', 'YKS (türkische Hochschulaufnahme)', 'YKS (acceso universitario turco)'),
    short: 'YKS',
    penalty: 4,
    subjects: [S.turkce, S.matematik, S.geometri, S.fizik, S.kimya, S.biyoloji, S.edebiyat, S.tarih, S.cografya, S.felsefe, S.din, S.dil],
    tests: [
      t('tyt-tr', l('TYT Türkçe', 'TYT Turkish'), 40, 'tyt'),
      t('tyt-sos', l('TYT Sosyal Bilimler', 'TYT Social Sciences'), 20, 'tyt'),
      t('tyt-mat', l('TYT Temel Matematik', 'TYT Basic Maths'), 40, 'tyt'),
      t('tyt-fen', l('TYT Fen Bilimleri', 'TYT Science'), 20, 'tyt'),
      t('ayt-mat', l('AYT Matematik', 'AYT Maths'), 40, 'ayt'),
      t('ayt-fen', l('AYT Fen Bilimleri', 'AYT Science'), 40, 'ayt'),
      t('ayt-ede', l('AYT Edebiyat–Sosyal-1', 'AYT Literature–Social 1'), 40, 'ayt'),
      t('ayt-sos2', l('AYT Sosyal Bilimler-2', 'AYT Social Sciences 2'), 40, 'ayt'),
      t('ydt', l('YDT Yabancı Dil', 'YDT Foreign Language'), 80, 'ydt'),
    ],
    mocks: [
      { id: 'tyt', name: l('TYT denemesi', 'TYT mock'), tests: ['tyt-tr', 'tyt-sos', 'tyt-mat', 'tyt-fen'] },
      { id: 'ayt-say', name: l('AYT Sayısal', 'AYT Science track'), tests: ['ayt-mat', 'ayt-fen'], field: 'say' },
      { id: 'ayt-ea', name: l('AYT Eşit Ağırlık', 'AYT Equal-weight track'), tests: ['ayt-mat', 'ayt-ede'], field: 'ea' },
      { id: 'ayt-soz', name: l('AYT Sözel', 'AYT Verbal track'), tests: ['ayt-ede', 'ayt-sos2'], field: 'soz' },
      { id: 'ydt', name: l('YDT denemesi', 'YDT mock'), tests: ['ydt'], field: 'dil' },
    ],
    dates: [
      { year: 2027, group: 'tyt', at: '2027-06-19T10:15', estimated: true },
      { year: 2027, group: 'ayt', at: '2027-06-20T10:15', estimated: true },
      { year: 2027, group: 'ydt', at: '2027-06-20T15:45', estimated: true },
      { year: 2028, group: 'tyt', at: '2028-06-17T10:15', estimated: true },
      { year: 2028, group: 'ayt', at: '2028-06-18T10:15', estimated: true },
      { year: 2028, group: 'ydt', at: '2028-06-18T15:45', estimated: true },
    ],
  },
  lgs: {
    id: 'lgs',
    name: l('LGS', 'LGS (high-school entrance)', 'LGS (Aufnahmeprüfung Gymnasium)', 'LGS (acceso a bachillerato)'),
    short: 'LGS',
    penalty: 3,
    subjects: [S.turkce, S.matematik, S.fen, S.inkilap, S.din, S.dil],
    tests: [
      t('lgs-tr', l('Türkçe', 'Turkish'), 20, 'lgs'),
      t('lgs-ink', l('İnkılap Tarihi', 'Revolution History'), 10, 'lgs'),
      t('lgs-din', l('Din Kültürü', 'Religious Culture'), 10, 'lgs'),
      t('lgs-dil', l('Yabancı Dil', 'Foreign Language'), 10, 'lgs'),
      t('lgs-mat', l('Matematik', 'Maths'), 20, 'lgs'),
      t('lgs-fen', l('Fen Bilimleri', 'Science'), 20, 'lgs'),
    ],
    mocks: [
      { id: 'lgs', name: l('LGS denemesi', 'LGS mock'), tests: ['lgs-tr', 'lgs-ink', 'lgs-din', 'lgs-dil', 'lgs-mat', 'lgs-fen'] },
      { id: 'lgs-sozel', name: l('Sözel bölüm', 'Verbal part'), tests: ['lgs-tr', 'lgs-ink', 'lgs-din', 'lgs-dil'] },
      { id: 'lgs-sayisal', name: l('Sayısal bölüm', 'Numerical part'), tests: ['lgs-mat', 'lgs-fen'] },
    ],
    dates: [
      { year: 2027, group: 'lgs', at: '2027-06-12T09:30', estimated: true },
      { year: 2028, group: 'lgs', at: '2028-06-10T09:30', estimated: true },
    ],
  },
  kpss: {
    id: 'kpss',
    name: l('KPSS (GY-GK)', 'KPSS (civil service exam)', 'KPSS (Beamtenprüfung)', 'KPSS (oposiciones)'),
    short: 'KPSS',
    penalty: 4,
    subjects: [S.turkce, S.matematik, S.tarih, S.cografya, S.vatandaslik, S.guncel],
    tests: [
      t('kpss-tr', l('Türkçe', 'Turkish'), 30, 'gy'),
      t('kpss-mat', l('Matematik', 'Maths'), 30, 'gy'),
      t('kpss-tar', l('Tarih', 'History'), 27, 'gk'),
      t('kpss-cog', l('Coğrafya', 'Geography'), 18, 'gk'),
      t('kpss-vat', l('Vatandaşlık', 'Civics'), 9, 'gk'),
      t('kpss-gun', l('Güncel Bilgiler', 'Current Affairs'), 6, 'gk'),
    ],
    mocks: [
      { id: 'kpss', name: l('GY-GK denemesi', 'GY-GK mock'), tests: ['kpss-tr', 'kpss-mat', 'kpss-tar', 'kpss-cog', 'kpss-vat', 'kpss-gun'] },
      { id: 'kpss-gy', name: l('Genel Yetenek', 'General Ability'), tests: ['kpss-tr', 'kpss-mat'] },
      { id: 'kpss-gk', name: l('Genel Kültür', 'General Culture'), tests: ['kpss-tar', 'kpss-cog', 'kpss-vat', 'kpss-gun'] },
    ],
    dates: [],
  },
  ales: {
    id: 'ales',
    name: l('ALES', 'ALES (graduate admission)', 'ALES (Masterzulassung)', 'ALES (acceso a posgrado)'),
    short: 'ALES',
    penalty: 4,
    subjects: [S.sayisal, S.sozel],
    tests: [t('ales-say', l('Sayısal', 'Quantitative'), 50, 'ales'), t('ales-soz', l('Sözel', 'Verbal'), 50, 'ales')],
    mocks: [{ id: 'ales', name: l('ALES denemesi', 'ALES mock'), tests: ['ales-say', 'ales-soz'] }],
    dates: [],
  },
  dgs: {
    id: 'dgs',
    name: l('DGS', 'DGS (vertical transfer)', 'DGS (Hochschulwechsel)', 'DGS (paso a grado)'),
    short: 'DGS',
    penalty: 4,
    subjects: [S.sayisal, S.sozel],
    tests: [t('dgs-say', l('Sayısal', 'Quantitative'), 50, 'dgs'), t('dgs-soz', l('Sözel', 'Verbal'), 50, 'dgs')],
    mocks: [{ id: 'dgs', name: l('DGS denemesi', 'DGS mock'), tests: ['dgs-say', 'dgs-soz'] }],
    dates: [],
  },
  yds: {
    id: 'yds',
    name: l('YDS / YÖKDİL', 'YDS / YÖKDİL (language exam)', 'YDS / YÖKDİL (Sprachprüfung)', 'YDS / YÖKDİL (examen de idioma)'),
    short: 'YDS',
    // YDS has no negative marking.
    penalty: 0,
    subjects: [S.dil],
    tests: [t('yds', l('Yabancı Dil', 'Foreign Language'), 80, 'yds')],
    mocks: [{ id: 'yds', name: l('YDS denemesi', 'YDS mock'), tests: ['yds'] }],
    dates: [],
  },
  msu: {
    id: 'msu',
    name: l('MSÜ', 'MSÜ (military academies)', 'MSÜ (Militärakademien)', 'MSÜ (academias militares)'),
    short: 'MSÜ',
    penalty: 4,
    subjects: [S.turkce, S.matematik, S.geometri, S.fizik, S.kimya, S.biyoloji, S.tarih, S.cografya, S.felsefe, S.din],
    tests: [
      t('msu-tr', l('Türkçe', 'Turkish'), 40, 'msu'),
      t('msu-sos', l('Sosyal Bilimler', 'Social Sciences'), 20, 'msu'),
      t('msu-mat', l('Temel Matematik', 'Basic Maths'), 40, 'msu'),
      t('msu-fen', l('Fen Bilimleri', 'Science'), 20, 'msu'),
    ],
    mocks: [{ id: 'msu', name: l('MSÜ denemesi', 'MSÜ mock'), tests: ['msu-tr', 'msu-sos', 'msu-mat', 'msu-fen'] }],
    dates: [],
  },
  other: {
    id: 'other',
    name: l('Başka bir sınav', 'Another exam', 'Andere Prüfung', 'Otro examen'),
    short: '★',
    penalty: 0,
    subjects: [
      { id: 'o-math', name: l('Matematik', 'Maths', 'Mathe', 'Matemáticas'), hue: 214 },
      { id: 'o-lang', name: l('Ana dil', 'English', 'Deutsch', 'Lengua'), hue: 4 },
      { id: 'o-foreign', name: l('Yabancı dil', 'Foreign language', 'Englisch', 'Inglés'), hue: 196 },
      { id: 'o-science', name: l('Fen', 'Science', 'Naturwissenschaften', 'Ciencias'), hue: 150 },
      { id: 'o-history', name: l('Tarih', 'History', 'Geschichte', 'Historia'), hue: 28 },
      { id: 'o-other', name: l('Diğer', 'Other', 'Sonstiges', 'Otros'), hue: 48 },
    ],
    tests: [t('o-test', l('Test', 'Test', 'Test', 'Prueba'), 100, 'other')],
    mocks: [{ id: 'other', name: l('Deneme sınavı', 'Practice test', 'Probeprüfung', 'Simulacro'), tests: ['o-test'] }],
    dates: [],
  },
};

export const EXAM_ORDER: ExamId[] = ['yks', 'lgs', 'kpss', 'ales', 'dgs', 'yds', 'msu', 'other'];

export const FIELD_NAMES: Record<YksField, L10n> = {
  say: l('Sayısal (SAY)', 'Science (SAY)'),
  ea: l('Eşit Ağırlık (EA)', 'Equal weight (EA)'),
  soz: l('Sözel (SÖZ)', 'Verbal (SÖZ)'),
  dil: l('Dil (DİL)', 'Language (DİL)'),
};

/** Subjects relevant to a YKS field (TYT subjects are always included). */
export function subjectsFor(exam: ExamId, field: YksField | null): Subject[] {
  const e = EXAMS[exam];
  if (exam !== 'yks' || !field) return e.subjects;
  const keep: Record<YksField, string[]> = {
    say: ['turkce', 'matematik', 'geometri', 'fizik', 'kimya', 'biyoloji', 'tarih', 'cografya', 'felsefe', 'din'],
    ea: ['turkce', 'matematik', 'geometri', 'edebiyat', 'tarih', 'cografya', 'felsefe', 'din', 'fizik', 'kimya', 'biyoloji'],
    soz: ['turkce', 'edebiyat', 'tarih', 'cografya', 'felsefe', 'din', 'matematik', 'geometri', 'fizik', 'kimya', 'biyoloji'],
    dil: ['dil', 'turkce', 'matematik', 'geometri', 'tarih', 'cografya', 'felsefe', 'din', 'fizik', 'kimya', 'biyoloji'],
  };
  return keep[field].map((id) => e.subjects.find((s) => s.id === id)!).filter(Boolean);
}

/** Mock kinds available for an exam profile (AYT kinds filtered by field). */
export function mocksFor(exam: ExamId, field: YksField | null): MockKind[] {
  return EXAMS[exam].mocks.filter((m) => !m.field || !field || m.field === field);
}

export function testById(exam: ExamId, id: string): Test | undefined {
  return EXAMS[exam].tests.find((x) => x.id === id);
}

/** Next built-in exam session at or after `now` (the first booklet of that day counts). */
export function nextExamDate(exam: ExamId, field: YksField | null, now: Date): ExamDate | null {
  const groups = exam === 'yks' ? (field === 'dil' ? ['tyt', 'ydt'] : ['tyt', 'ayt']) : null;
  const list = EXAMS[exam].dates
    .filter((d) => !groups || groups.includes(d.group))
    .filter((d) => parseLocal(d.at).getTime() > now.getTime())
    .sort((a, b) => a.at.localeCompare(b.at));
  return list[0] ?? null;
}

/** Parses 'YYYY-MM-DDTHH:mm' as a local date-time. */
export function parseLocal(iso: string): Date {
  const [d, tm = '00:00'] = iso.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = tm.split(':').map(Number);
  return new Date(y, m - 1, day, hh, mm);
}

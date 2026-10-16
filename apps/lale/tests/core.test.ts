import { describe, expect, it } from 'vitest';
import { EXAMS, EXAM_ORDER, mocksFor, nextExamDate, parseLocal, subjectsFor } from '../src/core/exams';
import { decode, encode, extractCode, isoWeek } from '../src/core/friends';
import { DISTRICTS, pickVariety, rarityFor, VARIETIES } from '../src/core/garden';
import { mockMax, mockNet, net, validateScore, withBlank } from '../src/core/net';
import { dailyMinutes, subjectQuestions, weekDays, type QuestionLog, type Session } from '../src/core/records';
import { atRisk, currentStreak, dayDiff, EMPTY_STREAK, markActive } from '../src/core/streak';
import { comeBack, elapsed, endsAt, isDone, leave, nextPomodoro, pause, remaining, resume, start, DEFAULT_POMODORO } from '../src/core/timer';

describe('exam presets', () => {
  it('match the official booklet sizes', () => {
    const size = (id: keyof typeof EXAMS, group: string) => EXAMS[id].tests.filter((t) => t.group === group).reduce((a, t) => a + t.questions, 0);
    expect(size('yks', 'tyt')).toBe(120);
    expect(size('yks', 'ayt')).toBe(160);
    expect(size('yks', 'ydt')).toBe(80);
    expect(size('lgs', 'lgs')).toBe(90);
    expect(size('kpss', 'gy')).toBe(60);
    expect(size('kpss', 'gk')).toBe(60);
    expect(size('ales', 'ales')).toBe(100);
  });

  it('uses the right penalties (4:1 YKS/KPSS, 3:1 LGS, none for YDS)', () => {
    expect(EXAMS.yks.penalty).toBe(4);
    expect(EXAMS.kpss.penalty).toBe(4);
    expect(EXAMS.lgs.penalty).toBe(3);
    expect(EXAMS.yds.penalty).toBe(0);
  });

  it('has complete names, unique ids and valid mock references', () => {
    for (const id of EXAM_ORDER) {
      const e = EXAMS[id];
      for (const l of ['tr', 'en', 'de', 'es'] as const) expect(e.name[l].length).toBeGreaterThan(1);
      const tests = new Set(e.tests.map((t) => t.id));
      expect(tests.size).toBe(e.tests.length);
      expect(new Set(e.subjects.map((s) => s.id)).size).toBe(e.subjects.length);
      for (const m of e.mocks) for (const t of m.tests) expect(tests.has(t), `${id}/${m.id}/${t}`).toBe(true);
    }
  });

  it('filters subjects and AYT mocks by field', () => {
    expect(subjectsFor('yks', 'say').map((s) => s.id)).toContain('fizik');
    expect(subjectsFor('yks', 'dil')[0].id).toBe('dil');
    expect(mocksFor('yks', 'ea').map((m) => m.id)).toEqual(['tyt', 'ayt-ea']);
    expect(mocksFor('yks', null).length).toBe(5);
  });

  it('finds the next exam date', () => {
    const before = nextExamDate('yks', 'say', new Date(2026, 9, 16));
    expect(before?.at).toBe('2027-06-19T10:15');
    const after = nextExamDate('yks', 'say', new Date(2027, 5, 21));
    expect(after?.at).toBe('2028-06-17T10:15');
    expect(nextExamDate('kpss', null, new Date(2026, 9, 16))).toBeNull();
    expect(parseLocal('2027-06-19T10:15').getHours()).toBe(10);
  });
});

describe('nets', () => {
  it('applies the penalty', () => {
    expect(net({ d: 30, y: 8 }, 4)).toBe(28);
    expect(net({ d: 15, y: 3 }, 3)).toBe(14);
    expect(net({ d: 60, y: 20 }, 0)).toBe(60);
    expect(net({ d: 10, y: 3 }, 4)).toBe(9.25);
  });

  it('validates and fills blanks', () => {
    expect(validateScore({ d: 30, y: 8, b: 2 }, 40)).toBeNull();
    expect(validateScore({ d: 30, y: 12, b: 0 }, 40)).toBe('tooMany');
    expect(validateScore({ d: -1, y: 0, b: 0 }, 40)).toBe('negative');
    expect(withBlank({ d: 30, y: 8 }, 40)).toEqual({ d: 30, y: 8, b: 2 });
  });

  it('sums a TYT mock', () => {
    const scores = { 'tyt-tr': { d: 32, y: 4, b: 4 }, 'tyt-sos': { d: 14, y: 4, b: 2 }, 'tyt-mat': { d: 25, y: 8, b: 7 }, 'tyt-fen': { d: 10, y: 4, b: 6 } };
    expect(mockNet('yks', scores)).toBe(31 + 13 + 23 + 9);
    expect(mockMax('yks', Object.keys(scores))).toBe(120);
  });
});

describe('timer', () => {
  const t0 = 1_800_000_000_000;
  it('counts down with pauses and survives background time', () => {
    let r = start({ mode: 'timer', subject: 'fizik', minutes: 25, strict: false, now: t0, id: 's1' });
    expect(remaining(r, t0 + 60_000)).toBe(24 * 60);
    r = pause(r, t0 + 60_000);
    expect(elapsed(r, t0 + 600_000)).toBe(60);
    r = resume(r, t0 + 120_000);
    expect(elapsed(r, t0 + 180_000)).toBe(120);
    expect(endsAt(r)).toBe(t0 + 60_000 + 25 * 60_000);
    expect(isDone(r, t0 + 26 * 60_000)).toBe(true);
  });

  it('wilts only in strict mode after the grace period', () => {
    const r = start({ mode: 'timer', subject: 'fizik', minutes: 25, strict: true, now: t0, id: 's2' });
    expect(comeBack(leave(r, t0 + 1000), t0 + 6000).wilted).toBe(false);
    expect(comeBack(leave(r, t0 + 1000), t0 + 20_000).wilted).toBe(true);
    const lenient = { ...r, strict: false };
    expect(comeBack(leave(lenient, t0 + 1000), t0 + 600_000).wilted).toBe(false);
    // A session that ended before the student left cannot wilt.
    expect(comeBack(leave(r, t0 + 25 * 60_000 + 5000), t0 + 40 * 60_000).wilted).toBe(false);
    // Paused sessions never wilt.
    expect(comeBack(leave(pause(r, t0 + 500), t0 + 1000), t0 + 600_000).wilted).toBe(false);
  });

  it('cycles pomodoro breaks', () => {
    const r = start({ mode: 'pomodoro', subject: 'x', minutes: 25, strict: false, now: t0, id: 'p', cycle: 3 });
    expect(nextPomodoro(r, DEFAULT_POMODORO)).toEqual({ phase: 'break', minutes: 15, cycle: 4 });
    expect(nextPomodoro({ ...r, cycle: 0 }, DEFAULT_POMODORO)).toEqual({ phase: 'break', minutes: 5, cycle: 1 });
    expect(nextPomodoro({ ...r, phase: 'break', cycle: 1 }, DEFAULT_POMODORO)).toEqual({ phase: 'focus', minutes: 25, cycle: 1 });
  });
});

describe('garden', () => {
  it('maps minutes to tiers', () => {
    expect(rarityFor(9)).toBeNull();
    expect(rarityFor(10)).toBe('common');
    expect(rarityFor(25)).toBe('uncommon');
    expect(rarityFor(50)).toBe('rare');
    expect(rarityFor(120)).toBe('epic');
  });

  it('never gives premium tulips to free users and favours unseen ones', () => {
    for (let i = 0; i < 200; i++) {
      const v = pickVariety(30 + (i % 80), `seed${i}`, false, {});
      expect(v?.premium).toBeFalsy();
    }
    const seen = Object.fromEntries(VARIETIES.filter((x) => x.rarity === 'uncommon' && x.id !== 'mercan').map((x) => [x.id, 3]));
    const picks = Array.from({ length: 50 }, (_, i) => pickVariety(30, `s${i}`, false, seen)!.id);
    expect(picks.filter((p) => p === 'mercan').length).toBeGreaterThan(20);
  });

  it('has unique ids and names in every language', () => {
    expect(new Set(VARIETIES.map((x) => x.id)).size).toBe(VARIETIES.length);
    for (const x of [...VARIETIES, ...DISTRICTS]) for (const l of ['tr', 'en', 'de', 'es'] as const) expect(x.name[l].length).toBeGreaterThan(1);
  });
});

describe('streak with bulbs', () => {
  it('grows, earns a bulb every 7 days and spends it on a missed day', () => {
    let s = EMPTY_STREAK;
    const days = ['2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04', '2027-01-05', '2027-01-06', '2027-01-07'];
    for (const d of days) s = markActive(s, d).streak;
    expect(s.count).toBe(7);
    expect(s.bulbs).toBe(1);
    expect(currentStreak(s, '2027-01-09')).toBe(7); // one missed day, covered
    const r = markActive(s, '2027-01-09');
    expect(r.used).toBe(1);
    expect(r.streak.count).toBe(8);
    expect(r.streak.bulbs).toBe(0);
    expect(markActive(r.streak, '2027-01-12').streak.count).toBe(1); // two missed days, no bulbs
    expect(currentStreak(r.streak, '2027-01-12')).toBe(0);
    expect(atRisk(r.streak, '2027-01-10')).toBe(true);
    expect(dayDiff('2027-02-28', '2027-03-01')).toBe(1);
  });
});

describe('study codes', () => {
  it('round-trips and rejects tampering', () => {
    const s = { name: 'Elif Şahin', exam: 'yks', year: 2027, week: 7, minutes: 1240, questions: 860, streak: 12, tulips: 31 };
    const code = encode(s);
    expect(code.startsWith('LALE-')).toBe(true);
    expect(decode(code)).toEqual(s);
    expect(decode(`Lale çalışma kodum: ${code} 🌷`.replace(/^.*?(LALE)/, '$1'))).toEqual(s);
    expect(extractCode(`Bak: ${code} 🌷`)).toBe(code);
    const tampered = code.slice(0, 12) + (code[12] === 'A' ? 'B' : 'A') + code.slice(13);
    expect(decode(tampered)).toBeNull();
    expect(decode('LALE-1234')).toBeNull();
  });

  it('computes ISO weeks', () => {
    expect(isoWeek(new Date(2027, 0, 1))).toEqual({ year: 2026, week: 53 });
    expect(isoWeek(new Date(2027, 0, 4))).toEqual({ year: 2027, week: 1 });
  });
});

describe('records', () => {
  it('aggregates minutes and questions', () => {
    const at = new Date(2027, 0, 4, 10).getTime();
    const sessions: Session[] = [
      { id: 'a', at, sec: 1500, subject: 'fizik', mode: 'pomodoro', tulip: 'gulhane' },
      { id: 'b', at: at + 3600_000, sec: 900, subject: 'kimya', mode: 'timer', tulip: 'kirmizi' },
      { id: 'c', at: at + 7200_000, sec: 900, subject: 'kimya', mode: 'timer', tulip: null, wilted: true },
    ];
    const days = weekDays(new Date(2027, 0, 6));
    expect(days[0]).toBe('2027-01-04');
    expect(dailyMinutes(sessions, days)[0]).toBe(40);
    const logs: QuestionLog[] = [
      { id: 'q', at, subject: 'fizik', d: 20, y: 4, b: 1 },
      { id: 'r', at, subject: 'fizik', d: 10, y: 2, b: 0 },
    ];
    expect(subjectQuestions(logs, null).get('fizik')).toEqual({ d: 30, y: 6, b: 1 });
  });
});

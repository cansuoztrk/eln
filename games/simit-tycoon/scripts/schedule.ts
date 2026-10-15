import type { Bot } from './bot';

/**
 * Real-life play schedule: a session of `sessionMin` minutes every `gapMin`
 * minutes during 15 waking hours (first session at 08:00), then the night
 * away. `onSession` runs after each session; return false to stop.
 */
export function runSchedule(bot: Bot, sessionMin: number, gapMin: number, onSession: (day: number) => boolean): void {
  const DAY = 86400;
  for (;;) {
    const day = Math.floor(bot.t / DAY);
    const sessionStart = bot.t - day * DAY;
    bot.play(sessionMin * 60);
    if (!onSession(day)) return;
    if (sessionStart + gapMin * 60 <= 15 * 3600) bot.away((gapMin - sessionMin) * 60);
    else bot.away((day + 1) * DAY - bot.t);
  }
}

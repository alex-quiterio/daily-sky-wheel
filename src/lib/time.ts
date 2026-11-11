// Local time at a place, using the browser's time zone database.
import { pad } from '#lib/format.ts';
import type { Moment } from '#lib/types.ts';

export function tzOffsetMin(utcMs: number, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour % 24, +v.minute, +v.second);
  return (asUTC - utcMs) / 60000;
}

export function localToUTC(y: number, m: number, d: number, hh: number, mm: number, tz: string) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - tzOffsetMin(guess, tz) * 60000;
  t = guess - tzOffsetMin(t, tz) * 60000;
  return new Date(t);
}

export function localParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { date: `${v.year}-${v.month}-${v.day}`, time: `${pad(+v.hour % 24)}:${v.minute}` };
}

export function tzAbbr(date: Date, tz: string) {
  try {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(date)
      .find((x) => x.type === 'timeZoneName');
    return p ? p.value : tz;
  } catch (e) {
    return tz;
  }
}

// "Monday, 9 November 2026 · 02:02 EST · New York"
export function subtitleOf(m: Moment) {
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: m.place.tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(m.when);
  return `${date} · ${pad(m.local.hh)}:${pad(m.local.mm)} ${tzAbbr(m.when, m.place.tz)} · ${m.place.name}`;
}

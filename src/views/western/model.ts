// Western tab: everything worked out for one moment, as plain data. No markup here.
import * as Astronomy from 'astronomy-engine';
import * as Western from '#astro/western.ts';
import * as WesternReading from '#astro/western-reading.ts';
import type { DayEvent } from '#astro';
import { state as st } from '#lib/state.ts';
import { localToUTC } from '#lib/time.ts';
import type { Moment } from '#lib/types.ts';
import type { Model } from '#views/western/types.ts';

// Is this New or Full Moon also an eclipse? Returns " · Total Solar Eclipse" or "".
function eclipseAt(lun: DayEvent) {
  const from = new Date(lun.t.getTime() - 2 * 86400000);
  const kind = (k: string) => k[0].toUpperCase() + k.slice(1);
  try {
    if (/New Moon/.test(lun.title ?? '')) {
      const e = Astronomy.SearchGlobalSolarEclipse(from);
      if (Math.abs(e.peak.date.getTime() - lun.t.getTime()) < 86400000) return ` · ${kind(e.kind)} Solar Eclipse`;
    } else if (/Full Moon/.test(lun.title ?? '')) {
      const e = Astronomy.SearchLunarEclipse(from);
      if (Math.abs(e.peak.date.getTime() - lun.t.getTime()) < 86400000) return ` · ${kind(e.kind)} Lunar Eclipse`;
    }
  } catch (err) {
    /* no eclipse info */
  }
  return '';
}

// the day's events only change with the civil day, so they are kept between renders
let dayEvents: { key: number; events: DayEvent[] } | null = null;

export function build({ place, chart, asps, byName, local }: Moment): Model {
  const dayStart = localToUTC(local.y, local.m, local.d, 0, 0, place.tz);
  const dayEnd = localToUTC(local.y, local.m, local.d + 1, 0, 0, place.tz);
  if (!dayEvents || dayEvents.key !== dayStart.getTime())
    dayEvents = { key: dayStart.getTime(), events: Western.dayEvents(dayStart, dayEnd) };
  const events = dayEvents.events;
  const lunation = events.find((e) => e.kind === 'lunation');
  const phase = Western.moonPhase(byName.Sun.lon, byName.Moon.lon);
  const moonSign = Western.SIGNS[Math.floor(byName.Moon.lon / 30)];
  const pats = Western.patterns(chart.pts, asps);
  return {
    title: lunation ? lunation.title + eclipseAt(lunation) : `Moon in ${moonSign}`,
    events,
    phase,
    moonSign,
    pats,
    reading: WesternReading.read({ chart, asps, pats, phase, houseOf: st.ctx?.houseOf }),
  };
}

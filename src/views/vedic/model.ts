// Vedic tab: everything worked out for one moment, as plain data. No markup here.
import { Vedic, VedicReading } from '#astro';
import { pad } from '#lib/format.ts';
import { localToUTC } from '#lib/time.ts';
import type { Moment } from '#lib/types.ts';
import type { Model } from '#views/vedic/types.ts';

export const degMin = (x: number) => `${Math.floor(x)}°${pad(Math.floor((x % 1) * 60))}′`;

export const isNode = (key: string) => key === 'Rahu' || key === 'Ketu';

export let vdLast: Model | null = null; // the chart the tooltips and the rashi drawing describe

export function build({ when, local, place, chart }: Moment): Model {
  const dayStart = localToUTC(local.y, local.m, local.d, 0, 0, place.tz);
  const p = Vedic.panchang(when, place.lat, place.lon, dayStart);
  const g = Vedic.grahas(when);
  const lagna = Vedic.sidereal(chart.asc, when),
    lagnaSign = Math.floor(lagna / 30);
  const month = Vedic.lunarMonth(when);
  const civilDay = new Date(Date.UTC(local.y, local.m - 1, local.d)).getUTCDay();
  const vara = p.sunrise && when < p.sunrise ? (civilDay + 6) % 7 : civilDay;
  const periods = Vedic.periods(p.sunrise, p.sunset, civilDay);
  const dashas = Vedic.dashas(when, g.list.find((x) => x.key === 'Moon')!.sid);
  const rahuKaal = !!periods && when >= periods.rahu.start && when < periods.rahu.end;
  const title = `${p.tithi.paksha} ${p.tithi.name} · ${p.nakshatra.name}`;
  vdLast = {
    title,
    p,
    g,
    lagna,
    lagnaSign,
    month,
    vara,
    periods,
    dashas,
    reading: VedicReading.read({ p, g, lagna, vara, dashas, rahuKaal }),
  };
  return vdLast;
}

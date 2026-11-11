// Kabbalah tab: everything worked out for one moment, as plain data. No markup here.
import * as Astronomy from 'astronomy-engine';
import { Hebrew, KabbalahReading } from '#astro';
import { localToUTC } from '#lib/time.ts';
import type { Moment, Place } from '#lib/types.ts';
import type { Model } from '#views/kabbalah/types.ts';

// sunset on a civil date, and nightfall (Sun 8.5° below the horizon)
export function sunEvents(day: { y: number; m: number; d: number }, place: Place): { sunset?: Date; nightfall?: Date } {
  const obs = new Astronomy.Observer(place.lat, place.lon, 0);
  const start = localToUTC(day.y, day.m, day.d, 0, 0, place.tz);
  try {
    return {
      sunset: Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, start, 1)?.date,
      nightfall: Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, -1, start, 1, -8.5)?.date,
    };
  } catch (e) {
    return {};
  }
}

export function build({ when, local, place }: Moment): Model {
  const today = sunEvents(local, place);
  const after = today.sunset ? when >= today.sunset : false;
  const h = Hebrew.hebrewDate(local.y, local.m, local.d, after);
  return {
    h,
    after,
    today,
    omer: Hebrew.omer(h),
    reading: KabbalahReading.read(h),
  };
}

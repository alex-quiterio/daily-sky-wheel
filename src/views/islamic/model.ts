// Islamic tab: everything worked out for one moment, as plain data. No markup here.
import { Islamic } from '#astro';
import { render } from '#lib/state.ts';
import { localToUTC } from '#lib/time.ts';
import type { Moment } from '#lib/types.ts';
import { PRAYERS } from '#views/islamic/constants.ts';
import type { Model, PrayerKey } from '#views/islamic/types.ts';

// the calculation method and the Asr rule are remembered between visits
const prefs: { method: string; asr: number } = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem('skywheel-islamic') || '{}');
    return { method: saved.method || 'mwl', asr: saved.asr || 1 };
  } catch (e) {
    return { method: 'mwl', asr: 1 };
  }
})();

export function setPrefs(next: Partial<typeof prefs>) {
  Object.assign(prefs, next);
  try {
    localStorage.setItem('skywheel-islamic', JSON.stringify(prefs));
  } catch (e) {
    /* storage unavailable */
  }
  render();
}

export function build({ when, local, place }: Moment): Model {
  const dayStart = localToUTC(local.y, local.m, local.d, 0, 0, place.tz);
  const times = Islamic.prayerTimes(dayStart, place.lat, place.lon, prefs.method, prefs.asr);
  const after = times.maghrib ? when >= times.maghrib : false;
  const h = Islamic.hijriDate(local.y, local.m, local.d, after);
  let current: PrayerKey | null = null;
  PRAYERS.forEach(([k]) => {
    const at = times[k];
    if (at && at <= when) current = k;
  });
  const next = PRAYERS.find(([k]) => {
    const at = times[k];
    return at && at > when;
  });
  const qibla = Islamic.qibla(place.lat, place.lon);
  return {
    times,
    method: prefs.method,
    asr: prefs.asr,
    after,
    h,
    current,
    next,
    qibla,
  };
}

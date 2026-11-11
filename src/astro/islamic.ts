// Islamic calendar and prayer times.
// Hijri months follow the Umm al-Qura rule: if, on the day of the conjunction at Mecca, the conjunction
// happens before sunset and the Moon sets after the Sun, the month begins the next day; otherwise a day later.
// Local sighting can differ by a day. The day turns at Maghrib (sunset).
import * as Astronomy from 'astronomy-engine';

const DAY = 86400000,
  MONTH = 29.530588853;
const MECCA = { lat: 21.4225, lon: 39.8262 },
  MECCA_TZ = 3;
// anchor: the conjunction of 17 Feb 2026 opens Ramadan 1447 (month 9)
const ANCHOR = { t: Date.UTC(2026, 1, 17, 12, 1), k: (1447 - 1) * 12 + 8 };

const MONTHS = [
  ['Muharram', 'مُحَرَّم'],
  ['Safar', 'صَفَر'],
  ["Rabi' al-Awwal", 'رَبِيع الأَوَّل'],
  ["Rabi' al-Thani", 'رَبِيع الآخِر'],
  ['Jumada al-Ula', 'جُمَادَى الأُولَى'],
  ['Jumada al-Akhirah', 'جُمَادَى الآخِرَة'],
  ['Rajab', 'رَجَب'],
  ["Sha'ban", 'شَعْبَان'],
  ['Ramadan', 'رَمَضَان'],
  ['Shawwal', 'شَوَّال'],
  ["Dhu al-Qa'dah", 'ذُو القَعْدَة'],
  ['Dhu al-Hijjah', 'ذُو الحِجَّة'],
];
const WEEKDAYS = [
  ['al-Ahad', 'الأحد'],
  ['al-Ithnayn', 'الإثنين'],
  ["ath-Thulatha'", 'الثلاثاء'],
  ["al-Arbi'a'", 'الأربعاء'],
  ['al-Khamis', 'الخميس'],
  ["al-Jumu'ah", 'الجمعة'],
  ['as-Sabt', 'السبت'],
];
// Arab lunar mansions (manazil al-qamar), each 12°51′ of the zodiac from 0° Aries
const MANAZIL = [
  ['al-Sharatain', 'the two signs'],
  ['al-Butain', 'the little belly'],
  ['al-Thurayya', 'the Pleiades'],
  ['al-Dabaran', 'the follower'],
  ["al-Haq'a", 'the white spot'],
  ["al-Han'a", 'the brand'],
  ['al-Dhira', 'the forearm'],
  ['al-Nathra', 'the gap'],
  ['al-Tarf', 'the glance'],
  ['al-Jabha', 'the forehead'],
  ['al-Zubra', 'the mane'],
  ['al-Sarfa', 'the changer'],
  ["al-'Awwa", 'the barker'],
  ['al-Simak', 'the unarmed'],
  ['al-Ghafr', 'the covering'],
  ['al-Zubana', 'the claws'],
  ['al-Iklil', 'the crown'],
  ['al-Qalb', 'the heart'],
  ['al-Shawla', 'the sting'],
  ["al-Na'a'im", 'the ostriches'],
  ['al-Balda', 'the city'],
  ["Sa'd al-Dhabih", 'luck of the slaughterer'],
  ["Sa'd Bula", 'luck of the swallower'],
  ["Sa'd al-Su'ud", 'luck of lucks'],
  ["Sa'd al-Akhbiya", 'luck of the tents'],
  ['al-Fargh al-Muqaddam', 'the first spout'],
  ["al-Fargh al-Mu'akhkhar", 'the second spout'],
  ['Batn al-Hut', 'the belly of the fish'],
];
// [month (1-12), day, name, note]
const OCCASIONS: [month: number, day: number, name: string, note: string][] = [
  [1, 1, 'Islamic New Year', 'Ras as-Sanah'],
  [1, 10, 'Ashura', ''],
  [3, 12, 'Mawlid an-Nabi', 'observed by many'],
  [7, 27, "Isra' and Mi'raj", ''],
  [8, 15, "Laylat al-Bara'ah", "mid-Sha'ban"],
  [9, 1, 'Ramadan begins', ''],
  [9, 27, 'Laylat al-Qadr', 'sought in the last ten nights; the 27th by many'],
  [10, 1, 'Eid al-Fitr', ''],
  [12, 8, 'Hajj begins', 'Day of Tarwiyah'],
  [12, 9, 'Day of Arafah', ''],
  [12, 10, 'Eid al-Adha', ''],
];
// a calculation method: Sun angles below the horizon for Fajr and Isha, or Isha a fixed time after sunset
interface Method {
  name: string;
  fajr: number;
  isha?: number;
  ishaMin?: number;
}
const METHODS: Record<string, Method> = {
  mwl: { name: 'Muslim World League', fajr: 18, isha: 17 },
  uqa: { name: 'Umm al-Qura, Makkah', fajr: 18.5, ishaMin: 90 },
  isna: { name: 'ISNA, North America', fajr: 15, isha: 15 },
  egypt: { name: 'Egyptian General Authority', fajr: 19.5, isha: 17.5 },
  karachi: { name: 'University of Karachi', fajr: 18, isha: 18 },
};

const indic = (n: number | string) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
const meccaDay = (date: Date) => Math.floor((date.getTime() + MECCA_TZ * 3600000) / DAY); // day number at Mecca
const meccaMidnight = (dayNum: number) => new Date(dayNum * DAY - MECCA_TZ * 3600000);
const cache = new Map<number, number>();

// first civil day (as a day number) of the month that this conjunction opens
function monthStartDay(nm: Date): number {
  const key = nm.getTime();
  const known = cache.get(key);
  if (known !== undefined) return known;
  const obs = new Astronomy.Observer(MECCA.lat, MECCA.lon, 0);
  const d = meccaDay(nm),
    mid = meccaMidnight(d);
  const ss = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, mid, 1),
    ms = Astronomy.SearchRiseSet(Astronomy.Body.Moon, obs, -1, mid, 1);
  const seen = ss && nm < ss.date && ms && ms.date > ss.date;
  const start = d + (seen ? 1 : 2);
  cache.set(key, start);
  return start;
}
const monthIndex = (nm: Date) => ANCHOR.k + Math.round((nm.getTime() - ANCHOR.t) / (MONTH * DAY));

// the conjunction whose month contains civil day number `dayNum`
// every lunation has a new moon within the search window, so these searches always find one
const newMoonAfter = (t: Astronomy.AstroTime, days: number) => Astronomy.SearchMoonPhase(0, t, days)!;

interface HijriMonth {
  start: number;
  length: number;
  year: number;
  month: number;
  conjunction: Date;
}
function monthFor(dayNum: number): HijriMonth {
  let t = Astronomy.MakeTime(new Date((dayNum - 33) * DAY));
  const nms: Date[] = [];
  for (let k = 0; k < 4; k++) {
    const nm = newMoonAfter(t, 40);
    nms.push(nm.date);
    t = nm.AddDays(1);
  }
  for (let k = nms.length - 1; k >= 0; k--) {
    const s = monthStartDay(nms[k]);
    if (s <= dayNum) {
      const next = monthStartDay(
        nms[k + 1] || newMoonAfter(Astronomy.MakeTime(new Date(nms[k].getTime() + DAY)), 40).date,
      );
      const idx = monthIndex(nms[k]);
      return { start: s, length: next - s, year: Math.floor(idx / 12) + 1, month: (idx % 12) + 1, conjunction: nms[k] };
    }
  }
  throw new Error(`no Hijri month found for day ${dayNum}`); // the four conjunctions searched always cover the day
}

// Hijri date for a civil date (y, m, d) at a place; after sunset it is already the next Hijri day
function hijriDate(y: number, m: number, d: number, afterSunset: boolean) {
  const dayNum = Math.floor(Date.UTC(y, m - 1, d) / DAY) + (afterSunset ? 1 : 0);
  const mo = monthFor(dayNum);
  return {
    year: mo.year,
    month: mo.month,
    day: dayNum - mo.start + 1,
    length: mo.length,
    dayNum,
    weekday: new Date(dayNum * DAY).getUTCDay(),
  };
}
// civil date of a Hijri date (year, month, day), as a UTC Date at midnight
function civilOf(year: number, month: number, day: number): Date {
  const idx = (year - 1) * 12 + (month - 1);
  const approx = ANCHOR.t + (idx - ANCHOR.k) * MONTH * DAY;
  const nm = newMoonAfter(Astronomy.MakeTime(new Date(approx - 5 * DAY)), 12);
  return new Date((monthStartDay(nm.date) + day - 1) * DAY);
}

interface Occasion {
  year: number;
  month: number;
  day: number;
  name: string;
  note: string;
  date: Date;
  inDays: number;
}
function upcoming(fromDayNum: number, count = 10): Occasion[] {
  const h = monthFor(fromDayNum);
  const out: Occasion[] = [];
  for (let k = 0; k < 14 && out.length < count; k++) {
    const idx = (h.year - 1) * 12 + (h.month - 1) + k,
      year = Math.floor(idx / 12) + 1,
      month = (idx % 12) + 1;
    OCCASIONS.filter((o) => o[0] === month).forEach(([, day, name, note]) => {
      const c = civilOf(year, month, day),
        dn = Math.floor(c.getTime() / DAY);
      if (dn >= fromDayNum && out.length < count)
        out.push({ year, month, day, name, note, date: c, inDays: dn - fromDayNum });
    });
  }
  return out;
}

// Prayer times for the civil day starting at local midnight `dayStart`
function prayerTimes(dayStart: Date, lat: number, lon: number, methodKey = 'mwl', asrFactor = 1) {
  const M = METHODS[methodKey] || METHODS.mwl;
  const obs = new Astronomy.Observer(lat, lon, 0);
  const get = (r: Astronomy.AstroTime | Astronomy.HourAngleEvent | null): Date | null =>
    !r ? null : r instanceof Astronomy.AstroTime ? r.date : r.time.date;
  const sunrise = get(Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, +1, dayStart, 1));
  const sunset = get(Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, dayStart, 1));
  const noon = get(Astronomy.SearchHourAngle(Astronomy.Body.Sun, obs, 0, dayStart, +1));
  let fajr = get(Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, +1, dayStart, 1, -M.fajr));
  let isha = M.ishaMin
    ? sunset
      ? new Date(sunset.getTime() + M.ishaMin * 60000)
      : null
    : get(Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, -1, dayStart, 1, -(M.isha ?? 17)));
  let asr: Date | null = null;
  if (noon) {
    const dec = Astronomy.Equator(Astronomy.Body.Sun, noon, obs, true, true).dec;
    const alt = (Math.atan(1 / (asrFactor + Math.tan((Math.abs(lat - dec) * Math.PI) / 180))) * 180) / Math.PI;
    asr = get(Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, -1, noon, 1, alt));
  }
  // high latitudes: when the Sun never reaches the angle, use the angle-based share of the night
  let adjusted = false;
  if (sunrise && sunset) {
    const night = DAY - (sunset.getTime() - sunrise.getTime());
    const fajrMin = new Date(sunrise.getTime() - (M.fajr / 60) * night);
    if (!fajr || fajr < fajrMin) {
      fajr = fajrMin;
      adjusted = true;
    }
    if (!M.ishaMin) {
      const ishaMax = new Date(sunset.getTime() + ((M.isha ?? 17) / 60) * night);
      if (!isha || isha > ishaMax) {
        isha = ishaMax;
        adjusted = true;
      }
    }
  }
  return { fajr, sunrise, dhuhr: noon, asr, maghrib: sunset, isha, adjusted, method: M.name };
}

function qibla(lat: number, lon: number) {
  const r = Math.PI / 180,
    p1 = lat * r,
    p2 = MECCA.lat * r,
    dl = (MECCA.lon - lon) * r;
  const bearing =
    (Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) /
      r +
      360) %
    360;
  const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return { bearing, km: 2 * 6371 * Math.asin(Math.sqrt(a)) };
}

// the Moon at a given sunset: age since conjunction, altitude, elongation, and a simple visibility guess
function crescent(sunset: Date | null, lat: number, lon: number) {
  if (!sunset) return null;
  const obs = new Astronomy.Observer(lat, lon, 0);
  let t = Astronomy.MakeTime(new Date(sunset.getTime() - 31 * DAY)),
    prev: Date | null = null;
  for (let k = 0; k < 3; k++) {
    const nm = Astronomy.SearchMoonPhase(0, t, 40);
    if (!nm || nm.date > sunset) break;
    prev = nm.date;
    t = nm.AddDays(1);
  }
  const hor = Astronomy.Horizon(
    sunset,
    obs,
    Astronomy.Equator(Astronomy.Body.Moon, sunset, obs, true, true).ra,
    Astronomy.Equator(Astronomy.Body.Moon, sunset, obs, true, true).dec,
    'normal',
  );
  const elong = Astronomy.AngleFromSun(Astronomy.Body.Moon, sunset);
  const ageH = prev ? (sunset.getTime() - prev.getTime()) / 3600000 : null;
  let verdict = '';
  if (ageH != null && ageH < 72) {
    if (hor.altitude < 0) verdict = 'The Moon has already set at sunset; no crescent tonight.';
    else if (ageH < 15 || hor.altitude < 4 || elong < 7) verdict = 'Not visible: too young or too low.';
    else if (hor.altitude >= 10 && elong >= 12) verdict = 'Likely visible to the naked eye.';
    else verdict = 'Difficult: may need binoculars or a telescope.';
  }
  return { ageH, altitude: hor.altitude, elong, verdict };
}

const manzil = (moonTropical: number) => Math.floor((((moonTropical % 360) + 360) % 360) / (360 / 28));

export type { Method, HijriMonth, Occasion };
export {
  MONTHS,
  WEEKDAYS,
  MANAZIL,
  METHODS,
  OCCASIONS,
  hijriDate,
  civilOf,
  upcoming,
  prayerTimes,
  qibla,
  crescent,
  manzil,
  indic,
};

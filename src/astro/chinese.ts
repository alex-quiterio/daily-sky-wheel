// Chinese astrology: Four Pillars (BaZi), solar terms and the Chinese lunar calendar.
// Needs AstroCore (and the global Astronomy). Months follow the solar terms; the year pillar
// turns at Lichun (Start of Spring); the zodiac year turns at Chinese New Year.
import * as Astronomy from 'astronomy-engine';
import * as Core from './core.ts';

const norm = (x: number) => ((x % 360) + 360) % 360;
const DAY = 86400000;

const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
const ELEMENT_ZH = ['木', '火', '土', '金', '水'];
// [character, pinyin, element index, image, short nature]
const STEMS: [character: string, pinyin: string, element: number, image: string, nature: string][] = [
  ['甲', 'Jiǎ', 0, 'a tall tree', 'Upright, principled and steady in growth. Leads by standing firm.'],
  ['乙', 'Yǐ', 0, 'a flowering vine', 'Adaptable, graceful and persistent. Finds a way around obstacles.'],
  ['丙', 'Bǐng', 1, 'the sun', 'Warm, generous and visible. Lights up whatever it turns toward.'],
  ['丁', 'Dīng', 1, 'a candle flame', 'Attentive, inspiring and quietly intense. Brings light to small places.'],
  ['戊', 'Wù', 2, 'a mountain', 'Stable, reliable and protective. Others lean on it.'],
  ['己', 'Jǐ', 2, 'fertile soil', 'Nurturing, practical and resourceful. Helps things grow.'],
  ['庚', 'Gēng', 3, 'raw metal, an axe', 'Decisive, tough and direct. Cuts through what is unclear.'],
  ['辛', 'Xīn', 3, 'a jewel', 'Refined, sensitive and exacting. Values beauty and fairness.'],
  ['壬', 'Rén', 4, 'the ocean', 'Expansive, free and resourceful. Moves with great force.'],
  ['癸', 'Guǐ', 4, 'rain and dew', 'Quiet, intuitive and imaginative. Works gently but everywhere.'],
];
// [character, pinyin, animal, element index, hours, traits, hidden stems]
const BRANCHES: [
  character: string,
  pinyin: string,
  animal: string,
  element: number,
  hours: string,
  traits: string,
  hidden: number[],
][] = [
  ['子', 'Zǐ', 'Rat', 4, '23:00–01:00', 'Resourceful, quick-witted and charming.', [9]],
  ['丑', 'Chǒu', 'Ox', 2, '01:00–03:00', 'Steady, patient and dependable.', [5, 9, 7]],
  ['寅', 'Yín', 'Tiger', 0, '03:00–05:00', 'Brave, bold and restless.', [0, 2, 4]],
  ['卯', 'Mǎo', 'Rabbit', 0, '05:00–07:00', 'Gentle, tactful and refined.', [1]],
  ['辰', 'Chén', 'Dragon', 2, '07:00–09:00', 'Confident, ambitious and magnetic.', [4, 1, 9]],
  ['巳', 'Sì', 'Snake', 1, '09:00–11:00', 'Wise, intuitive and discreet.', [2, 4, 6]],
  ['午', 'Wǔ', 'Horse', 1, '11:00–13:00', 'Free-spirited, energetic and outspoken.', [3, 5]],
  ['未', 'Wèi', 'Goat', 2, '13:00–15:00', 'Kind, artistic and sensitive.', [5, 3, 1]],
  ['申', 'Shēn', 'Monkey', 3, '15:00–17:00', 'Clever, playful and inventive.', [6, 8, 4]],
  ['酉', 'Yǒu', 'Rooster', 3, '17:00–19:00', 'Precise, honest and proud.', [7]],
  ['戌', 'Xū', 'Dog', 2, '19:00–21:00', 'Loyal, fair and protective.', [4, 7, 3]],
  ['亥', 'Hài', 'Pig', 4, '21:00–23:00', 'Generous, sincere and easygoing.', [8, 0]],
];
// 24 solar terms, starting at Sun 0° (Spring Equinox), every 15°
const TERMS: [character: string, pinyin: string, english: string][] = [
  ['春分', 'Chūnfēn', 'Spring Equinox'],
  ['清明', 'Qīngmíng', 'Pure Brightness'],
  ['穀雨', 'Gǔyǔ', 'Grain Rain'],
  ['立夏', 'Lìxià', 'Start of Summer'],
  ['小滿', 'Xiǎomǎn', 'Grain Buds'],
  ['芒種', 'Mángzhòng', 'Grain in Ear'],
  ['夏至', 'Xiàzhì', 'Summer Solstice'],
  ['小暑', 'Xiǎoshǔ', 'Minor Heat'],
  ['大暑', 'Dàshǔ', 'Major Heat'],
  ['立秋', 'Lìqiū', 'Start of Autumn'],
  ['處暑', 'Chǔshǔ', 'End of Heat'],
  ['白露', 'Báilù', 'White Dew'],
  ['秋分', 'Qiūfēn', 'Autumn Equinox'],
  ['寒露', 'Hánlù', 'Cold Dew'],
  ['霜降', 'Shuāngjiàng', "Frost's Descent"],
  ['立冬', 'Lìdōng', 'Start of Winter'],
  ['小雪', 'Xiǎoxuě', 'Minor Snow'],
  ['大雪', 'Dàxuě', 'Major Snow'],
  ['冬至', 'Dōngzhì', 'Winter Solstice'],
  ['小寒', 'Xiǎohán', 'Minor Cold'],
  ['大寒', 'Dàhán', 'Major Cold'],
  ['立春', 'Lìchūn', 'Start of Spring'],
  ['雨水', 'Yǔshuǐ', 'Rain Water'],
  ['驚蟄', 'Jīngzhé', 'Awakening of Insects'],
];
const LUNAR_MONTHS = [
  '',
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
  'Eleventh',
  'Twelfth',
];

const stemElement = (s: number) => STEMS[s][2];
const stemYang = (s: number) => s % 2 === 0;
// One of the sixty stem-and-branch pairs
interface Pillar {
  index: number;
  stem: number;
  branch: number;
}
interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  sun: number;
}

const pillar = (i: number): Pillar => ({
  index: ((i % 60) + 60) % 60,
  stem: ((i % 10) + 10) % 10,
  branch: ((i % 12) + 12) % 12,
});
const fromStemBranch = (s: number, b: number): Pillar => {
  for (let i = 0; i < 60; i++) if (i % 10 === s && i % 12 === b) return pillar(i);
  throw new Error(`no pillar pairs stem ${s} with branch ${b}`); // stems and branches of the same polarity always pair
};

// Ten Gods: how a stem relates to the Day Master
function tenGod(dm: number, s: number): [chinese: string, english: string] {
  const e0 = stemElement(dm),
    e = stemElement(s),
    same = stemYang(dm) === stemYang(s);
  if (e === e0) return same ? ['比肩', 'Friend'] : ['劫財', 'Rob Wealth'];
  if (e === (e0 + 1) % 5) return same ? ['食神', 'Eating God'] : ['傷官', 'Hurting Officer'];
  if (e === (e0 + 2) % 5) return same ? ['偏財', 'Indirect Wealth'] : ['正財', 'Direct Wealth'];
  if (e0 === (e + 2) % 5) return same ? ['七殺', 'Seven Killings'] : ['正官', 'Direct Officer'];
  return same ? ['偏印', 'Indirect Resource'] : ['正印', 'Direct Resource'];
}

// Julian Day Number of a civil date
function jdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12),
    yy = y + 4800 - a,
    mm = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045
  );
}

// Four Pillars for a moment, given the local civil date/time at the place.
// local = { y, m, d, hh, mm }; the day turns at local midnight.
function fourPillars(date: Date, local: { y: number; m: number; d: number; hh: number; mm?: number }): FourPillars {
  const sun = Core.lonOf('Sun', date);
  // year pillar turns at Lichun (Sun 315°)
  let y = local.y;
  if (local.m <= 2) {
    const lichun = Astronomy.SearchSunLongitude(315, new Date(Date.UTC(local.y, 0, 25)), 30);
    if (lichun && date < lichun.date) y -= 1;
  }
  const year = pillar(y - 4);
  // month pillar from the solar terms: Tiger month starts at Lichun
  const m = Math.floor(norm(sun - 315) / 30);
  const tigerStem = ((year.stem % 5) * 2 + 2) % 10;
  const month = fromStemBranch((tigerStem + m) % 10, (m + 2) % 12);
  const day = pillar(jdn(local.y, local.m, local.d) + 49);
  const hb = Math.floor((local.hh + 1) / 2) % 12;
  const ratStem = ((day.stem % 5) * 2) % 10;
  const hour = fromStemBranch((ratStem + hb) % 10, hb);
  return { year, month, day, hour, sun };
}

function elementCount(p: FourPillars): number[] {
  const c = [0, 0, 0, 0, 0];
  [p.year, p.month, p.day, p.hour].forEach((x) => {
    c[stemElement(x.stem)]++;
    c[BRANCHES[x.branch][3]]++;
  });
  return c;
}

// Solar term in force and the next one
function solarTerms(date: Date) {
  const sun = Core.lonOf('Sun', date);
  const i = Math.floor(norm(sun) / 15);
  const startT = Astronomy.SearchSunLongitude(i * 15, new Date(date.getTime() - 17 * DAY), 20);
  const nextT = Astronomy.SearchSunLongitude(((i + 1) % 24) * 15, date, 20);
  return { current: { i, at: startT && startT.date }, next: { i: (i + 1) % 24, at: nextT && nextT.date } };
}

// ---------- Chinese lunar calendar (China Standard Time, UTC+8) ----------
const cstDay = (date: Date) => Math.floor((date.getTime() + 8 * 3600000) / DAY);
const dayToDate = (n: number) => new Date(n * DAY - 8 * 3600000); // CST midnight of day n
interface LunarMonth {
  start: number;
  end: number;
  num: number;
  leap: boolean;
} // start and end as CST day numbers
const dayCache = new Map<string, number>();
const monthCache = new Map<number, LunarMonth[]>();

function newMoonDays(fromDay: number, toDay: number) {
  const out: number[] = [];
  let t = Astronomy.MakeTime(dayToDate(fromDay - 1));
  for (let k = 0; k < 20; k++) {
    const nm = Astronomy.SearchMoonPhase(0, t, 40);
    if (!nm) break;
    const d = cstDay(nm.date);
    if (d > toDay) break;
    if (d >= fromDay) out.push(d);
    t = nm.AddDays(1);
  }
  return out;
}
function solsticeDay(y: number): number {
  const k = 'ws' + y;
  if (!dayCache.has(k))
    dayCache.set(k, cstDay(Astronomy.SearchSunLongitude(270, new Date(Date.UTC(y, 11, 15)), 15)!.date));
  return dayCache.get(k)!;
}
function month11Start(y: number): number {
  const k = 'm11' + y;
  if (!dayCache.has(k)) {
    const s = solsticeDay(y);
    const nms = newMoonDays(s - 31, s);
    dayCache.set(k, nms[nms.length - 1]);
  }
  return dayCache.get(k)!;
}
// Months from the 11th month of year y to the 11th month of year y+1
function lunarYearMonths(y: number): LunarMonth[] {
  const cached = monthCache.get(y);
  if (cached) return cached;
  const a = month11Start(y),
    b = month11Start(y + 1);
  const starts = newMoonDays(a, b - 1);
  const leapYear = starts.length === 13;
  const sunAt = (day: number) => Core.lonOf('Sun', dayToDate(day));
  const hasZhongqi = (i: number) =>
    Math.floor(sunAt(starts[i]) / 30) !== Math.floor(sunAt(i + 1 < starts.length ? starts[i + 1] : b) / 30);
  const months: LunarMonth[] = [];
  let num = 11,
    leapDone = false;
  starts.forEach((s, i) => {
    let leap = false;
    if (i > 0) {
      if (leapYear && !leapDone && !hasZhongqi(i)) {
        leap = true;
        leapDone = true;
      } else num = (num % 12) + 1;
    }
    months.push({ start: s, end: i + 1 < starts.length ? starts[i + 1] : b, num, leap });
  });
  monthCache.set(y, months);
  return months;
}
// the first month of a lunar year: Chinese New Year
const firstMonth = (y: number) => lunarYearMonths(y - 1).find((m) => m.num === 1 && !m.leap)!;

function lunarDate(date: Date) {
  const d = cstDay(date);
  const gy = new Date(date.getTime() + 8 * 3600000).getUTCFullYear();
  const y = d >= month11Start(gy) ? gy : gy - 1;
  const mo = lunarYearMonths(y).find((m) => d >= m.start && d < m.end)!;
  // zodiac (lunar) year: Chinese New Year is the start of month 1
  const cnyOf = (yy: number) => firstMonth(yy).start;
  const lunarYear = d >= cnyOf(gy) ? gy : gy - 1;
  return {
    year: lunarYear,
    month: mo.num,
    leap: mo.leap,
    day: d - mo.start + 1,
    monthLength: mo.end - mo.start,
    newYear: dayToDate(cnyOf(lunarYear)),
  };
}
function chineseNewYear(y: number) {
  return dayToDate(firstMonth(y).start);
}

export type { Pillar, FourPillars, LunarMonth };
export {
  STEMS,
  BRANCHES,
  ELEMENTS,
  ELEMENT_ZH,
  TERMS,
  LUNAR_MONTHS,
  fourPillars,
  elementCount,
  tenGod,
  solarTerms,
  lunarDate,
  chineseNewYear,
  pillar,
  jdn,
};

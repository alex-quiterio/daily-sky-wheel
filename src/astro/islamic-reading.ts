// Islamic reading, kept factual: the day's occasions and what is commonly recommended on them, the month's standing,
// the next occasion, and the Moon's lunar mansion, which is pre-Islamic Arab sky-lore and labelled as heritage.
// It reports widely held practice and says where practice differs; it gives no rulings.
import type { Reading, ReadingItem, ReadingSection } from './reading.ts';
import * as Islamic from './islamic.ts';

type HijriDate = ReturnType<typeof Islamic.hijriDate>;

// what is commonly done on each occasion: [recommended, not done that day]
const OBSERVED: Record<string, [does: string, not?: string]> = {
  'Islamic New Year': ['no rite of its own; many mark it with reflection on the Hijra'],
  Ashura: ['fasting, often together with the 9th or the 11th; for Shia Muslims, mourning for Husayn'],
  'Mawlid an-Nabi': [
    'gatherings and poetry in honour of the Prophet’s birth, where it is observed; not all Muslims mark it',
  ],
  "Isra' and Mi'raj": ['remembering the Night Journey; practice varies, and many hold no special observance'],
  "Laylat al-Bara'ah": ['night prayer and seeking forgiveness, where it is observed; practice varies'],
  'Ramadan begins': [
    'fasting from dawn (Fajr) to sunset (Maghrib), the night prayer of Tarawih, and reading the Quran',
  ],
  'Laylat al-Qadr': [
    'night prayer, reading the Quran and supplication; it is sought in the odd nights of the last ten',
  ],
  'Eid al-Fitr': ['the Eid prayer in the morning, Zakat al-Fitr given before it, and visiting family', 'fasting'],
  'Hajj begins': ['for pilgrims, the move to Mina; for others, the good deeds of the first ten days'],
  'Day of Arafah': ['fasting for those not on Hajj, and supplication through the day'],
  'Eid al-Adha': ['the Eid prayer, the sacrifice (udhiyah) shared with family and the poor, and the takbir', 'fasting'],
};

// months with a standing of their own
const MONTH_NOTE: Record<number, string> = {
  1: 'One of the four sacred months, in which fighting was forbidden. Voluntary fasting is recommended, above all around Ashura.',
  7: 'One of the four sacred months.',
  8: 'The month before Ramadan, in which the Prophet is reported to have fasted more than in any other.',
  9: 'The month of fasting, from dawn to sunset every day, and of the Quran’s first revelation.',
  10: 'The month after Ramadan. Six days of fasting in Shawwal are a widely followed sunnah.',
  11: 'One of the four sacred months.',
  12: 'One of the four sacred months, and the month of the Hajj. Its first ten days are held to be the best days of the year for good deeds.',
};

const list = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);

// Returns { summary, advice: { good, care }, sections, text }, like the other readings.
// `moonLon` is the Moon's tropical longitude, for the lunar mansion.
function read(h: HijriDate, moonLon: number, afterMaghrib: boolean): Reading {
  const [month, monthAr] = Islamic.MONTHS[h.month - 1];
  const [weekday] = Islamic.WEEKDAYS[h.weekday];
  const english = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.weekday];
  const sections: ReadingSection[] = [];
  const add = (title: string, items: ReadingItem[]) => {
    if (items.length) sections.push({ title, items });
  };
  const does: string[] = [],
    not: string[] = [];

  // ---- today
  const today: ReadingItem[] = [];
  for (const [m, d, name, note] of Islamic.OCCASIONS)
    if (m === h.month && d === h.day) {
      const [rec, avoid] = OBSERVED[name] ?? [''];
      today.push({
        head: name,
        text: `${note ? `${note.charAt(0).toUpperCase()}${note.slice(1)}. ` : ''}${rec ? `Commonly: ${rec}.` : ''}`,
      });
      if (rec) does.push(rec.split(';')[0]);
      if (avoid) not.push(`${avoid}: it is Eid`);
    }
  if (h.month === 9) {
    today.push({ head: `Ramadan, day ${h.day}`, text: 'Fasting from dawn to sunset, the night prayer, and charity.' });
    does.push('the fast, from Fajr to Maghrib');
    if (h.day >= 21)
      today.push({
        head: 'Last ten nights of Ramadan',
        text: 'The nights in which Laylat al-Qadr is sought, above all the odd ones; many spend them in prayer, some in retreat (i‘tikaf) at the mosque.',
      });
  }
  if (h.month === 12 && h.day >= 11 && h.day <= 13) {
    today.push({
      head: 'Ayyam al-Tashriq',
      text: 'The three days after Eid al-Adha: days of eating, drinking and remembering God, with the takbir after each prayer.',
    });
    not.push('fasting: these are the days of Tashriq');
  }
  if (h.month === 12 && h.day <= 9)
    today.push({
      head: 'The first ten days of Dhu al-Hijjah',
      text: 'Good deeds, remembrance and the takbir are encouraged; many fast the first nine days.',
    });
  if (h.day >= 13 && h.day <= 15 && !(h.month === 12 && h.day === 13)) {
    today.push({
      head: 'Ayyam al-Bid',
      text: 'The white days, when the Moon is full: voluntary fasting on the 13th, 14th and 15th is a sunnah.',
    });
    if (h.month !== 9) does.push('voluntary fasting (the white days)');
  }
  if (h.weekday === 5) {
    today.push({
      head: "Jumu'ah",
      text: 'The Friday congregational prayer replaces Dhuhr for those who attend. Commonly recommended: washing (ghusl) beforehand, reading Surat al-Kahf, and many blessings on the Prophet.',
    });
    does.push("the Jumu'ah prayer");
  }
  if ((h.weekday === 1 || h.weekday === 4) && h.month !== 9 && !not.length) {
    today.push({
      head: `${english} fast`,
      text: 'One of the two days of the week on which voluntary fasting is a sunnah.',
    });
    does.push('voluntary fasting (Monday and Thursday)');
  }
  if (!today.length)
    today.push({
      head: 'An ordinary day',
      text: 'No occasion falls today; the five daily prayers keep their usual times.',
    });
  add('Today', today);

  // ---- the month
  const mNote = MONTH_NOTE[h.month];
  add('The month', [
    {
      head: `${month} ${monthAr}`,
      text: `${mNote ? `${mNote} ` : ''}Day ${h.day} of ${h.length}. Months begin with the new crescent; this count follows the Umm al-Qura rule at Mecca, so a local sighting can differ by a day.`,
    },
  ]);

  // ---- what comes next
  const [next] = Islamic.upcoming(h.dayNum + 1, 1);
  if (next)
    add('Next', [
      {
        head: next.name,
        text: `${next.day} ${Islamic.MONTHS[next.month - 1][0]}, in ${next.inDays + 1} day${next.inDays ? 's' : ''}${next.note ? ` (${next.note})` : ''}, beginning at sunset the evening before.`,
      },
    ]);

  // ---- the lunar mansion, as heritage
  const mi = Islamic.manzil(moonLon);
  const [mName, mMeaning] = Islamic.MANAZIL[mi];
  add('Heritage', [
    {
      head: `Lunar mansion: ${mName}`,
      text: `The Moon is in the ${mi + 1}${['st', 'nd', 'rd'][mi] ?? 'th'} of the 28 mansions, ${mName} (“${mMeaning}”). The mansions come from pre-Islamic Arab sky-lore and later Arabic astronomy, where they marked the seasons and the rains. They are heritage, not religious practice.`,
    },
  ]);

  const sum = [
    `${english} (${weekday}), ${h.day} ${month} ${h.year} AH${afterMaghrib ? ', begun at Maghrib' : ''}.`,
    today[0].head === 'An ordinary day' ? 'No occasion falls today.' : `Today: ${list(today.map((t) => t.head))}.`,
  ];
  if (next) sum.push(`Next: ${next.name}, in ${next.inDays + 1} day${next.inDays ? 's' : ''}.`);
  const summary = sum.join(' ');

  const advice = { good: [...new Set(does)], care: [...new Set(not)] };
  const text = [
    summary,
    '',
    ...(advice.good.length ? [`Recommended today: ${advice.good.join('; ')}.`] : []),
    ...(advice.care.length ? [`Not done today: ${advice.care.join('; ')}.`] : []),
    '',
  ]
    .concat(
      sections.flatMap((s) =>
        [s.title.toUpperCase()].concat(
          s.items.map((i) => `- ${i.head}: ${i.text}`),
          [''],
        ),
      ),
    )
    .join('\n')
    .trim();
  return { summary, advice, sections, text };
}

export { read };

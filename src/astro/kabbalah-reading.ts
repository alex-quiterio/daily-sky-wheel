// Kabbalah reading: the day's sefira, the month's letter and sense from Sefer Yetzirah, the Omer pair when it is
// counted, and what today's or the next holy day asks for. The Hebrew day begins at sunset; the date passed in
// already accounts for that.
import type { Reading, ReadingItem, ReadingSection } from './reading.ts';
import * as Hebrew from './hebrew.ts';

// the seven lower sefirot by day (Sunday = Chesed ... Shabbat = Malkhut): [what the day is good for, what to watch]
const DAY_WORK: Record<number, [good: string, care: string]> = {
  3: ['generosity, hospitality and starting with kindness', 'giving past the point where it helps'],
  4: ['boundaries, discipline and an honest no', 'harshness and quick judgment'],
  5: ['truth told with compassion, and making peace', 'smoothing over what needs saying'],
  6: ['persistence and taking the initiative', 'winning at any cost'],
  7: ['gratitude, acknowledging others, and prayer', 'making yourself small'],
  8: ['connection, keeping faith, and preparing for Shabbat', 'scattering your energy'],
  9: ['rest, presence and receiving', 'work, travel and business: it is Shabbat'],
};

// what each month's sense (Sefer Yetzirah 5) asks
const SENSE: Record<string, string> = {
  Speech: 'words that set free, in the month of the Exodus, when the story is told aloud',
  Thought: 'refining thought and character day by day, in the month of counting the Omer',
  Walking: 'walking on with what was received, in the month the Torah was given',
  Sight: 'seeing truly, including what is broken',
  Hearing: 'listening, in the month of mourning and of the comfort that follows',
  Action: 'putting things right in deed, not only in thought, before the new year',
  Touch: 'closeness, in the month of the High Holy Days and the embrace of the sukkah',
  Smell: 'the subtlest sense, in a quiet month without festivals',
  Sleep: 'rest and dreams, and the trust it takes to let go',
  Anger: 'turning anger into resolve',
  Taste: 'discernment, and the first fruit of the trees',
  Laughter: 'joy that turns things upside down',
};

// what each holy day asks for
const ASKS: Record<string, string> = {
  'Rosh Hashanah': 'hearing the shofar, and crowning the year anew: the start of ten days of return (teshuvah)',
  'Yom Kippur': 'fasting, asking and granting forgiveness, and returning to the source',
  Sukkot: 'dwelling in the sukkah, welcoming guests, and joy in what does not last',
  'Hoshana Rabbah': 'the willow beaten on the ground: the last sealing of the judgment begun at Rosh Hashanah',
  'Shemini Atzeret': 'staying one more day: the closeness that remains when the festival ends',
  'Simchat Torah (diaspora)': 'dancing with the Torah as its reading ends and begins again',
  Chanukah: 'adding a light each night: dedication, and light that grows in the dark',
  'Tu BiShvat': 'eating fruit and blessing the trees: the new year of the trees',
  Purim: 'reading the Megillah, gifts to the poor, food to friends, and joy: the hidden made plain',
  'Shushan Purim': 'Purim in walled cities: the joy carried one day further',
  Pesach: 'clearing out the chametz, telling the story, and going out to freedom',
  'Lag BaOmer · hillula of Rabbi Shimon bar Yochai': 'bonfires and celebration for the inner light of the Zohar',
  Shavuot: 'staying up to learn: receiving the Torah anew',
  "Tu B'Av": 'love and matches: a day of joy after the mourning of Av',
  'Rosh Chodesh': 'renewal with the new moon: a small festival, and a day to begin again',
  "Tisha B'Av": 'fasting and mourning for what was destroyed, and the hope that follows',
};

const list = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const sefira = (i: number) => Hebrew.SEFIROT[i][1];

// the next holy days after today, within `days`, Rosh Chodesh aside
// (a holy day already under way today is not "next")
function nextHoly(h: Hebrew.HebrewDate, days = 120) {
  let ongoing = Hebrew.holidays(h);
  for (let k = 1; k <= days; k++) {
    const date = Hebrew.hebrewFromFixed(h.rd + k);
    const all = Hebrew.holidays(date);
    const found = all.filter((x) => x !== 'Rosh Chodesh' && !ongoing.includes(x));
    ongoing = ongoing.filter((x) => all.includes(x));
    if (found.length) return { k, names: found };
  }
  return null;
}

// Returns { summary, advice: { good, care }, sections, text }, like the other readings.
function read(h: Hebrew.HebrewDate): Reading {
  const sections: ReadingSection[] = [];
  const add = (title: string, items: ReadingItem[]) => {
    if (items.length) sections.push({ title, items });
  };
  const dayIdx = Hebrew.DAY_SEFIRA[h.dow];
  const [dayHe, dayTr, dayEn, dayDesc] = Hebrew.SEFIROT[dayIdx];
  const [good, care] = DAY_WORK[dayIdx];
  const omer = Hebrew.omer(h);

  // ---- the day
  add('The day', [
    {
      ref: `kb-sefira:${dayIdx}`,
      head: `${Hebrew.DAY_NAMES[h.dow]} · ${dayTr} ${dayHe}`,
      text: `Each day of the week reflects one of the seven lower sefirot, and today’s is ${dayTr} (${dayEn.toLowerCase()}): ${dayDesc.charAt(0).toLowerCase()}${dayDesc.slice(1)}`,
    },
  ]);

  // ---- the month
  const [letter, letterName, sign, tribe, sense] = Hebrew.monthKabbalah(h.month);
  add('The month', [
    {
      head: `${h.monthName} · ${letterName} ${letter}`,
      text: `In Sefer Yetzirah each month has a letter, a sign, a tribe and a sense. ${h.monthName} has ${letterName}, ${sign} and the tribe of ${tribe}, and its sense is ${sense.toLowerCase()}: ${SENSE[sense]}.`,
    },
  ]);

  // ---- the Omer
  if (omer) {
    const inner = sefira(omer.inner),
      outer = sefira(omer.outer);
    const weeks = omer.weeks
      ? `${omer.weeks} week${omer.weeks > 1 ? 's' : ''}${omer.rest < 7 ? ` and ${omer.rest} day${omer.rest > 1 ? 's' : ''}` : ''}`
      : '';
    add('The Omer', [
      {
        ref: `kb-sefira:${omer.inner}`,
        head: `Day ${omer.day} · ${inner} she-be-${outer}`,
        text: `Today is ${omer.day} day${omer.day > 1 ? 's' : ''}${weeks && omer.day >= 7 ? `, which is ${weeks},` : ''} of the Omer. Each week of the count works on one sefira and each day on one facet of it: today, ${inner} within ${outer}.`,
      },
    ]);
  }

  // ---- holy days
  const today = Hebrew.holidays(h);
  const holy: ReadingItem[] = today.map((name) => ({
    head: name,
    text: `Today. It asks for ${ASKS[name] ?? 'its own observance'}.`,
  }));
  const next = nextHoly(h);
  if (next)
    holy.push({
      head: `Next: ${list(next.names)}`,
      text: `In ${next.k} day${next.k > 1 ? 's' : ''}, from the evening before. ${next.names.map((n) => `${n.split(' · ')[0]} asks for ${ASKS[n] ?? 'its own observance'}.`).join(' ')}`,
    });
  add('Holy days', holy);

  const goodList = [good],
    careList = [care];
  if (today.includes('Yom Kippur') || today.includes("Tisha B'Av")) careList.unshift('food and drink: a fast day');

  const sum = [
    `${Hebrew.DAY_NAMES[h.dow]}, ${h.day} ${h.monthName} ${h.year}, a day of ${dayTr} (${dayEn.toLowerCase()}).`,
    `The month’s letter is ${letterName} and its sense is ${sense.toLowerCase()}.`,
  ];
  if (omer) sum.push(`Day ${omer.day} of the Omer: ${sefira(omer.inner)} she-be-${sefira(omer.outer)}.`);
  if (today.length) sum.push(`Today: ${list(today)}.`);
  else if (next) sum.push(`${list(next.names)} in ${next.k} day${next.k > 1 ? 's' : ''}.`);
  const summary = sum.join(' ');

  const advice = { good: goodList, care: careList };
  const text = [summary, '', `Good for: ${advice.good.join('; ')}.`, `Go easy on: ${advice.care.join('; ')}.`, '']
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

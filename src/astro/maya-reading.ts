// Maya reading: the day sign with its number, the trecena's theme, and the year bearer. Short, as the tradition is:
// a daykeeper reads the day's name and number, the thirteen-day run it belongs to, and the sign carrying the year.
// The sign and number meanings follow present-day K'iche' daykeeping, which differs from one teacher to the next.
import type { Reading, ReadingItem, ReadingSection } from './reading.ts';
import * as Maya from './maya.ts';

type MayaDate = ReturnType<typeof Maya.mayaDate>;

// what the day is good for, and what to go easy on, by day sign
const SIGN_DAY: [good: string, care: string][] = [
  ['asking for help, beginnings, home and nourishment', 'neglecting the basics'],
  ['speaking, writing and clearing the air', 'harsh words and rash changes'],
  ['rest, dreams, and tending the house', 'forcing what is still hidden'],
  ['planting, saving and patient work', 'expecting the harvest today'],
  ['physical work, desire and action', 'anger and acting on impulse'],
  ['remembering the ancestors and letting things end', 'clinging to what is over'],
  ['healing, craft and helping others', 'overwork'],
  ['beauty, abundance and enjoying what has ripened', 'excess'],
  ['offerings, gratitude and making amends', 'holding on to resentment'],
  ['friendship, loyalty and asking forgiveness', 'quarrels between friends'],
  ['art, play and weaving things together', 'scattering your attention'],
  ['setting out, community and agreements', 'taking the road alone'],
  ['the household, order and authority', 'rigidity'],
  ['ceremony, nature and listening to intuition', 'ignoring the body'],
  ['vision, ambition and looking far ahead', 'losing touch with the ground'],
  ['reflection, forgiveness and asking advice', 'judging too quickly'],
  ['thinking, study and noticing coincidences', 'overthinking'],
  ['clear decisions, truth-telling and cutting ties', 'cutting what could be mended'],
  ['family, renewal and clearing out', 'stirring up storms'],
  ['completion, gratitude and gathering together', 'self-importance'],
];

// the thirteen numbers: 1–5 gentle, 6–9 balanced, 10–13 strong
const NUMBER: string[] = [
  'unity and the seed of a beginning',
  'duality: a pairing, or a choice between two',
  'movement and the first action',
  'stability, the four directions, a firm base',
  'the hand and the centre: empowerment',
  'flow and balance between forces',
  'the middle of the run: reflection, a mirror',
  'harmony and integrity, a day of ceremony',
  'patience and the long count of life',
  'form taking shape: what was planned appears',
  'release and resolution: loosening knots',
  'understanding gathered from experience',
  'culmination: the run complete, at full force',
];
const intensity = (n: number) => (n <= 5 ? 'gentle' : n <= 9 ? 'balanced' : 'strong');

// the four signs that carry the year in this count, and what a year under each tends to bring
const BEARER: Record<string, string> = {
  "Ik'": 'a year of wind: news, change and things said aloud',
  "Manik'": 'a year of the deer: work, service and providing for others',
  "Eb'": 'a year of the road: travel, community and shared fortune',
  "Kab'an": 'a year of the earth: movement, thought and unexpected connection',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Returns { summary, advice: { good, care }, sections, text }, like the other readings.
function read(r: MayaDate): Reading {
  const [name, english, meaning] = Maya.SIGNS[r.tz.sign];
  const n = r.tz.number;
  const [dir, colour] = r.direction;
  const [tName, tEnglish, tMeaning] = Maya.SIGNS[r.trecena];
  const [bName, bEnglish] = Maya.SIGNS[r.bearer.sign];
  const sections: ReadingSection[] = [];
  const add = (title: string, items: ReadingItem[]) => sections.push({ title, items });

  add('The day', [
    {
      ref: `my-sign:${r.tz.sign}`,
      head: `${n} ${name} · ${english}`,
      text: `${meaning} A day of the ${dir.toLowerCase()} and the colour ${colour.toLowerCase()}.`,
    },
    {
      head: `The number ${n}`,
      text: `${cap(NUMBER[n - 1])}. A ${intensity(n)} number, so the day’s energy is ${n <= 5 ? 'soft and still gathering' : n <= 9 ? 'even and workable' : 'at full strength, for good or ill'}.`,
    },
  ]);

  const stage = n <= 4 ? 'the opening' : n <= 9 ? 'the middle' : 'the close';
  add('The trecena', [
    {
      ref: `my-sign:${r.trecena}`,
      head: `1 ${tName} · ${tEnglish}`,
      text: `These thirteen days began on 1 ${tName}, which sets their theme: ${tMeaning.charAt(0).toLowerCase()}${tMeaning.slice(1)} Today is day ${n}, ${stage} of the run.`,
    },
  ]);

  const wayeb = r.hb.month === 18;
  const year: ReadingItem[] = [
    {
      ref: `my-sign:${r.bearer.sign}`,
      head: `${r.bearer.number} ${bName} carries the year`,
      text: `The year bearer is the day that opened this Haab' year, and its sign colours all 365 days: ${BEARER[bName] ?? `a year of ${bEnglish.toLowerCase()}`}. ${r.daysToNewYear} days until the next one takes over.`,
    },
  ];
  if (wayeb)
    year.push({
      head: "Wayeb'",
      text: 'The five nameless days at the end of the year, when the bearers change hands. Traditionally a time to stay close to home, finish rather than begin, and keep things quiet.',
    });
  add('The year', year);

  const [good, care] = SIGN_DAY[r.tz.sign];
  const advice = {
    good: [good],
    care: wayeb ? ["new beginnings, during Wayeb'", care] : [care],
  };
  const summary = `${n} ${name}, a ${intensity(n)} ${english} day, on day ${n} of the trecena of ${tName} (${tEnglish.toLowerCase()}), in a year carried by ${r.bearer.number} ${bName}.${wayeb ? " These are the nameless days of Wayeb'." : ''}`;
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

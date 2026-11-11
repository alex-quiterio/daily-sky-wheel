// A plain-language Jyotish reading: the Panchang of the day, the Lagna and the Moon, classical yogas,
// then every graha and every house in turn. Needs Vedic. Pure: takes what the Vedic tab already worked out.
import * as Vedic from './vedic.ts';
import type { Reading, ReadingItem, ReadingSection } from './reading.ts';

const norm = (x: number) => ((x % 360) + 360) % 360;
const LORD = [
  'Mars',
  'Venus',
  'Mercury',
  'Moon',
  'Sun',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Saturn',
  'Jupiter',
];

// What each graha signifies (its karakatva)
const KARAKA: Record<string, string> = {
  Sun: 'the soul, the father, authority and vitality',
  Moon: 'the mind, the mother, feeling and the public',
  Mars: 'energy, courage, siblings and land',
  Mercury: 'intellect, speech, trade and learning',
  Jupiter: 'wisdom, teachers, children and good fortune',
  Venus: 'love, marriage, art and comfort',
  Saturn: 'discipline, labour, time and endurance',
  Rahu: 'ambition, obsession, foreign and unconventional things',
  Ketu: 'detachment, old skills, loss and liberation',
};
const BENEFIC = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
// [Sanskrit name, what the house covers]
const BHAVA: [sanskrit: string, covers: string][] = [
  ['Tanu', 'the body, the self and vitality'],
  ['Dhana', 'wealth, family, speech and food'],
  ['Sahaja', 'courage, siblings, effort and short journeys'],
  ['Sukha', 'the mother, home, comfort and peace of mind'],
  ['Putra', 'children, intelligence, creativity and past merit'],
  ['Ari', 'enemies, illness, debts and service'],
  ['Yuvati', 'marriage, partners and trade'],
  ['Randhra', 'longevity, sudden change, hidden things and inheritance'],
  ['Dharma', 'fortune, the father, teachers and long journeys'],
  ['Karma', 'career, action and standing'],
  ['Labha', 'gains, friends and wishes fulfilled'],
  ['Vyaya', 'loss, expense, foreign lands, sleep and liberation'],
];
const houseKind = (h: number) =>
  [
    [1, 4, 7, 10].includes(h) ? 'kendra (angle: strong and visible)' : '',
    [1, 5, 9].includes(h) ? 'trikona (trine: fortunate)' : '',
    [6, 8, 12].includes(h) ? 'dusthana (difficult)' : '',
    [3, 6, 10, 11].includes(h) ? 'upachaya (improves with time)' : '',
    [2, 7].includes(h) ? 'maraka' : '',
  ]
    .filter(Boolean)
    .join(', ') || 'neutral';
const RASHI_STYLE = [
  'pioneering, quick and combative',
  'steady, sensual and patient',
  'curious, verbal and quick-witted',
  'protective, feeling and attached to home',
  'proud, warm and commanding',
  'exact, practical and service-minded',
  'diplomatic, sociable and drawn to balance',
  'intense, secretive and tenacious',
  'principled, frank and far-ranging',
  'ambitious, disciplined and cautious',
  'reforming, detached and communal',
  'devotional, imaginative and yielding',
];

// ---- the five limbs
// tithi groups by number within the fortnight: [name, meaning, good for]
const TITHI_GROUP: [name: string, meaning: string, goodFor: string][] = [
  ['Nanda', 'joy', 'celebrations, building and beginnings'],
  ['Bhadra', 'well-being', 'steady work, health and travel plans'],
  ['Jaya', 'victory', 'contests and getting past obstacles'],
  ['Rikta', 'empty hands', 'clearing out, cutting ties and ending things'],
  ['Purna', 'fullness', 'completing things and all good works'],
];
const VARA_FOR = [
  'authority, health and dealings with elders',
  'home, travel, care and the public',
  'effort, courage, competition and repairs',
  'study, trade, writing and accounts',
  'teaching, ceremonies, advice and beginnings',
  'love, art, comfort and beautiful things',
  'discipline, service and long, patient work',
];
// nature of each nakshatra, by index: [name, meaning, good for]
const NATURE: Record<string, [name: string, meaning: string, goodFor: string]> = {
  D: ['Dhruva', 'fixed', 'foundations, planting and lasting commitments'],
  C: ['Chara', 'movable', 'travel, vehicles and making changes'],
  U: ['Ugra', 'fierce', 'confrontation, demolition and hard tasks'],
  X: ['Mishra', 'mixed', 'routine work and fire rites'],
  K: ['Kshipra', 'swift', 'trade, healing, learning and quick tasks'],
  M: ['Mridu', 'soft', 'art, friendship, romance and new clothes'],
  T: ['Tikshna', 'sharp', 'cutting, separating and facing hard truths'],
};
const NAK_NATURE = 'KUXDMTCKTUUDKMCXMTTUDCCCUDM';
const NAK_GANA = 'DMRMDMDDRRMMDRDRDRRMMDRRMMD'; // Deva, Manushya, Rakshasa
const GANA: Record<string, string> = {
  D: 'Deva (gentle, divine)',
  M: 'Manushya (human, mixed)',
  R: 'Rakshasa (fierce, independent)',
};
const YOGA_MEANING = [
  'obstacle',
  'affection',
  'long life',
  'good fortune',
  'splendour',
  'great danger',
  'good deeds',
  'steadiness',
  'the spear',
  'the knot',
  'growth',
  'the constant',
  'a blow',
  'delight',
  'the thunderbolt',
  'accomplishment',
  'calamity',
  'comfort',
  'the barrier',
  'the auspicious',
  'the accomplished',
  'the achievable',
  'the fortunate',
  'the bright',
  'sacred knowledge',
  'the chief',
  'discord',
];
const YOGA_BAD = [0, 5, 8, 9, 12, 14, 16, 18, 26];
const KARANA_FOR: Record<string, string | null> = {
  Bava: 'starting and steady work',
  Balava: 'study and rites',
  Kaulava: 'friendship and agreements',
  Taitila: 'home and building',
  Gara: 'farming and household work',
  Vanija: 'trade and selling',
  Vishti: null,
};
// combustion: degrees from the Sun within which a graha is hidden in its light
const COMBUST: Record<string, number> = { Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
// graha drishti: signs ahead that each graha aspects (the 7th is +6)
const DRISHTI: Record<string, number[]> = { Mars: [3, 6, 7], Jupiter: [4, 6, 8], Saturn: [2, 6, 9] };
const MAHAPURUSHA: Record<string, string> = {
  Mars: 'Ruchaka',
  Mercury: 'Bhadra',
  Jupiter: 'Hamsa',
  Venus: 'Malavya',
  Saturn: 'Shasha',
};

const list = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ord = (n: number) => n + (['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] || 'th');
const sep = (a: number, b: number) => {
  const d = Math.abs(norm(a - b));
  return d > 180 ? 360 - d : d;
};

// o: { p: Vedic.panchang(), g: Vedic.grahas(), lagna: sidereal longitude, vara: 0-6 (Sunday = 0),
//      dashas: Vedic.dashas(), rahuKaal: true while Rahu Kaal runs }
// Returns { summary, advice: { good, care }, sections: [{ title, items: [{ id, head, text, ref, more }] }], text }.
// more is a list of [label, value] rows: the deeper layer behind a line.
interface Sky {
  p: ReturnType<typeof Vedic.panchang>;
  g: ReturnType<typeof Vedic.grahas>;
  lagna: number; // sidereal longitude of the Ascendant
  vara: number; // weekday, Sunday = 0
  dashas?: Vedic.Dasha[];
  rahuKaal?: boolean; // true while Rahu Kaal runs
}

function read(o: Sky): Reading {
  const { p, g, lagna, vara, dashas } = o;
  const G = Object.fromEntries(g.list.map((x) => [x.key, x]));
  const skt = (k: string) => Vedic.GRAHAS.find((q) => q[0] === k)![1];
  const nm = (k: string) => (skt(k) === k ? k : `${skt(k)} (${k})`);
  const rashi = (s: number) => Vedic.RASHIS[s][1];
  const rashiEn = (s: number) => `${Vedic.RASHIS[s][1]} (${Vedic.RASHIS[s][0]})`;
  const lagnaSign = Math.floor(lagna / 30);
  const house = (sign: number) => ((sign - lagnaSign + 12) % 12) + 1;
  const nakName = (i: number) => Vedic.NAKSHATRAS[i][0];
  const navamsa = (sid: number) => Math.floor(sid / (30 / 9)) % 12;
  const aspectsOf = (k: string) => (DRISHTI[k] || [6]).map((d) => (G[k].sign + d) % 12);
  const aspecting = (sign: number, except?: string) =>
    g.list.filter((x) => x.key !== except && aspectsOf(x.key).includes(sign)).map((x) => x.key);
  const inSign = (sign: number, except?: string) =>
    g.list.filter((x) => x.sign === sign && x.key !== except).map((x) => x.key);
  const combust = (k: string) =>
    k in COMBUST && sep(G[k].sid, G.Sun.sid) < COMBUST[k] - (G[k].retro && (k === 'Mercury' || k === 'Venus') ? 2 : 0);
  const where = (k: string) => `${rashi(G[k].sign)}, ${ord(house(G[k].sign))} house`;
  const sections: ReadingSection[] = [];
  const add = (title: string, items: ReadingItem[]) => {
    if (items.length) sections.push({ title, items });
  };
  const good: string[] = [],
    care: string[] = [];

  // ---------- the day: the five limbs of the Panchang
  const tn = p.tithi.n > 15 ? p.tithi.n - 15 : p.tithi.n; // 1..15 within the fortnight
  const waxing = p.tithi.paksha === 'Shukla';
  const grp = TITHI_GROUP[(tn - 1) % 5];
  const amavasya = p.tithi.name === 'Amavasya',
    purnima = p.tithi.name === 'Purnima';
  let tithiText = `${waxing ? 'The Moon is waxing, so what is begun now tends to grow' : 'The Moon is waning, which favours finishing, reducing and inner work'}. `;
  if (amavasya)
    tithiText +=
      'Amavasya, the dark Moon, is kept for the ancestors, rest and inward practice, and avoided for new ventures.';
  else if (purnima)
    tithiText += 'Purnima, the full Moon, is a day of fullness: worship, gatherings and completing things.';
  else
    tithiText += `A ${grp[0]} tithi (${grp[1]}), suited to ${grp[2]}${grp[0] === 'Rikta' ? ' and avoided for beginnings' : ''}.`;
  if (tn === 11) tithiText += ' Ekadashi is the fasting day sacred to Vishnu.';
  if (amavasya) care.push('starting ventures on the dark Moon');
  else if (grp[0] === 'Rikta') care.push('beginnings on a Rikta tithi');
  else good.push(grp[2]);

  const nat = NATURE[NAK_NATURE[p.nakshatra.i]];
  good.push(nat[2]);
  const yogaBad = YOGA_BAD.includes(p.yoga.n - 1);
  if (yogaBad) care.push(`important starts under ${p.yoga.name} yoga`);
  const vishti = p.karana.name === 'Vishti';
  const fixedKarana = KARANA_FOR[p.karana.name] === undefined;
  if (vishti) care.push('anything important during Vishti (Bhadra) karana');
  if (o.rahuKaal) care.push('new beginnings while Rahu Kaal runs');
  good.push(VARA_FOR[vara]);

  add('The day', [
    {
      id: 'tithi',
      head: `${p.tithi.paksha} ${p.tithi.name}`,
      text: tithiText,
      more: [
        ['Tithi', `${tn} of 15 in the ${waxing ? 'bright (Shukla)' : 'dark (Krishna)'} fortnight`],
        ['Group', amavasya || purnima ? 'Purna (fullness)' : `${grp[0]} (${grp[1]})`],
        ['What a tithi is', 'One thirtieth of the lunar month: the time the Moon takes to gain 12° on the Sun.'],
      ],
    },
    {
      id: 'vara',
      head: `${Vedic.VARAS[vara][0]}`,
      text: `The day of ${nm(Vedic.VARAS[vara][1])}, good for ${VARA_FOR[vara]}.`,
      ref: `vd-graha:${Vedic.VARAS[vara][1]}`,
      more: [
        ['Ruler', nm(Vedic.VARAS[vara][1])],
        ['Ruler sits in', where(Vedic.VARAS[vara][1])],
        ['The day turns', 'at sunrise, not at midnight'],
      ],
    },
    {
      id: 'nakshatra',
      head: `${p.nakshatra.name} nakshatra`,
      text: `${Vedic.NAKSHATRAS[p.nakshatra.i][2]} Its nature is ${nat[0]} (${nat[1]}), which suits ${nat[2]}.`,
      ref: `vd-nak:${p.nakshatra.i}`,
      more: [
        ['Pada', `${p.nakshatra.pada} of 4`],
        ['Ruler', nm(p.nakshatra.lord)],
        ['Deity', p.nakshatra.deity],
        ['Gana', GANA[NAK_GANA[p.nakshatra.i]]],
        ['Nature', `${nat[0]} (${nat[1]})`],
      ],
    },
    {
      id: 'yoga',
      head: `${p.yoga.name} yoga`,
      text: `"${cap(YOGA_MEANING[p.yoga.n - 1])}". ${yogaBad ? 'One of the nine yogas held to be inauspicious: important beginnings are put off.' : 'An auspicious yoga that supports what is undertaken.'}`,
      more: [
        ['Number', `${p.yoga.n} of 27`],
        ['What a yoga is', "The Sun's and Moon's longitudes added together, counted in 27 parts."],
      ],
    },
    {
      id: 'karana',
      head: `${p.karana.name} karana`,
      text: vishti
        ? 'Vishti, also called Bhadra, is the one moving karana avoided for anything important.'
        : fixedKarana
          ? 'One of the four fixed karanas that fall around the new Moon, suited to quiet, inward work.'
          : `A moving karana, good for ${KARANA_FOR[p.karana.name]}.`,
      more: [['What a karana is', "Half a tithi: 6° of the Moon's gain on the Sun. Sixty make a lunar month."]],
    },
  ]);

  // ---------- lagna, Moon and Sun
  const ll = LORD[lagnaSign],
    moon = G.Moon,
    sun = G.Sun;
  const moonNat = NATURE[NAK_NATURE[moon.nak.i]];
  const bright = norm(moon.sid - sun.sid);
  const moonStrength = bright > 72 && bright < 288 ? 'bright and strong' : 'dark and weak (close to the Sun)';
  add('Lagna, Moon and Sun', [
    {
      id: 'lagna',
      ref: `vd-rashi:${lagnaSign}`,
      head: `${rashiEn(lagnaSign)} lagna`,
      text: `The rising sign colours the whole chart: ${RASHI_STYLE[lagnaSign]}. Its lord ${nm(ll)} sits in ${where(ll)}, turning the chart towards ${BHAVA[house(G[ll].sign) - 1][1]}.`,
      more: [
        ['Degree', `${Math.floor(lagna % 30)}° ${rashi(lagnaSign)}`],
        ['Nakshatra', `${nakName(Vedic.nakshatraOf(lagna).i)}, pada ${Vedic.nakshatraOf(lagna).pada}`],
        ['Lagna lord', `${nm(ll)} in ${where(ll)}${G[ll].dignity ? `, ${G[ll].dignity.toLowerCase()}` : ''}`],
        ['Navamsa lagna', rashi(navamsa(lagna))],
      ],
    },
    {
      id: 'chandra',
      ref: 'vd-graha:Moon',
      head: `Chandra in ${rashiEn(moon.sign)}`,
      text: `The Moon is the mind. Here it is ${RASHI_STYLE[moon.sign]}, in the ${ord(house(moon.sign))} house of ${BHAVA[house(moon.sign) - 1][1]}. Its nakshatra, ${nakName(moon.nak.i)}: ${Vedic.NAKSHATRAS[moon.nak.i][2].toLowerCase()}`,
      more: [
        ['Nakshatra', `${nakName(moon.nak.i)}, pada ${moon.nak.pada}, ruled by ${nm(moon.nak.lord)}`],
        ['Gana', GANA[NAK_GANA[moon.nak.i]]],
        ['Nature', `${moonNat[0]} (${moonNat[1]})`],
        ['Light', `${Math.round(((1 - Math.cos((bright * Math.PI) / 180)) / 2) * 100)}% lit: ${moonStrength}`],
        ['Birth dasha', `${nm(moon.nak.lord)}, from the nakshatra's ruler`],
      ],
    },
    {
      id: 'surya',
      ref: 'vd-graha:Sun',
      head: `Surya in ${rashiEn(sun.sign)}`,
      text: `The Sun is the soul and the will. It is ${RASHI_STYLE[sun.sign]} here, lighting the ${ord(house(sun.sign))} house of ${BHAVA[house(sun.sign) - 1][1]}${sun.dignity ? `, and it is ${sun.dignity.toLowerCase()}` : ''}.`,
      more: [
        ['Nakshatra', `${nakName(sun.nak.i)}, pada ${sun.nak.pada}`],
        ['Sign lord', `${nm(LORD[sun.sign])} in ${where(LORD[sun.sign])}`],
      ],
    },
  ]);

  // ---------- yogas: classical combinations
  const yogas: ReadingItem[] = [];
  const yoga = (id: string, head: string, text: string, ref?: string) =>
    yogas.push({ id: `yoga-${id}`, head, text, ref });
  const kendraFrom = (a: number, b: number) => [0, 3, 6, 9].includes((a - b + 12) % 12);
  if (kendraFrom(G.Jupiter.sign, moon.sign))
    yoga(
      'gajakesari',
      'Gajakesari yoga',
      `Guru stands in an angle from the Moon (${rashi(G.Jupiter.sign)} from ${rashi(moon.sign)}): the elephant and the lion. Good sense, reputation and help arriving when needed.`,
      'vd-graha:Jupiter',
    );
  if (sun.sign === G.Mercury.sign)
    yoga(
      'budhaditya',
      'Budha-Aditya yoga',
      `Surya and Budha share ${rashi(sun.sign)}: a sharp, articulate intelligence${combust('Mercury') ? ", though Budha is combust here and speaks with the Sun's voice more than its own" : ''}.`,
      'vd-graha:Mercury',
    );
  if (moon.sign === G.Mars.sign)
    yoga(
      'chandramangala',
      'Chandra-Mangala yoga',
      `The Moon and Mars share ${rashi(moon.sign)}: drive in earning and enterprise, with a quick temper to watch.`,
      'vd-graha:Mars',
    );
  Object.entries(MAHAPURUSHA).forEach(([k, name]) => {
    if ((G[k].dignity === 'Own sign' || G[k].dignity === 'Exalted') && [1, 4, 7, 10].includes(house(G[k].sign)))
      yoga(
        name.toLowerCase(),
        `${name} yoga`,
        `One of the five Mahapurusha ("great person") yogas: ${nm(k)} is ${G[k].dignity.toLowerCase()} in an angle from the lagna, so ${KARAKA[k]} are unusually strong.`,
        `vd-graha:${k}`,
      );
  });
  if (G.Jupiter.sign === G.Rahu.sign)
    yoga(
      'guruchandala',
      'Guru-Chandala yoga',
      `Guru shares ${rashi(G.Rahu.sign)} with Rahu: belief and teaching are unsettled by doubt and unorthodox ideas, for better or worse.`,
      'vd-graha:Rahu',
    );
  ['Sun', 'Moon'].forEach((k) =>
    ['Rahu', 'Ketu'].forEach((n) => {
      if (G[k].sign === G[n].sign)
        yoga(
          `grahana-${k}-${n}`,
          `Grahana yoga · ${skt(k)} with ${n}`,
          `${nm(k)} shares ${rashi(G[k].sign)} with ${n}: an "eclipse" on ${k === 'Sun' ? 'confidence and the father' : 'peace of mind and the mother'}, which asks for extra care there.`,
          `vd-graha:${n}`,
        );
    }),
  );
  const side = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map(
    (k) => norm(G[k].sid - G.Rahu.sid) < 180,
  );
  if (side.every((x) => x) || side.every((x) => !x))
    yoga(
      'kalasarpa',
      'Kala Sarpa yoga',
      'All seven visible grahas sit on one side of the Rahu-Ketu axis: a fated, all-or-nothing quality, with the nodes pulling every matter their way.',
      'vd-graha:Rahu',
    );
  const near = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  if (
    !inSign(moon.sign, 'Moon').some((k) => near.includes(k)) &&
    ![1, 11].some((d) => inSign((moon.sign + d) % 12).some((k) => near.includes(k)))
  )
    yoga(
      'kemadruma',
      'Kemadruma yoga',
      'No graha keeps the Moon company in its own sign or the signs either side: the mind stands alone, and self-reliance has to be learned. Aspects to the Moon soften it.',
      'vd-graha:Moon',
    );
  for (let i = 0; i < near.length; i++)
    for (let j = i + 1; j < near.length; j++) {
      if (sep(G[near[i]].sid, G[near[j]].sid) < 1)
        yoga(
          `yuddha-${near[i]}-${near[j]}`,
          `Graha yuddha · ${skt(near[i])} and ${skt(near[j])}`,
          `${nm(near[i])} and ${nm(near[j])} are within a degree of each other: a planetary war, in which both are strained and the one further north is said to win.`,
          `vd-graha:${near[i]}`,
        );
    }
  const hidden = Object.keys(COMBUST).filter(combust);
  if (hidden.length)
    yoga(
      'asta',
      `Combust · ${hidden.map(skt).join(', ')}`,
      `${list(hidden.map(nm))} ${hidden.length > 1 ? 'are' : 'is'} too close to the Sun to be seen (asta): ${hidden.length > 1 ? 'their' : 'its'} matters work through the Sun's agenda and lose some independence.`,
      `vd-graha:${hidden[0]}`,
    );
  const vargottama = g.list.filter((x) => navamsa(x.sid) === x.sign).map((x) => x.key);
  if (vargottama.length)
    yoga(
      'vargottama',
      `Vargottama · ${vargottama.map(skt).join(', ')}`,
      `${list(vargottama.map(nm))} ${vargottama.length > 1 ? 'hold' : 'holds'} the same sign in the rashi and the navamsa chart, which makes ${vargottama.length > 1 ? 'them' : 'it'} steady and reliable.`,
      `vd-graha:${vargottama[0]}`,
    );
  add(
    'Yogas',
    yogas.length
      ? yogas
      : [
          {
            id: 'yoga-none',
            head: 'None of the classical ones',
            text: 'No Gajakesari, Budha-Aditya, Mahapurusha, Kala Sarpa or similar combination is formed at this moment.',
          },
        ],
  );

  // ---------- graha by graha
  add(
    'Graha by graha',
    g.list.map((x) => {
      const k = x.key,
        h = house(x.sign),
        node = k === 'Rahu' || k === 'Ketu';
      const benefic = BENEFIC.includes(k);
      let note;
      if (!benefic && [3, 6, 10, 11].includes(h))
        note = 'A natural malefic in a growing house (upachaya) does well: its hardness becomes drive.';
      else if ([6, 8, 12].includes(h))
        note = 'A difficult house (dusthana): its matters come through effort, delay or in private.';
      else if (benefic && [1, 4, 5, 7, 9, 10].includes(h))
        note = 'A natural benefic in an angle or trine is well placed and protects the chart.';
      else if ([1, 4, 7, 10].includes(h)) note = 'In an angle (kendra) it is strong and its effects are plain to see.';
      else if ([5, 9].includes(h)) note = 'In a trine (trikona) it leans towards good fortune.';
      else note = 'A middling house: neither especially helped nor harmed.';
      const dig =
        x.dignity === 'Exalted'
          ? ' Exalted: at its strongest.'
          : x.dignity === 'Debilitated'
            ? ' Debilitated: at its weakest, unless other factors cancel it.'
            : x.dignity === 'Own sign'
              ? ' In its own sign: at home and steady.'
              : '';
      const with_ = inSign(x.sign, k),
        by = aspecting(x.sign, k),
        disp = LORD[x.sign];
      const state = [
        x.dignity || (node ? '' : 'Neutral ground'),
        !node && x.retro ? 'retrograde (vakri): strong, but turned inward' : '',
        combust(k) ? 'combust (asta)' : '',
        navamsa(x.sid) === x.sign ? 'vargottama' : '',
      ].filter(Boolean);
      return {
        id: `graha-${k}`,
        ref: `vd-graha:${k}`,
        head: `${nm(k)} in ${rashi(x.sign)}, ${ord(h)} house`,
        text: `${cap(KARAKA[k])} meet ${BHAVA[h - 1][1]}. ${note}${dig}`,
        more: [
          ['Signifies', cap(KARAKA[k])],
          [
            'Position',
            `${Math.floor(x.deg)}°${String(Math.floor((x.deg % 1) * 60)).padStart(2, '0')}′ ${rashiEn(x.sign)}`,
          ],
          ['House', `${ord(h)} · ${BHAVA[h - 1][0]}: ${BHAVA[h - 1][1]} · ${houseKind(h)}`],
          ['Sign lord', disp === k ? 'itself' : `${nm(disp)} in ${where(disp)}`],
          [
            'Nakshatra',
            `${nakName(x.nak.i)}, pada ${x.nak.pada}, ruled by ${nm(x.nak.lord)}: ${Vedic.NAKSHATRAS[x.nak.i][2].toLowerCase()}`,
          ],
          ['Navamsa', rashi(navamsa(x.sid))],
          ['Condition', state.join(' · ') || '—'],
          ['Together with', with_.length ? list(with_.map(nm)) : 'no other graha'],
          [
            'Aspects',
            aspectsOf(k)
              .map((s) => `${ord(house(s))} house${inSign(s).length ? ` (${inSign(s).map(skt).join(', ')})` : ''}`)
              .join(', '),
          ],
          ['Aspected by', by.length ? list(by.map(nm)) : 'none'],
          [
            'Rules',
            node
              ? 'no houses'
              : (() => {
                  const hs = LORD.map((l, s) => (l === k ? house(s) : 0))
                    .filter(Boolean)
                    .sort((a, b) => a - b);
                  return `${hs.map(ord).join(' and ')} house${hs.length > 1 ? 's' : ''}`;
                })(),
          ],
        ],
      };
    }),
  );

  // ---------- house by house
  add(
    'House by house',
    BHAVA.map(([name, topic], i) => {
      const sign = (lagnaSign + i) % 12,
        lord = LORD[sign],
        lh = house(G[lord].sign);
      const occ = inSign(sign),
        by = aspecting(sign);
      const lordNote =
        [6, 8, 12].includes(lh) && lh !== i + 1
          ? 'its lord is in a difficult house, so these matters take effort'
          : [1, 4, 5, 7, 9, 10].includes(lh)
            ? 'its lord is well placed, which supports these matters'
            : 'its lord is in a middling house';
      return {
        id: `house-${i + 1}`,
        ref: `vd-rashi:${sign}`,
        head: `${ord(i + 1)} · ${name} in ${rashi(sign)}`,
        text: `${cap(topic)}. ${occ.length ? `${list(occ.map(nm))} ${occ.length > 1 ? 'sit' : 'sits'} here` : 'Empty'}; ${lordNote} (${skt(lord)} in the ${ord(lh)}).`,
        more: [
          ['Covers', cap(topic)],
          ['Kind', houseKind(i + 1)],
          ['Sign', `${rashiEn(sign)}: ${RASHI_STYLE[sign]}`],
          ['Lord', `${nm(lord)} in ${where(lord)}${G[lord].dignity ? `, ${G[lord].dignity.toLowerCase()}` : ''}`],
          ['Grahas here', occ.length ? list(occ.map(nm)) : 'none'],
          ['Aspected by', by.length ? list(by.map(nm)) : 'none'],
        ],
      };
    }),
  );

  // ---------- dasha
  if (dashas && dashas.length) {
    const d0 = dashas[0];
    add('Dasha', [
      {
        id: 'dasha',
        ref: `vd-graha:${d0.lord}`,
        head: `${nm(d0.lord)} mahadasha`,
        text: `For someone born at this moment, life opens in the period of ${nm(d0.lord)}, with ${d0.years.toFixed(1)} years left to run: a first chapter about ${KARAKA[d0.lord]}, lived through the ${ord(house(G[d0.lord].sign))} house.`,
        more: dashas
          .slice(0, 4)
          .map((d, i): [string, string] => [
            i === 0 ? 'Now' : 'Then',
            `${nm(d.lord)} · ${d.years.toFixed(1)} years · ${KARAKA[d.lord]}`,
          ])
          .concat([
            [
              'How it is set',
              `By the Moon's nakshatra, ${nakName(moon.nak.i)}, whose ruler starts the 120-year sequence.`,
            ],
          ]),
      },
    ]);
  }

  // ---------- the short version
  const sum = [
    `${p.tithi.paksha} ${p.tithi.name} under ${p.nakshatra.name}, on ${Vedic.VARAS[vara][0]}, the day of ${skt(Vedic.VARAS[vara][1])}.`,
  ];
  sum.push(
    `The day is ${nat[1]} in nature${yogaBad || vishti ? `, with a caution from ${[yogaBad ? `${p.yoga.name} yoga` : '', vishti ? 'Vishti karana' : ''].filter(Boolean).join(' and ')}` : `, under the auspicious ${p.yoga.name} yoga`}.`,
  );
  sum.push(
    `${rashi(lagnaSign)} rises, and its lord ${skt(ll)} sits in the ${ord(house(G[ll].sign))} house of ${BHAVA[house(G[ll].sign) - 1][1]}.`,
  );
  sum.push(
    `The Moon is in ${rashi(moon.sign)}, in ${nakName(moon.nak.i)}: ${Vedic.NAKSHATRAS[moon.nak.i][2].toLowerCase()}`,
  );
  const named = yogas.filter((y) => /yoga$/.test(y.head)).map((y) => y.head.replace(' yoga', ''));
  if (named.length) sum.push(`Yogas formed: ${list(named)}.`);
  const strong = g.list.filter((x) => x.dignity === 'Exalted' || x.dignity === 'Own sign').map((x) => skt(x.key));
  const weak = g.list.filter((x) => x.dignity === 'Debilitated').map((x) => skt(x.key));
  if (strong.length || weak.length)
    sum.push(
      `${strong.length ? `${list(strong)} ${strong.length > 1 ? 'are' : 'is'} strong by sign` : ''}${strong.length && weak.length ? '; ' : ''}${weak.length ? `${list(weak)} ${weak.length > 1 ? 'are' : 'is'} debilitated` : ''}.`,
    );
  const summary = sum.join(' ');

  const advice = {
    good: [...new Set(good)],
    care: care.length ? care : ['nothing in particular: the day is clear of the usual cautions'],
  };
  const text = [summary, '', `Good for: ${advice.good.join('; ')}.`, `Go easy on: ${advice.care.join('; ')}.`, '']
    .concat(
      sections.flatMap((s) =>
        [s.title.toUpperCase()].concat(
          s.items.flatMap((i) => [`- ${i.head}: ${i.text}`].concat((i.more || []).map(([k2, v]) => `    ${k2}: ${v}`))),
          [''],
        ),
      ),
    )
    .join('\n')
    .trim();
  return { summary, advice, sections, text };
}

export { read };

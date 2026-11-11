// A plain-language reading of a Western chart, put together from traditional keywords.
// Needs AstroEvents. Pure: takes the chart and what was already worked out from it, returns text.
import * as Western from './western.ts';
import type { Chart } from './core.ts';
import type { Aspect, MoonPhase, Pattern } from './western.ts';
import type { Reading, ReadingItem, ReadingSection } from './reading.ts';

const norm = (x: number) => ((x % 360) + 360) % 360;
const signOf = (lon: number) => Math.floor(norm(lon) / 30);

// What each body stands for
const PLANET: Record<string, string> = {
  Sun: 'identity, vitality',
  Moon: 'feelings, needs',
  Mercury: 'thinking, talk',
  Venus: 'love, values',
  Mars: 'drive, desire',
  Jupiter: 'growth, faith',
  Saturn: 'structure, limits',
  Uranus: 'change, freedom',
  Neptune: 'dreams, ideals',
  Pluto: 'power, deep change',
  Chiron: 'old wounds, healing',
};
// How each sign behaves, and what it is about
const SIGN_STYLE = [
  'direct, bold and quick to start',
  'steady, sensual and slow to move',
  'curious, talkative and changeable',
  'protective, tender and home-seeking',
  'warm, proud and expressive',
  'careful, practical and exacting',
  'fair-minded, sociable and looking for balance',
  'intense, private and unwilling to stay on the surface',
  'restless, frank and hungry for meaning',
  'disciplined, ambitious and patient',
  'detached, inventive and group-minded',
  'soft, imaginative and porous',
];
const SIGN_THEME = [
  'beginnings and courage',
  'stability, the body and what lasts',
  'ideas, exchange and variety',
  'home, care and belonging',
  'self-expression, play and heart',
  'craft, health and useful work',
  'relationships, fairness and beauty',
  'depth, trust and letting go',
  'travel, belief and the bigger picture',
  'responsibility, work and long aims',
  'community, ideas and reform',
  'compassion, imagination and release',
];
const PHASE: Record<string, string> = {
  'New Moon': 'a quiet start: a time to begin and set intentions rather than to show results',
  'Waxing Crescent': 'first effort: new plans meet their first resistance and need commitment',
  'First Quarter': 'a turning point that asks for decisions and action',
  'Waxing Gibbous': 'a time to refine and adjust before things peak',
  'Full Moon': 'a peak: things come to light and to a head, and feelings run high',
  'Waning Gibbous': 'a time to digest and share what the peak showed',
  'Last Quarter': 'a turning point that asks what to drop and what to keep',
  'Waning Crescent': 'the end of a cycle: a time to rest, finish and clear space',
};
const ASPECT: Record<string, string> = {
  conj: 'are fused and act as one force',
  opp: 'pull in opposite directions and ask for a balance between them',
  sq: 'are in friction, which presses for action',
  tri: 'flow together easily',
  sex: 'offer an opening that takes a little effort to use',
  qx: 'sit awkwardly together and need constant adjusting',
};
const HOUSE = [
  'self, body and appearance',
  'money and possessions',
  'communication and surroundings',
  'home and roots',
  'creativity and pleasure',
  'work and health',
  'partners',
  'shared resources and transformation',
  'beliefs and long journeys',
  'career and reputation',
  'friends and community',
  'the hidden and solitude',
];
const ELEMENT: Record<string, string> = {
  Fire: 'action, enthusiasm and impatience',
  Earth: 'practical matters, the body and tangible results',
  Air: 'ideas, conversation and distance from feeling',
  Water: 'feeling, intuition and memory',
};
const ELEMENT_LACK: Record<string, string> = {
  Fire: 'spark and initiative',
  Earth: 'grounding and follow-through',
  Air: 'perspective and talking things over',
  Water: 'feeling and empathy',
};
const MODE: Record<string, string> = {
  Cardinal: 'starting things',
  Fixed: 'holding on and persisting',
  Mutable: 'adapting and changing course',
};
const RETRO: Record<string, string> = {
  Mercury: 'review messages, plans and agreements before committing to them',
  Venus: 'old relationships and questions of worth come back for a second look',
  Mars: 'drive turns inward; pushing harder works less well than re-planning',
};
// What the Moon's phase and sign are traditionally good for, and what to go easy on
const PHASE_DO: Record<string, [good: string, care: string]> = {
  'New Moon': ['setting intentions and starting quietly', 'expecting quick results'],
  'Waxing Crescent': ['taking the first concrete step', 'giving up at the first resistance'],
  'First Quarter': ['deciding and acting', 'putting off a choice that is due'],
  'Waxing Gibbous': ['refining, editing and preparing', 'starting over from scratch'],
  'Full Moon': ['finishing, celebrating and seeing clearly', 'heated words and hasty reactions'],
  'Waning Gibbous': ['sharing, teaching and giving thanks', 'holding on to the high point'],
  'Last Quarter': ['clearing out and changing course', 'launching something new'],
  'Waning Crescent': ['resting, finishing and reflecting', 'big beginnings and overfull days'],
};
const MOON_DO = [
  'quick starts and physical effort',
  'cooking, gardening and steady work with the hands',
  'writing, errands and conversations',
  'home, family and looking after people',
  'play, performance and generosity',
  'sorting, fixing and health routines',
  'meeting people, making peace and making things beautiful',
  'research, honest talks and letting go',
  'travel, study and big-picture plans',
  'planning, structure and serious work',
  'groups, new ideas and experiments',
  'rest, music, prayer and imagination',
];
const SLOW = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron'];
const TEN = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

const list = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const kw = (name: string) => `${name} (${PLANET[name]})`;
const ord = (n: number) => n + (['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] || 'th');

// o: { chart, asps, pats, phase, houseOf } with houseOf(lon) -> 1..12.
// Returns { summary, advice: { good, care }, sections: [{ title, items: [{ head, text, ref }] }], text }.
// ref names the part of the chart a line is about ('planet:Mars', 'aspect:3', 'house:0', 'sign:7', 'angle:AC').
interface Sky {
  chart: Chart;
  asps: Aspect[];
  pats: Pattern[];
  phase: MoonPhase;
  houseOf?: (lon: number) => number;
}

function read(o: Sky): Reading {
  const { chart, asps, pats, phase } = o;
  const houseOf = o.houseOf ?? (() => 1);
  const by = Object.fromEntries(chart.pts.map((p) => [p.name, p]));
  const S = Western.SIGNS;
  const sun = signOf(by.Sun.lon),
    moon = signOf(by.Moon.lon),
    asc = signOf(chart.asc);
  const useHouses = !!o.houseOf && chart.system !== 'natural'; // natural houses only repeat the signs
  const inHouse = (name: string) =>
    useHouses ? ` in the ${ord(houseOf(by[name].lon))} house (${HOUSE[houseOf(by[name].lon) - 1]})` : '';
  const sections: ReadingSection[] = [];
  const add = (title: string, items: ReadingItem[]) => {
    if (items.length) sections.push({ title, items });
  };

  // ---- the lights and the rising sign
  const ruler = Western.RULER[asc],
    rp = by[ruler];
  add('Sun, Moon and Rising', [
    {
      ref: 'planet:Sun',
      head: `Sun in ${S[sun]}`,
      text: `The season's focus is on ${SIGN_THEME[sun]}${useHouses ? `; at this hour the Sun falls${inHouse('Sun')}` : ''}.`,
    },
    {
      ref: 'planet:Moon',
      head: `Moon in ${S[moon]}`,
      text: `The mood is ${SIGN_STYLE[moon]}${useHouses ? `, and it gathers${inHouse('Moon')}` : ''}.`,
    },
    { ref: 'planet:Moon', head: phase.name, text: `${Math.round(phase.illum * 100)}% lit. ${cap(PHASE[phase.name])}.` },
    {
      ref: 'angle:AC',
      head: `${S[asc]} rising`,
      text: `Seen from this place, the moment comes across as ${SIGN_STYLE[asc]}. Its ruler ${ruler} is in ${S[signOf(rp.lon)]}${inHouse(ruler)}${rp.retro ? ', retrograde' : ''}, which shows where that energy is heading.`,
    },
  ]);

  // ---- tightest aspects; contacts between two slow planets last for months, so they rank lower
  const slowPair = (a: Aspect) => SLOW.includes(a.a) && SLOW.includes(a.b);
  const top = asps
    .filter((a) => PLANET[a.a] && PLANET[a.b])
    .map((a) => ({ a, score: a.orb + (slowPair(a) ? 2 : 0) }))
    .sort((x, y) => x.score - y.score)
    .slice(0, 5)
    .map((x) => x.a);
  add(
    'Strongest contacts',
    top.map((a) => ({
      ref: `aspect:${asps.indexOf(a)}`,
      head: `${a.a} ${a.type.name.toLowerCase()} ${a.b}`,
      text: `${kw(a.a)} and ${kw(a.b)} ${ASPECT[a.type.key]}. ${a.orb.toFixed(1)}° from exact and ${a.applying ? 'building' : 'fading'}${slowPair(a) ? '; a slow, months-long background theme' : ''}.`,
    })),
  );

  // ---- patterns
  add(
    'Patterns',
    pats.map((p) => {
      const focus = p.focus ?? '';
      const others = p.members.filter((n) => n !== focus);
      if (p.type === 'Stellium')
        return {
          ref: `sign:${S.indexOf(focus)}`,
          head: `Stellium in ${focus}`,
          text: `${list(p.members)} crowd into one sign, so a great deal of attention goes to ${SIGN_THEME[S.indexOf(focus)]}.`,
        };
      if (p.type === 'T-square')
        return {
          ref: `planet:${focus}`,
          head: `T-square to ${focus}`,
          text: `The tug-of-war between ${list(others)} lands on ${kw(focus)}: that is where the pressure shows, and where acting releases it.`,
        };
      if (p.type === 'Yod')
        return {
          ref: `planet:${focus}`,
          head: `Yod to ${focus}`,
          text: `${list(others)} cooperate, but both sit awkwardly with ${kw(focus)}: a nagging adjustment that will not settle by itself.`,
        };
      const el = Western.ELEMENT[signOf(by[p.members[0]].lon) % 4];
      return {
        ref: `planet:${p.members[0]}`,
        head: 'Grand Trine',
        text: `${list(p.members)} support each other in a closed loop, mostly through ${el.toLowerCase()} signs: an ease in ${ELEMENT[el]} that is simple to take for granted.`,
      };
    }),
  );

  // ---- balance of elements and modes (Sun to Pluto plus the Ascendant, as on the Balance card)
  const lons = TEN.map((n) => by[n].lon).concat([chart.asc]);
  const el = [0, 0, 0, 0],
    md = [0, 0, 0];
  lons.forEach((l) => {
    el[signOf(l) % 4]++;
    md[signOf(l) % 3]++;
  });
  const tops = (counts: number[], names: string[]) => names.filter((_, i) => counts[i] === Math.max(...counts));
  const strongEl = tops(el, Western.ELEMENT),
    strongMd = tops(md, Western.MODE),
    lack = Western.ELEMENT.filter((_, i) => el[i] === 0);
  const balance = [];
  if (strongEl.length < 3)
    balance.push({
      head: `${strongEl.join(' and ')} strongest`,
      text: `The emphasis is on ${strongEl.map((e) => ELEMENT[e]).join('; and on ')}.`,
    });
  else
    balance.push({ head: 'Elements even', text: 'No element dominates, so no single way of responding is favoured.' });
  if (lack.length)
    balance.push({
      head: `No ${lack.join(' or ')}`,
      text: `Nothing sits in ${lack.join(' or ').toLowerCase()} signs, so ${lack.map((e) => ELEMENT_LACK[e]).join(', and ')} ${lack.length > 1 || /and/.test(ELEMENT_LACK[lack[0]]) ? 'have' : 'has'} to be supplied on purpose.`,
    });
  if (strongMd.length === 1)
    balance.push({ head: `${strongMd[0]} signs lead`, text: `The sky leans towards ${MODE[strongMd[0]]}.` });
  add('Balance', balance);

  // ---- strength of the planets by sign
  const strong: string[] = [],
    weak: string[] = [];
  TEN.forEach((n) => {
    const d = Western.dignity(n, signOf(by[n].lon));
    if (d === 'Domicile' || d === 'Exaltation') strong.push(`${n} in ${S[signOf(by[n].lon)]} (${d.toLowerCase()})`);
    if (d === 'Detriment' || d === 'Fall') weak.push(`${n} in ${S[signOf(by[n].lon)]} (${d.toLowerCase()})`);
  });
  const dign = [];
  if (strong.length)
    dign.push({
      head: 'At ease',
      text: `${list(strong)}: ${strong.length > 1 ? 'these planets work' : 'this planet works'} simply and with confidence.`,
    });
  if (weak.length)
    dign.push({
      head: 'Working harder',
      text: `${list(weak)}: ${weak.length > 1 ? 'these planets are' : 'this planet is'} away from home ground and ${weak.length > 1 ? 'get' : 'gets'} results by a longer road.`,
    });
  add('Strength by sign', dign);

  // ---- retrogrades
  const retro = [];
  Object.keys(RETRO).forEach((n) => {
    if (by[n].retro) retro.push({ ref: `planet:${n}`, head: `${n} retrograde`, text: `${cap(RETRO[n])}.` });
  });
  const slowR = SLOW.filter((n) => by[n] && by[n].retro);
  if (slowR.length)
    retro.push({
      head: `${list(slowR)} retrograde`,
      text: 'The slow planets spend months of every year retrograde, so this is a background note: their themes are being reviewed rather than pushed forward.',
    });
  add('Retrogrades', retro);

  // ---- crowded houses
  if (useHouses) {
    const count: Record<number, string[]> = {};
    TEN.forEach((n) => {
      const h = houseOf(by[n].lon);
      (count[h] = count[h] || []).push(n);
    });
    add(
      'Houses',
      Object.entries(count)
        .filter(([, m]) => m.length >= 3)
        .map(([h, m]) => ({
          ref: `house:${+h - 1}`,
          head: `${ord(+h)} house busy`,
          text: `${list(m)} gather here, which puts weight on ${HOUSE[+h - 1]} at this hour and place.`,
        })),
    );
  }

  // ---- the short version
  const sum = [`${phase.name} in ${S[moon]}, with the Sun in ${S[sun]}${useHouses ? ` and ${S[asc]} rising` : ''}.`];
  sum.push(`The focus is on ${SIGN_THEME[sun]}, in a mood that is ${SIGN_STYLE[moon]}.`);
  sum.push(`${cap(PHASE[phase.name].split(':')[0])} in the Moon's cycle.`);
  if (top.length)
    sum.push(
      `The tightest contact is ${top[0].a} ${top[0].type.name.toLowerCase()} ${top[0].b}: ${PLANET[top[0].a].split(', ')[0]} and ${PLANET[top[0].b].split(', ')[0]} ${ASPECT[top[0].type.key]}.`,
    );
  const pat = pats[0],
    patFocus = pat?.focus ?? '';
  if (pat)
    sum.push(
      pat.type === 'Stellium'
        ? `A stellium in ${patFocus} adds weight to ${SIGN_THEME[S.indexOf(patFocus)]}.`
        : patFocus
          ? `A ${pat.type} puts ${patFocus} under pressure.`
          : `A Grand Trine between ${list(pat.members)} keeps things moving easily.`,
    );
  if (strongEl.length < 3)
    sum.push(
      `${strongEl.join(' and ')} ${strongEl.length > 1 ? 'are' : 'is'} the strongest element${strongEl.length > 1 ? 's' : ''}${lack.length ? `, with no ${lack.join(' or ').toLowerCase()} at all` : ''}.`,
    );
  const personalR = Object.keys(RETRO).filter((n) => by[n].retro);
  if (personalR.length)
    sum.push(
      `${list(personalR)} ${personalR.length > 1 ? 'are' : 'is'} retrograde, so review comes before progress there.`,
    );
  const summary = sum.join(' ');

  // ---- what the moment suits
  const good = [PHASE_DO[phase.name][0], MOON_DO[moon]];
  const care = [PHASE_DO[phase.name][1]];
  if (by.Mercury.retro) care.push('signing or sending anything unread');
  if (by.Mars.retro) care.push('forcing a result');
  const hard = asps.find(
    (a) =>
      (a.a === 'Moon' || a.b === 'Moon') &&
      (a.type.key === 'sq' || a.type.key === 'opp') &&
      a.orb < 3 &&
      !(a.a === 'Sun' || a.b === 'Sun'),
  );
  if (hard)
    care.push(
      `taking a mood at face value while the Moon is ${hard.type.key === 'sq' ? 'square' : 'opposite'} ${hard.a === 'Moon' ? hard.b : hard.a}`,
    );
  const advice = { good, care };

  const text = [summary, '', `Good for: ${good.join('; ')}.`, `Go easy on: ${care.join('; ')}.`, '']
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

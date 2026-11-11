// Chinese reading: the Day Master's strength and the elements that help it, the clashes and combinations
// between the four branches, and the day's officer from the twelve Jian Chu (建除十二神).
// Strength is the common simplified count: the season, then the eight characters weighted by place.
import type { Reading, ReadingItem, ReadingSection } from './reading.ts';
import * as Chinese from './chinese.ts';

const E = Chinese.ELEMENTS;
const elementOfStem = (s: number) => Chinese.STEMS[s][2];
const elementOfBranch = (b: number) => Chinese.BRANCHES[b][3];
const animal = (b: number) => Chinese.BRANCHES[b][2];
const produces = (e: number) => (e + 1) % 5;
const controls = (e: number) => (e + 2) % 5;
const producedBy = (e: number) => (e + 4) % 5;
const controlledBy = (e: number) => (e + 3) % 5;
const list = (a: string[]) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// the Day Master's state in the season of the month branch (旺相休囚死)
// [character, name, how the summary puts it, why]
const SEASON: [zh: string, name: string, phrase: string, text: string][] = [
  ['旺', 'prosperous', 'in season', 'the month is its own element, so it is at full strength.'],
  ['相', 'prime', 'fed by the season', 'the month’s element feeds it, so the season supports it.'],
  ['休', 'resting', 'resting in the season', 'it feeds the month’s element, so the season draws on it.'],
  ['囚', 'trapped', 'tired by the season', 'it has to work against the month’s element, which tires it.'],
  ['死', 'dead', 'out of season', 'the month’s element controls it, so the season is against it.'],
];
function seasonState(dm: number, monthEl: number) {
  if (monthEl === dm) return SEASON[0];
  if (monthEl === producedBy(dm)) return SEASON[1];
  if (monthEl === produces(dm)) return SEASON[2];
  if (monthEl === controls(dm)) return SEASON[3];
  return SEASON[4];
}

// what each element brings, when it is the one that helps
const ELEMENT_GIFT = [
  'growth, planning and new beginnings',
  'warmth, visibility and enthusiasm',
  'steadiness, care and keeping promises',
  'decisions, structure and finishing',
  'rest, learning and going with the flow',
];

// ---------- the four branches ----------
const PILLARS = ['year', 'month', 'day', 'hour'] as const;
// what each pillar stands for when the moment is read for itself
const PILLAR_MEANS: Record<string, string> = {
  year: 'the wider world',
  month: 'work',
  day: 'the self',
  hour: 'what comes next',
};
// six combinations (六合): branches whose numbers add to 1 mod 12, and what they make
const SIX_COMBINE: Record<string, number> = { '0-1': 2, '2-11': 0, '3-10': 1, '4-9': 3, '5-8': 4, '6-7': 1 };
// three harmonies (三合): [branches, element]; the middle one (a cardinal branch) is needed for a half
const THREE_HARMONY: [members: number[], element: number][] = [
  [[8, 0, 4], 4],
  [[11, 3, 7], 0],
  [[2, 6, 10], 1],
  [[5, 9, 1], 3],
];

// ---------- the day's officer (建除十二神) ----------
const OFFICERS: [zh: string, name: string, good: string, care: string][] = [
  ['建', 'Establish', 'starting things, meeting people in charge, setting out', 'breaking ground and digging'],
  ['除', 'Remove', 'clearing out, cleaning, treatment and ending a bad habit', 'weddings and big celebrations'],
  ['滿', 'Full', 'gatherings, celebrations, collecting what is owed', 'lawsuits and medical procedures'],
  ['平', 'Balance', 'repairs, mending relationships and levelling things out', 'grand beginnings'],
  ['定', 'Stable', 'agreements, contracts, hiring and weddings', 'lawsuits and long journeys'],
  ['執', 'Initiate', 'building, planting and taking firm hold of a task', 'moving house and setting out'],
  ['破', 'Destruction', 'demolition and breaking with the past', 'anything important: contracts, weddings, launches'],
  ['危', 'Danger', 'quiet work, prayer and caution', 'risk, heights, water and ventures'],
  ['成', 'Success', 'almost anything: weddings, openings, contracts and moves', 'lawsuits'],
  ['收', 'Receive', 'collecting, harvesting, buying and study', 'setting out and starting new things'],
  ['開', 'Open', 'openings, starting work, weddings and travel', 'burials and digging'],
  ['閉', 'Close', 'finishing, saving, closing accounts and building walls', 'opening, travel and medical treatment'],
];

// Returns { summary, advice: { good, care }, sections, text }, like the other readings.
function read(p: Chinese.FourPillars): Reading {
  const dmStem = p.day.stem,
    dm = elementOfStem(dmStem);
  const [dmZh, dmPy, , dmImage, dmNature] = Chinese.STEMS[dmStem];
  const yang = dmStem % 2 === 0 ? 'Yang' : 'Yin';
  const monthEl = elementOfBranch(p.month.branch);
  const sections: ReadingSection[] = [];
  const add = (title: string, items: ReadingItem[]) => {
    if (items.length) sections.push({ title, items });
  };
  const good: string[] = [],
    care: string[] = [];

  // ---- the Day Master and its strength
  const state = seasonState(dm, monthEl);
  const supports = (e: number) => e === dm || e === producedBy(dm);
  // the eight characters but the Day Master itself, weighted: the month branch rules the season, the day branch
  // is the Day Master's own seat
  const chars: [el: number, weight: number, where: string][] = [
    [elementOfStem(p.year.stem), 1, 'year stem'],
    [elementOfBranch(p.year.branch), 1, 'year branch'],
    [elementOfStem(p.month.stem), 1, 'month stem'],
    [monthEl, 3, 'month branch'],
    [elementOfBranch(p.day.branch), 1.5, 'day branch'],
    [elementOfStem(p.hour.stem), 1, 'hour stem'],
    [elementOfBranch(p.hour.branch), 1, 'hour branch'],
  ];
  const total = chars.reduce((s, c) => s + c[1], 0);
  const support = chars.filter((c) => supports(c[0])).reduce((s, c) => s + c[1], 0);
  const ratio = support / total;
  const strength = ratio >= 0.55 ? 'strong' : ratio <= 0.35 ? 'weak' : 'balanced';
  const helpers =
    strength === 'strong'
      ? [produces(dm), controls(dm), controlledBy(dm)] // drain, spend or discipline a strong Day Master
      : strength === 'weak'
        ? [producedBy(dm), dm] // feed and accompany a weak one
        : [producedBy(dm), produces(dm)];
  const helpText =
    strength === 'strong'
      ? `A strong Day Master does best when its force has somewhere to go: ${E[produces(dm)]}, which it feeds; ${E[controls(dm)]}, which it masters; and ${E[controlledBy(dm)]}, which keeps it in check.`
      : strength === 'weak'
        ? `A weak Day Master needs backing: ${E[producedBy(dm)]}, which feeds it, and more ${E[dm]}, its own kind.`
        : `A balanced Day Master is well placed and needs little; ${E[producedBy(dm)]} steadies it and ${E[produces(dm)]} lets it express itself.`;
  add('Day Master', [
    {
      ref: `cn-stem:${dmStem}`,
      head: `${dmPy} ${dmZh} · ${yang} ${E[dm]}`,
      text: `The day’s stem stands for the self of this moment: ${dmImage}. ${dmNature}`,
    },
    {
      head: `${cap(strength)} Day Master`,
      text: `In a ${E[monthEl]} month it is ${state[1]} (${state[0]}): ${state[3]} Of the other seven characters, weighted by place, ${Math.round(ratio * 100)}% back it with ${E[dm]} or ${E[producedBy(dm)]}, so on balance it is ${strength}.`,
      more: chars.map(([el, w, where]) => [
        cap(where),
        `${E[el]}${supports(el) ? ' · supports' : ''}${w !== 1 ? ` · counts ${w}` : ''}`,
      ]),
    },
    {
      head: `Helpful elements: ${list(helpers.map((e) => E[e]))}`,
      text: `${helpText} In practice: ${helpers.map((e) => ELEMENT_GIFT[e]).join('; ')}.`,
    },
  ]);
  good.push(ELEMENT_GIFT[helpers[0]]);

  // ---- the four branches
  const br = PILLARS.map((k) => p[k].branch);
  const pair = (i: number, j: number) => `${cap(PILLARS[i])} and ${PILLARS[j]}`;
  const between = (i: number, j: number) => `${PILLAR_MEANS[PILLARS[i]]} and ${PILLAR_MEANS[PILLARS[j]]}`;
  const branches: ReadingItem[] = [];
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      const a = br[i],
        b = br[j];
      if ((a - b + 12) % 12 === 6) {
        branches.push({
          head: `${pair(i, j)} clash · ${animal(a)} and ${animal(b)}`,
          text: `Opposite branches (六沖): a jolt between ${between(i, j)}. Things here move suddenly or pull apart.`,
        });
        if (PILLARS[i] === 'day' || PILLARS[j] === 'day') care.push('forcing matters close to home');
      }
      const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
      if (key in SIX_COMBINE)
        branches.push({
          head: `${pair(i, j)} combine · ${animal(a)} and ${animal(b)}`,
          text: `A six-harmony pair (六合) that makes ${E[SIX_COMBINE[key]]}, binding ${between(i, j)}: they work together and agreements come easily.`,
        });
    }
  for (const [members, el] of THREE_HARMONY) {
    const present = members.filter((m) => br.includes(m));
    if (present.length === 3)
      branches.push({
        head: `${members.map(animal).join(', ')} · ${E[el]} frame`,
        text: `All three branches of a three-harmony (三合) are here, so the chart leans strongly to ${E[el]}: ${ELEMENT_GIFT[el]}.`,
      });
    else if (present.length === 2 && present.includes(members[1]))
      branches.push({
        head: `${present.map(animal).join(' and ')} · half ${E[el]} frame`,
        text: `Two of a three-harmony (三合) with its centre, a half frame that leans to ${E[el]}.`,
      });
  }
  if (!branches.length)
    branches.push({
      head: 'No clashes or combinations',
      text: 'The four branches neither pull against each other nor bind together: each part of the moment keeps to itself.',
    });
  if (branches.some((b) => /combine|frame/.test(b.head))) good.push('agreements and working together');
  add('Branches', branches);

  // ---- the day's officer
  const officer = (p.day.branch - p.month.branch + 12) % 12;
  const [ofZh, ofName, ofGood, ofCare] = OFFICERS[officer];
  add('The day’s officer', [
    {
      head: `${ofZh} ${ofName} day`,
      text: `The ${officer + 1}${['st', 'nd', 'rd'][officer] ?? 'th'} of the twelve officers (建除十二神), counted from the ${animal(p.month.branch)} month to the ${animal(p.day.branch)} day. Good for ${ofGood}; avoid ${ofCare}.`,
    },
  ]);
  good.unshift(ofGood);
  care.unshift(ofCare);

  // ---- summary
  const sum = [
    `A ${strength} ${yang} ${E[dm]} Day Master, ${dmPy} ${dmZh}, ${state[2]} in the ${E[monthEl]} month.`,
    `${list(helpers.map((e) => E[e]))} ${helpers.length > 1 ? 'help' : 'helps'} it most.`,
  ];
  const clashes = branches.filter((b) => / clash /.test(b.head)).length,
    combos = branches.filter((b) => /combine|frame/.test(b.head)).length;
  if (clashes || combos)
    sum.push(
      `The branches hold ${[clashes ? `${clashes} clash${clashes > 1 ? 'es' : ''}` : '', combos ? `${combos} combination${combos > 1 ? 's' : ''}` : ''].filter(Boolean).join(' and ')}.`,
    );
  sum.push(`It is ${/^[AEIOU]/.test(ofName) ? 'an' : 'a'} ${ofName} day (${ofZh}): good for ${ofGood}.`);
  const summary = sum.join(' ');

  const advice = { good: [...new Set(good)], care: [...new Set(care)] };
  const text = [summary, '', `Good for: ${advice.good.join('; ')}.`, `Go easy on: ${advice.care.join('; ')}.`, '']
    .concat(
      sections.flatMap((s) =>
        [s.title.toUpperCase()].concat(
          s.items.flatMap((i) => [`- ${i.head}: ${i.text}`].concat((i.more || []).map(([k, v]) => `    ${k}: ${v}`))),
          [''],
        ),
      ),
    )
    .join('\n')
    .trim();
  return { summary, advice, sections, text };
}

export { read, OFFICERS };

// Maya calendar: Long Count, Tzolk'in, Haab', Lords of the Night.
// Uses the GMT correlation (JDN 584283 = 13.0.0.0.0 4 Ajaw 8 Kumk'u). The day turns at local midnight.
const GMT = 584283;
// [name, English, meaning, direction]
const SIGNS: [name: string, english: string, meaning: string][] = [
  ["Imix'", 'Crocodile', 'Primordial waters and beginnings. Nourishment, trust, the source.'],
  ["Ik'", 'Wind', 'Breath and spirit. Communication, inspiration, change.'],
  ["Ak'b'al", 'Night', 'Darkness and the inner house. Dreams, mystery, rest.'],
  ["K'an", 'Seed', 'Maize and potential. Growth, abundance, patience.'],
  ['Chikchan', 'Serpent', 'Life force and instinct. Vitality, passion, intuition.'],
  ['Kimi', 'Death', 'Transformation and the ancestors. Endings that clear the way.'],
  ["Manik'", 'Deer', 'The hand and the healer. Skill, service, accomplishment.'],
  ['Lamat', 'Star', 'Venus and harmony. Beauty, abundance, things coming to fruit.'],
  ['Muluk', 'Water', 'Offering and emotion. Purification, feeling, gratitude.'],
  ['Ok', 'Dog', 'Loyalty and guidance. Love, friendship, faithful companions.'],
  ['Chuwen', 'Monkey', 'Play and creation. Art, humour, the weaver of time.'],
  ["Eb'", 'Road', 'The path of life. Community, destiny, walking forward.'],
  ["B'en", 'Reed', 'Home and authority. Growth, order, the household.'],
  ['Ix', 'Jaguar', 'Earth magic and the night sun. The feminine, shamanic power.'],
  ['Men', 'Eagle', 'Vision and ambition. Freedom, seeing far, aspiration.'],
  ["Kib'", 'Owl', 'Wisdom and forgiveness. The ancestors, reflection, conscience.'],
  ["Kab'an", 'Earth', 'Movement and intelligence. Earthquake, thought, synchronicity.'],
  ["Etz'nab'", 'Flint', 'Truth and decision. Cutting away, clarity, healing by the blade.'],
  ['Kawak', 'Storm', 'Rain and renewal. Purification, family, gathering.'],
  ['Ajaw', 'Sun', 'The lord and the light. Enlightenment, wholeness, completion.'],
];
const DIRECTIONS: [direction: string, colour: string][] = [
  ['East', 'Red'],
  ['North', 'White'],
  ['West', 'Black'],
  ['South', 'Yellow'],
];
const HAAB = [
  'Pop',
  "Wo'",
  'Sip',
  "Sotz'",
  'Sek',
  'Xul',
  "Yaxk'in",
  'Mol',
  "Ch'en",
  'Yax',
  "Sak'",
  'Keh',
  'Mak',
  "K'ank'in",
  'Muwan',
  'Pax',
  "K'ayab'",
  "Kumk'u",
  "Wayeb'",
];
const LC_UNITS: [unit: string, days: number][] = [
  ["B'ak'tun", 144000],
  ["K'atun", 7200],
  ['Tun', 360],
  ['Winal', 20],
  ["K'in", 1],
];

const mod = (a: number, n: number) => ((a % n) + n) % n;
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

function tzolkin(days: number) {
  return { number: mod(days + 3, 13) + 1, sign: mod(days + 19, 20) };
}
function haab(days: number) {
  const pos = mod(days + 348, 365);
  return { month: Math.floor(pos / 20), day: pos % 20, pos };
}

function mayaDate(y: number, m: number, d: number) {
  const days = jdn(y, m, d) - GMT;
  let rest = days;
  const longCount = LC_UNITS.map(([, n]) => {
    const v = Math.floor(rest / n);
    rest -= v * n;
    return v;
  });
  const tz = tzolkin(days);
  const hb = haab(days);
  // position in the 260-day count (1 Imix' = 1)
  const kin = (() => {
    for (let k = 0; k < 260; k++) if (k % 13 === tz.number - 1 && k % 20 === tz.sign) return k + 1;
    return 0;
  })();
  // trecena: the sign on which this 13-day run began
  const trecena = mod(tz.sign - (tz.number - 1), 20);
  const lord = mod(days + 8, 9) + 1;
  // year bearer: the Tzolk'in day of 0 Pop that opened this Haab' year
  const yearStart = days - hb.pos;
  const bearer = tzolkin(yearStart);
  return {
    days,
    longCount,
    tz,
    hb,
    kin,
    trecena,
    lord,
    bearer,
    daysToNewYear: 365 - hb.pos,
    direction: DIRECTIONS[tz.sign % 4],
  };
}

export { SIGNS, DIRECTIONS, HAAB, LC_UNITS, GMT, mayaDate, tzolkin, haab, jdn };

// Western tab: what the tooltips say about planets, signs, houses, angles and aspects.
import { Western } from '#astro';
import { APPROX, ASPECT_COLOR, ASPECT_GLYPH, EL_VAR, LABEL, VS } from '#lib/constants.ts';
import { dm, dms, fmtPos, g, norm, pad, pn, row, sg } from '#lib/format.ts';
import { state as st, tips } from '#lib/state.ts';

function whereIs(name) {
  const p = st.ctx.byName[name];
  if (!p) return '';
  return `${fmtPos(p.lon).text}, H${st.ctx.houseOf(p.lon)}${p.retro ? ', R' : ''}`;
}

function tipPlanet(name) {
  const { chart, asps, byName, houseOf } = st.ctx;
  const p = byName[name];
  if (!p) return '';
  const sign = Math.floor(p.lon / 30);
  let h = `<div class="th">${pn(name)}${APPROX.includes(name) ? ' <span class="badge">≈ approx.</span>' : ''}</div>`;
  h += `<div class="tpos">${dms(p.lon)}</div>`;
  h += row('House', `H${houseOf(p.lon)}`);
  const motion = Math.abs(p.speed) < 0.003 ? 'Stationary' : p.retro ? 'Retrograde' : 'Direct';
  h += row('Motion', `${motion} · ${p.speed >= 0 ? '+' : '−'}${dm(p.speed)}/day`);
  if (name !== 'Node' && name !== 'Lilith') h += row('Latitude', `${p.lat >= 0 ? '+' : '−'}${dm(p.lat)}`);
  const oob = Math.abs(p.decl) > chart.eps;
  h += row(
    'Declination',
    `${dm(p.decl)} ${p.decl >= 0 ? 'N' : 'S'}${oob ? ' <span class="badge warn">out of bounds</span>' : ''}`,
  );
  const dig = Western.dignity(name, sign);
  if (dig) h += row('Dignity', dig);
  const rules = [];
  chart.cusps.forEach((c, i) => {
    const inf = Western.signInfo(Math.floor(c / 30));
    if (inf.modern === name || inf.trad === name) rules.push(`H${i + 1}${inf.modern !== name ? '*' : ''}`);
  });
  if (rules.length)
    h += row(
      'Rules',
      rules.join(', ') + (rules.some((r) => r.endsWith('*')) ? ' <span class="muted">(*traditional)</span>' : ''),
    );
  if (name === 'Node') h += row('South Node', fmtPos(p.lon + 180).text);
  h += row('Antiscion', fmtPos(180 - p.lon).text);
  h += row('Contra-antiscion', fmtPos(360 - p.lon).text);
  const mine = asps.filter((a) => a.a === name || a.b === name);
  if (mine.length) {
    h += `<div class="tsub">Aspects</div>`;
    h += mine
      .map((a) => {
        const other = a.a === name ? a.b : a.a;
        return `<div class="tr"><span><span class="tg" style="color:${ASPECT_COLOR[a.type.key]}">${ASPECT_GLYPH[a.type.key]}${VS}</span> ${pn(other)}</span><span>${a.orb.toFixed(2)}° ${a.applying ? 'app.' : 'sep.'}</span></div>`;
      })
      .join('');
  }
  if (name === 'Lilith') h += `<div class="muted tnote">Mean Black Moon Lilith (lunar apogee)</div>`;
  if (name === 'Node') h += `<div class="muted tnote">True node</div>`;
  return h;
}

function tipSign(s) {
  const { chart, houseOf } = st.ctx;
  const inf = Western.signInfo(s);
  let h = `<div class="th"><span class="tg" style="color:var(${EL_VAR[s % 4]})">${sg(s)}</span> ${inf.name}</div>`;
  h += `<div class="muted">${inf.element} · ${inf.mode} · ${inf.polarity}</div>`;
  h += row('Ruler', inf.trad === inf.modern ? inf.trad : `${inf.modern} · trad. ${inf.trad}`);
  h += row('Exaltation', inf.exalted || '—');
  h += row('Detriment', inf.detriment.join(', ') || '—');
  h += row('Fall', inf.fall.join(', ') || '—');
  const cusps = chart.cusps
    .map((c, i) => [c, i])
    .filter(([c]) => Math.floor(c / 30) === s)
    .map(([, i]) => `H${i + 1}`);
  h += row('House cusps', cusps.join(', ') || '— (intercepted or none)');
  const inside = st.ctx.chart.pts.filter((p) => Math.floor(p.lon / 30) === s).sort((a, b) => a.lon - b.lon);
  if (inside.length) {
    h += `<div class="tsub">Bodies in ${inf.name}</div>`;
    h += inside
      .map((p) =>
        row(pn(p.name), `${fmtPos(p.lon).deg}°${pad(fmtPos(p.lon).min)}′${p.retro ? ' R' : ''} · H${houseOf(p.lon)}`),
      )
      .join('');
  }
  return h;
}

// What each house covers, in plain words, plus its traditional (Latin) name.
const HOUSE_MEANING = [
  [
    'Vita',
    'Self, body and appearance',
    'How you meet the world: your body, temperament, first impressions and the way you start things.',
  ],
  [
    'Lucrum',
    'Money and possessions',
    'What you own and earn, your resources, and what you value, including your sense of self-worth.',
  ],
  [
    'Fratres',
    'Communication and surroundings',
    'Siblings, neighbours, short trips, everyday talk and writing, and early learning.',
  ],
  ['Genitor', 'Home and roots', 'Family, ancestry, a parent, your home and private life, and how matters end.'],
  ['Nati', 'Creativity and pleasure', 'Children, romance, play, art, hobbies and whatever you do for joy.'],
  ['Valetudo', 'Work and health', 'Daily routines and duties, the work you do, health and illness, service, and pets.'],
  ['Uxor', 'Partners', 'One-to-one relationships: marriage, close partnerships, contracts and open rivals.'],
  [
    'Mors',
    'Shared resources and transformation',
    "Other people's money, debts, inheritance, intimacy, crisis, death and rebirth.",
  ],
  ['Iter', 'Beliefs and long journeys', 'Travel abroad, higher education, philosophy, religion, law and publishing.'],
  [
    'Regnum',
    'Career and reputation',
    'Your public role, vocation, ambition, achievements and standing in the world. Also a parent.',
  ],
  [
    'Benefacta',
    'Friends and community',
    'Friends, groups and networks, allies and patrons, and your hopes for the future.',
  ],
  [
    'Carcer',
    'The hidden and solitude',
    'Retreat and solitude, secrets, hidden enemies, hospitals and other institutions, the unconscious, and self-undoing.',
  ],
];
const HOUSE_KIND = ['Angular', 'Succedent', 'Cadent'];
const HOUSE_SYSTEMS = {
  placidus: [
    'Placidus',
    'Divides the time each degree takes to rise from the IC to the Ascendant to the Midheaven into thirds. The most widely used modern system. Houses come out unequal, and it breaks down above about 66° latitude.',
  ],
  whole: [
    'Whole sign',
    'Each sign is one house, starting with the rising sign as the 1st. The oldest system, from Hellenistic astrology. The Midheaven can fall in any house from the 9th to the 11th.',
  ],
  equal: [
    'Equal',
    'Twelve 30° houses measured from the exact degree of the Ascendant. The Midheaven floats and is not always the 10th cusp.',
  ],
  natural: [
    'Natural',
    'Aries is the 1st house, Taurus the 2nd, and so on, whatever the time or place. A flat view of the sky itself, useful for daily and mundane charts.',
  ],
};
function tipSystem(v) {
  const [name, text] = HOUSE_SYSTEMS[v] || [];
  if (!name) return '';
  const active = st.ctx && st.ctx.chart.system === v;
  return `<div class="th">${name} houses${active ? ' <span class="badge">in use</span>' : ''}</div><div class="tplain">${text}</div>`;
}
function tipAllHouses() {
  let h = `<div class="th">The twelve houses</div><div class="muted tnote" style="margin:0 0 6px">Each house is one area of life. Hover a house number on the wheel for its cusp, ruler and the planets in it.</div>`;
  h +=
    '<div class="hlist">' +
    HOUSE_MEANING.map(
      ([, topic, plain], i) =>
        `<div><b>${i + 1}</b><span><span class="ht">${topic}</span><span class="hp">${plain}</span></span></div>`,
    ).join('') +
    '</div>';
  return h;
}

function tipHouse(i) {
  const { chart, houseOf } = st.ctx;
  const c = chart.cusps[i],
    next = chart.cusps[(i + 1) % 12];
  const sign = Math.floor(c / 30);
  const size = norm(next - c);
  const [latin, topic, plain] = HOUSE_MEANING[i];
  let h = `<div class="th">House ${i + 1} · ${topic}</div>`;
  h += `<div class="tplain">${plain}</div>`;
  h += `<div class="tpos">Cusp ${dms(c)}</div>`;
  h += row('Type', `${HOUSE_KIND[i % 3]} · natural sign ${Western.SIGNS[i]}`);
  h += row('Traditional name', `<i>${latin}</i>`);
  h += row('Size', `${dm(size)}`);
  const inf = Western.signInfo(sign);
  h += row(
    'Cusp ruler',
    inf.trad === inf.modern ? `${inf.trad} in ${whereIs(inf.trad)}` : `${inf.modern} in ${whereIs(inf.modern)}`,
  );
  if (inf.trad !== inf.modern) h += row('Trad. ruler', `${inf.trad} in ${whereIs(inf.trad)}`);
  const intercepted = [];
  for (let s = 0; s < 12; s++)
    if (norm(s * 30 - c) < size && norm(s * 30 + 30 - c) <= size && norm(s * 30 - c) > 0)
      intercepted.push(Western.SIGNS[s]);
  if (intercepted.length) h += row('Intercepted', intercepted.join(', '));
  const inside = chart.pts.filter((p) => houseOf(p.lon) === i + 1).sort((a, b) => norm(a.lon - c) - norm(b.lon - c));
  if (inside.length) {
    h += `<div class="tsub">Bodies in house ${i + 1}</div>`;
    h += inside.map((p) => row(pn(p.name), `${fmtPos(p.lon).text}${p.retro ? ' R' : ''}`)).join('');
  } else h += `<div class="muted tnote">Empty house</div>`;
  if (chart.system === 'natural' || chart.system === 'whole' || chart.system === 'equal')
    h += `<div class="muted tnote">${{ natural: 'Natural houses', whole: 'Whole sign houses', equal: 'Equal houses' }[chart.system]}</div>`;
  return h;
}

function tipAngle(lab) {
  const { chart, houseOf } = st.ctx;
  const map = {
    AC: ['Ascendant', chart.asc],
    DC: ['Descendant', chart.asc + 180],
    MC: ['Midheaven', chart.mc],
    IC: ['Imum Coeli', chart.mc + 180],
    Vx: ['Vertex', chart.vertex],
  };
  const [name, lon] = map[lab];
  const sign = Math.floor(norm(lon) / 30);
  let h = `<div class="th">${name}</div><div class="tpos">${dms(lon)}</div>`;
  const inf = Western.signInfo(sign);
  h += row(lab === 'AC' ? 'Chart ruler' : 'Ruler', `${inf.modern} in ${whereIs(inf.modern)}`);
  if (inf.trad !== inf.modern) h += row('Trad. ruler', `${inf.trad} in ${whereIs(inf.trad)}`);
  if (lab === 'Vx') h += row('Anti-vertex', fmtPos(lon + 180).text) + row('House', `H${houseOf(lon)}`);
  if (lab === 'AC' || lab === 'MC') h += row('RAMC', `${chart.ramc.toFixed(2)}°`);
  if (lab === 'AC' || lab === 'DC' || lab === 'MC' || lab === 'IC') {
    const near = chart.pts
      .map((p) => ({ p, orb: Western.sep(p.lon, lon) }))
      .filter((x) => x.orb <= 5)
      .sort((a, b) => a.orb - b.orb);
    if (near.length) {
      h +=
        `<div class="tsub">Conjunct (≤5°)</div>` + near.map((x) => row(pn(x.p.name), `${x.orb.toFixed(2)}°`)).join('');
    }
  }
  h += row('Obliquity', `${chart.eps.toFixed(4)}°`);
  return h;
}

function tipAspect(i) {
  const a = st.ctx.asps[i];
  if (!a) return '';
  const pa = st.ctx.byName[a.a],
    pb = st.ctx.byName[a.b];
  let h = `<div class="th">${pn(a.a)} <span class="tg" style="color:${ASPECT_COLOR[a.type.key]}">${ASPECT_GLYPH[a.type.key]}${VS}</span> ${pn(a.b)}</div>`;
  h += `<div class="muted">${a.type.name} (${a.type.angle}°) · orb allowed ${a.type.orb}°</div>`;
  h += row('Orb', `${a.orb.toFixed(2)}° · ${a.applying ? 'applying' : 'separating'}`);
  h += row('Separation', `${Western.sep(pa.lon, pb.lon).toFixed(2)}°`);
  h += row(LABEL[a.a] || a.a, `${fmtPos(pa.lon).text}${pa.retro ? ' R' : ''}`);
  h += row(LABEL[a.b] || a.b, `${fmtPos(pb.lon).text}${pb.retro ? ' R' : ''}`);
  return h;
}

Object.assign(tips, {
  planet: tipPlanet,
  angle: tipAngle,
  hsys: tipSystem,
  houses: tipAllHouses,
  sign: (v) => tipSign(+v),
  house: (v) => tipHouse(+v),
  aspect: (v) => tipAspect(+v),
  ph: (v) =>
    `<div class="th">${g(v)} ${v}</div><div class="tplain">${Western.HOUR_MEANING[v]}</div><div class="muted tnote">In the tradition of planetary hours, a matter is begun in the hour of the planet that rules it.</div>`,
});

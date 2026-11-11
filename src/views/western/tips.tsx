// Western tab: what the tooltips say about planets, signs, houses, angles and aspects.
import { Western } from '#astro';
import { APPROX, ASPECT_COLOR, ASPECT_GLYPH, EL_VAR, LABEL, VS } from '#lib/constants.ts';
import { dm, fmtPos, g, norm, pad, sg } from '#lib/format.ts';
import { tips, chartContext } from '#lib/state.ts';
import { Dms, PlanetName, TipHead, TipNote, TipPos, TipRow, TipSub, TipText } from '#components/Tip.tsx';

function whereIs(name: string) {
  const p = chartContext().byName[name];
  if (!p) return '';
  return `${fmtPos(p.lon).text}, H${chartContext().houseOf(p.lon)}${p.retro ? ', R' : ''}`;
}

const AspectGlyph = ({ type }: { type: string }) => (
  <span class="tg" style={`color:${ASPECT_COLOR[type]}`}>
    {ASPECT_GLYPH[type]}
    {VS}
  </span>
);

function TipPlanet({ name }: { name: string }) {
  const { chart, asps, byName, houseOf } = chartContext();
  const p = byName[name];
  const sign = Math.floor(p.lon / 30);
  const motion = Math.abs(p.speed) < 0.003 ? 'Stationary' : p.retro ? 'Retrograde' : 'Direct';
  const oob = Math.abs(p.decl) > chart.eps;
  const dig = Western.dignity(name, sign);
  const rules: string[] = [];
  chart.cusps.forEach((c, i) => {
    const inf = Western.signInfo(Math.floor(c / 30));
    if (inf.modern === name || inf.trad === name) rules.push(`H${i + 1}${inf.modern !== name ? '*' : ''}`);
  });
  const mine = asps.filter((a) => a.a === name || a.b === name);
  return (
    <>
      <TipHead>
        <PlanetName name={name} />
        {APPROX.includes(name) && (
          <>
            {' '}
            <span class="badge">≈ approx.</span>
          </>
        )}
      </TipHead>
      <TipPos>
        <Dms lon={p.lon} />
      </TipPos>
      <TipRow k="House">H{houseOf(p.lon)}</TipRow>
      <TipRow k="Motion">
        {motion} · {p.speed >= 0 ? '+' : '−'}
        {dm(p.speed)}/day
      </TipRow>
      {name !== 'Node' && name !== 'Lilith' && (
        <TipRow k="Latitude">
          {p.lat >= 0 ? '+' : '−'}
          {dm(p.lat)}
        </TipRow>
      )}
      <TipRow k="Declination">
        {dm(p.decl)} {p.decl >= 0 ? 'N' : 'S'}
        {oob && (
          <>
            {' '}
            <span class="badge warn">out of bounds</span>
          </>
        )}
      </TipRow>
      {dig && <TipRow k="Dignity">{dig}</TipRow>}
      {rules.length > 0 && (
        <TipRow k="Rules">
          {rules.join(', ')}
          {rules.some((r) => r.endsWith('*')) && <span class="muted"> (*traditional)</span>}
        </TipRow>
      )}
      {name === 'Node' && <TipRow k="South Node">{fmtPos(p.lon + 180).text}</TipRow>}
      <TipRow k="Antiscion">{fmtPos(180 - p.lon).text}</TipRow>
      <TipRow k="Contra-antiscion">{fmtPos(360 - p.lon).text}</TipRow>
      {mine.length > 0 && <TipSub>Aspects</TipSub>}
      {mine.map((a) => (
        <div class="tr">
          <span>
            <AspectGlyph type={a.type.key} /> <PlanetName name={a.a === name ? a.b : a.a} />
          </span>
          <span>
            {a.orb.toFixed(2)}° {a.applying ? 'app.' : 'sep.'}
          </span>
        </div>
      ))}
      {name === 'Lilith' && <TipNote>Mean Black Moon Lilith (lunar apogee)</TipNote>}
      {name === 'Node' && <TipNote>True node</TipNote>}
    </>
  );
}

function TipSign({ s }: { s: number }) {
  const { chart, houseOf } = chartContext();
  const inf = Western.signInfo(s);
  const cusps = chart.cusps
    .map((c, i) => [c, i])
    .filter(([c]) => Math.floor(c / 30) === s)
    .map(([, i]) => `H${i + 1}`);
  const inside = chart.pts.filter((p) => Math.floor(p.lon / 30) === s).sort((a, b) => a.lon - b.lon);
  return (
    <>
      <TipHead>
        <span class="tg" style={`color:var(${EL_VAR[s % 4]})`}>
          {sg(s)}
        </span>{' '}
        {inf.name}
      </TipHead>
      <div class="muted">
        {inf.element} · {inf.mode} · {inf.polarity}
      </div>
      <TipRow k="Ruler">{inf.trad === inf.modern ? inf.trad : `${inf.modern} · trad. ${inf.trad}`}</TipRow>
      <TipRow k="Exaltation">{inf.exalted || '—'}</TipRow>
      <TipRow k="Detriment">{inf.detriment.join(', ') || '—'}</TipRow>
      <TipRow k="Fall">{inf.fall.join(', ') || '—'}</TipRow>
      <TipRow k="House cusps">{cusps.join(', ') || '— (intercepted or none)'}</TipRow>
      {inside.length > 0 && <TipSub>Bodies in {inf.name}</TipSub>}
      {inside.map((p) => (
        <TipRow k={<PlanetName name={p.name} />}>
          {fmtPos(p.lon).deg}°{pad(fmtPos(p.lon).min)}′{p.retro ? ' R' : ''} · H{houseOf(p.lon)}
        </TipRow>
      ))}
    </>
  );
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
const HOUSE_SYSTEMS: Record<string, [name: string, about: string]> = {
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
function TipSystem({ v }: { v: string }) {
  const [name, text] = HOUSE_SYSTEMS[v];
  return (
    <>
      <TipHead>
        {name} houses
        {chartContext().chart.system === v && (
          <>
            {' '}
            <span class="badge">in use</span>
          </>
        )}
      </TipHead>
      <TipText>{text}</TipText>
    </>
  );
}

function TipAllHouses() {
  return (
    <>
      <TipHead>The twelve houses</TipHead>
      <div class="muted tnote" style="margin:0 0 6px">
        Each house is one area of life. Hover a house number on the wheel for its cusp, ruler and the planets in it.
      </div>
      <div class="hlist">
        {HOUSE_MEANING.map(([, topic, plain], i) => (
          <div>
            <b>{i + 1}</b>
            <span>
              <span class="ht">{topic}</span>
              <span class="hp">{plain}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

const SYSTEM_NOTE: Record<string, string> = {
  natural: 'Natural houses',
  whole: 'Whole sign houses',
  equal: 'Equal houses',
};

function TipHouse({ i }: { i: number }) {
  const { chart, houseOf } = chartContext();
  const c = chart.cusps[i],
    next = chart.cusps[(i + 1) % 12];
  const size = norm(next - c);
  const [latin, topic, plain] = HOUSE_MEANING[i];
  const inf = Western.signInfo(Math.floor(c / 30));
  const intercepted = [];
  for (let s = 0; s < 12; s++)
    if (norm(s * 30 - c) < size && norm(s * 30 + 30 - c) <= size && norm(s * 30 - c) > 0)
      intercepted.push(Western.SIGNS[s]);
  const inside = chart.pts.filter((p) => houseOf(p.lon) === i + 1).sort((a, b) => norm(a.lon - c) - norm(b.lon - c));
  return (
    <>
      <TipHead>
        House {i + 1} · {topic}
      </TipHead>
      <TipText>{plain}</TipText>
      <TipPos>
        Cusp <Dms lon={c} />
      </TipPos>
      <TipRow k="Type">
        {HOUSE_KIND[i % 3]} · natural sign {Western.SIGNS[i]}
      </TipRow>
      <TipRow k="Traditional name">
        <i>{latin}</i>
      </TipRow>
      <TipRow k="Size">{dm(size)}</TipRow>
      <TipRow k="Cusp ruler">
        {inf.trad === inf.modern ? `${inf.trad} in ${whereIs(inf.trad)}` : `${inf.modern} in ${whereIs(inf.modern)}`}
      </TipRow>
      {inf.trad !== inf.modern && <TipRow k="Trad. ruler">{`${inf.trad} in ${whereIs(inf.trad)}`}</TipRow>}
      {intercepted.length > 0 && <TipRow k="Intercepted">{intercepted.join(', ')}</TipRow>}
      {inside.length > 0 ? <TipSub>Bodies in house {i + 1}</TipSub> : <TipNote>Empty house</TipNote>}
      {inside.map((p) => (
        <TipRow k={<PlanetName name={p.name} />}>
          {fmtPos(p.lon).text}
          {p.retro ? ' R' : ''}
        </TipRow>
      ))}
      {SYSTEM_NOTE[chart.system] && <TipNote>{SYSTEM_NOTE[chart.system]}</TipNote>}
    </>
  );
}

function TipAngle({ lab }: { lab: string }) {
  const { chart, houseOf } = chartContext();
  const map: Record<string, [name: string, lon: number]> = {
    AC: ['Ascendant', chart.asc],
    DC: ['Descendant', chart.asc + 180],
    MC: ['Midheaven', chart.mc],
    IC: ['Imum Coeli', chart.mc + 180],
    Vx: ['Vertex', chart.vertex],
  };
  const [name, lon] = map[lab];
  const inf = Western.signInfo(Math.floor(norm(lon) / 30));
  const near = ['AC', 'DC', 'MC', 'IC'].includes(lab)
    ? chart.pts
        .map((p) => ({ p, orb: Western.sep(p.lon, lon) }))
        .filter((x) => x.orb <= 5)
        .sort((a, b) => a.orb - b.orb)
    : [];
  return (
    <>
      <TipHead>{name}</TipHead>
      <TipPos>
        <Dms lon={lon} />
      </TipPos>
      <TipRow k={lab === 'AC' ? 'Chart ruler' : 'Ruler'}>{`${inf.modern} in ${whereIs(inf.modern)}`}</TipRow>
      {inf.trad !== inf.modern && <TipRow k="Trad. ruler">{`${inf.trad} in ${whereIs(inf.trad)}`}</TipRow>}
      {lab === 'Vx' && (
        <>
          <TipRow k="Anti-vertex">{fmtPos(lon + 180).text}</TipRow>
          <TipRow k="House">H{houseOf(lon)}</TipRow>
        </>
      )}
      {(lab === 'AC' || lab === 'MC') && <TipRow k="RAMC">{chart.ramc.toFixed(2)}°</TipRow>}
      {near.length > 0 && <TipSub>Conjunct (≤5°)</TipSub>}
      {near.map((x) => (
        <TipRow k={<PlanetName name={x.p.name} />}>{x.orb.toFixed(2)}°</TipRow>
      ))}
      <TipRow k="Obliquity">{chart.eps.toFixed(4)}°</TipRow>
    </>
  );
}

function TipAspect({ i }: { i: number }) {
  const { asps, byName } = chartContext();
  const a = asps[i];
  const pa = byName[a.a],
    pb = byName[a.b];
  return (
    <>
      <TipHead>
        <PlanetName name={a.a} /> <AspectGlyph type={a.type.key} /> <PlanetName name={a.b} />
      </TipHead>
      <div class="muted">
        {a.type.name} ({a.type.angle}°) · orb allowed {a.type.orb}°
      </div>
      <TipRow k="Orb">
        {a.orb.toFixed(2)}° · {a.applying ? 'applying' : 'separating'}
      </TipRow>
      <TipRow k="Separation">{Western.sep(pa.lon, pb.lon).toFixed(2)}°</TipRow>
      <TipRow k={LABEL[a.a] || a.a}>
        {fmtPos(pa.lon).text}
        {pa.retro ? ' R' : ''}
      </TipRow>
      <TipRow k={LABEL[a.b] || a.b}>
        {fmtPos(pb.lon).text}
        {pb.retro ? ' R' : ''}
      </TipRow>
    </>
  );
}

// each returns null when there is nothing to say about that value
Object.assign(tips, {
  planet: (v: string) => (chartContext().byName[v] ? <TipPlanet name={v} /> : null),
  angle: (v: string) => <TipAngle lab={v} />,
  hsys: (v: string) => (HOUSE_SYSTEMS[v] ? <TipSystem v={v} /> : null),
  houses: () => <TipAllHouses />,
  sign: (v: string) => <TipSign s={+v} />,
  house: (v: string) => <TipHouse i={+v} />,
  aspect: (v: string) => (chartContext().asps[+v] ? <TipAspect i={+v} /> : null),
  ph: (v: string) => (
    <>
      <TipHead>
        {g(v)} {v}
      </TipHead>
      <TipText>{Western.HOUR_MEANING[v]}</TipText>
      <TipNote>In the tradition of planetary hours, a matter is begun in the hour of the planet that rules it.</TipNote>
    </>
  ),
});

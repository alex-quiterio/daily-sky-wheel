// Vedic tab: what its tooltips say.
import * as Vedic from '#astro/vedic.ts';
import { pad } from '#lib/format.ts';
import { tips } from '#lib/state.ts';
import { TipHead, TipRow, TipText } from '#components/Tip.tsx';
import { DIGNITY_TIP } from '#views/vedic/constants.ts';
import { vdLast } from '#views/vedic/model.ts';

const LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const RASHI_LORDS = [
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

function TipNakshatra({ i }: { i: number }) {
  const [name, deity, meaning] = Vedic.NAKSHATRAS[i];
  const from = (i * 360) / 27,
    sign = (x: number) =>
      `${Math.floor(x % 30)}°${pad(Math.round(((x % 30) % 1) * 60))}′ ${Vedic.RASHIS[Math.floor(x / 30)][1]}`;
  return (
    <>
      <TipHead>
        {i + 1}. {name}
      </TipHead>
      <TipText>{meaning}</TipText>
      <TipRow k="Deity">{deity}</TipRow>
      <TipRow k="Ruler">{LORDS[i % 9]}</TipRow>
      <TipRow k="Span">{`${sign(from)} – ${sign(from + 360 / 27 - 0.0001)}`}</TipRow>
    </>
  );
}

function TipRashi({ sign }: { sign: number }) {
  const [en, skt, dev] = Vedic.RASHIS[sign];
  const inside = vdLast
    ? vdLast.g.list
        .filter((x) => x.sign === sign)
        .map((x) => `${x.key} ${Math.floor(x.deg)}°`)
        .join(', ')
    : '';
  const house = vdLast ? ((sign - vdLast.lagnaSign + 12) % 12) + 1 : '';
  return (
    <>
      <TipHead>
        <span class="dev">{dev}</span> {skt} · {en}
      </TipHead>
      <TipRow k="House">H{house}</TipRow>
      <TipRow k="Lord">{RASHI_LORDS[sign]}</TipRow>
      {inside && <TipRow k="Grahas">{inside}</TipRow>}
    </>
  );
}

function TipGraha({ x, lagnaSign }: { x: Vedic.Graha; lagnaSign: number }) {
  const [, skt, dev] = Vedic.GRAHAS.find((q) => q[0] === x.key)!;
  return (
    <>
      <TipHead>
        <span class="dev">{dev}</span> {skt} · {x.key}
      </TipHead>
      <TipRow k="Position">
        {`${Math.floor(x.deg)}°${pad(Math.floor((x.deg % 1) * 60))}′ ${Vedic.RASHIS[x.sign][1]}`}
      </TipRow>
      <TipRow k="Nakshatra">
        {Vedic.NAKSHATRAS[x.nak.i][0]} · pada {x.nak.pada}
      </TipRow>
      <TipRow k="House">H{((x.sign - lagnaSign + 12) % 12) + 1}</TipRow>
      {x.dignity && <TipRow k="Dignity">{x.dignity}</TipRow>}
      {x.retro && x.key !== 'Rahu' && x.key !== 'Ketu' && <TipRow k="Motion">Retrograde (vakri)</TipRow>}
    </>
  );
}

Object.assign(tips, {
  'vd-nak': (v: string) => <TipNakshatra i={+v} />,
  'vd-rashi': (v: string) => <TipRashi sign={+v} />,
  'vd-graha': (v: string) => {
    const x = vdLast?.g.list.find((q) => q.key === v);
    return vdLast && x ? <TipGraha x={x} lagnaSign={vdLast.lagnaSign} /> : null;
  },
  'vd-dig': (v: string) => {
    const tip = DIGNITY_TIP[v];
    if (!tip) return null;
    return (
      <>
        <TipHead>{tip[0]}</TipHead>
        <TipText>{tip[1]}</TipText>
      </>
    );
  },
});

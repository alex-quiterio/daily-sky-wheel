// Solar System tab: what its tooltips say. They describe the model the tab last drew.
import * as Western from '#astro/western.ts';
import { tips } from '#lib/state.ts';
import { sg } from '#lib/format.ts';
import { Dms, TipHead, TipRow, TipText } from '#components/Tip.tsx';
import { ELEMENTS, KM_PER_AU, LIGHT_MIN_PER_AU } from '#views/solar/constants.ts';
import { BODY_GLYPH } from '#views/solar/draw.ts';
import type { Model } from '#views/solar/types.ts';

let shown: Model | null = null;
export const showing = (model: Model) => {
  shown = model;
};

export const au = (x: number) => `${x.toFixed(x < 10 ? 3 : 2)} au`;
export function lightTime(x: number) {
  const min = x * LIGHT_MIN_PER_AU;
  if (min < 60) return `${min.toFixed(1)} light-min`;
  const total = Math.round(min),
    h = Math.floor(total / 60);
  return `${h} h ${total - h * 60} min of light`;
}
export function period(days: number) {
  return days < 1000 ? `${Math.round(days)} days` : `${(days / 365.256).toFixed(days < 20000 ? 1 : 0)} years`;
}

const ABOUT: Record<string, string> = {
  Mercury: 'The smallest planet and the quickest, never far from the Sun in our sky.',
  Venus: 'Wrapped in cloud, the brightest planet in the sky, and the nearest to the Earth at its closest.',
  Earth: 'Home. Seen from the Sun it always stands opposite where the Sun stands in our sky.',
  Mars: 'The red planet. It looks retrograde when the Earth overtakes it on the inside track.',
  Jupiter: 'The giant: more than twice the mass of all the other planets put together.',
  Saturn: 'The ringed planet, farthest of the seven visible to the eye.',
  Uranus: 'An ice giant tipped on its side, found by William Herschel in 1781.',
  Neptune: 'An ice giant found in 1846 where the maths of Uranus’s orbit said it must be.',
  Pluto: 'A dwarf planet on a tilted, stretched orbit that dips inside Neptune’s.',
};

function TipBody({ name }: { name: string }) {
  const b = shown?.byName[name];
  if (!b) return null;
  return (
    <>
      <TipHead>
        <span class="tg">{BODY_GLYPH[name]}</span> {name}
      </TipHead>
      <TipText>{ABOUT[name]}</TipText>
      <TipRow k="From the Sun">
        {au(b.sun)} · {((b.sun * KM_PER_AU) / 1e6).toFixed(1)} million km
      </TipRow>
      {name !== 'Earth' && (
        <TipRow k="From the Earth">
          {au(b.earth)} · {lightTime(b.earth)}
        </TipRow>
      )}
      <TipRow k="Seen from the Sun">
        <Dms lon={b.lon} />
      </TipRow>
      {name !== 'Earth' && (
        <TipRow k="Seen from the Earth">
          <Dms lon={b.geoLon} />
          {b.retro ? ' ℞' : ''}
        </TipRow>
      )}
      <TipRow k="Orbital speed">{b.speed.toFixed(1)} km/s</TipRow>
      <TipRow k="One orbit">{period(ELEMENTS[name][5])}</TipRow>
      <TipRow k="Since perihelion">{Math.round(b.progress * 100)}% of the way round</TipRow>
    </>
  );
}

function TipMoon() {
  if (!shown) return null;
  const { moon } = shown;
  return (
    <>
      <TipHead>
        <span class="tg">☽</span> Moon
      </TipHead>
      <TipText>Drawn far from scale on the orrery: the Moon never strays more than 0.003 au from the Earth.</TipText>
      <TipRow k="Phase">
        {moon.phase.name} · {Math.round(moon.phase.illum * 100)}% lit
      </TipRow>
      <TipRow k="From the Earth">
        {Math.round(moon.km).toLocaleString('en-GB')} km · {(moon.km / 299792.458 || 0).toFixed(2)} light-s
      </TipRow>
      <TipRow k="Position">
        <Dms lon={moon.geoLon} />
      </TipRow>
    </>
  );
}

function TipSun() {
  return (
    <>
      <TipHead>
        <span class="tg">☉</span> Sun
      </TipHead>
      <TipText>The centre of it all, holding 99.86% of the Solar System's mass. Not to scale.</TipText>
    </>
  );
}

function TipSign({ s }: { s: number }) {
  const inside = shown?.bodies.filter((b) => Math.floor(b.lon / 30) === s).map((b) => b.name) ?? [];
  return (
    <>
      <TipHead>
        <span class="tg">{sg(s)}</span> {Western.SIGNS[s]}
      </TipHead>
      <TipText>
        The stretch of the ecliptic from {s * 30}° to {s * 30 + 30}°, here as seen from the Sun.
      </TipText>
      <TipRow k="Planets here">{inside.length ? inside.join(', ') : 'none'}</TipRow>
    </>
  );
}

Object.assign(tips, {
  'sol-body': (v: string) => <TipBody name={v} />,
  'sol-moon': () => <TipMoon />,
  'sol-sun': () => <TipSun />,
  'sol-sign': (v: string) => <TipSign s={+v} />,
});

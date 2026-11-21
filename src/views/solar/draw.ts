// Solar System tab: SVG drawings. The orrery looks down on the ecliptic at a slant, from above its north pole, so
// the orbits open out into ellipses; 0° Aries is to the right and the planets go round anticlockwise. Distances are
// squeezed on a log scale so Mercury and Pluto both fit.
import { EL_VAR, SIGN_GLYPH, VS } from '#lib/constants.ts';
import { el } from '#lib/dom.ts';
import { COLOR, ELEMENTS, PLANETS, SIZE } from '#views/solar/constants.ts';
import type { Body, Model } from '#views/solar/types.ts';

const D2R = Math.PI / 180;
const CX = 300,
  CY = 180; // the Sun, in the drawing
export const TILT = 0.5; // how far the view is flattened: 1 straight down, 0 edge-on (here, about 60° from overhead)
const INNER = 30,
  OUTER = 246; // radius of the Sun's edge and of the farthest orbit
const SPREAD = Math.log(1 + 50 / 0.25);
export const radius = (au: number) => INNER + ((OUTER - INNER) * Math.log(1 + au / 0.25)) / SPREAD;

// a point on the drawing at drawing radius r and ecliptic longitude a (radians)
const at = (r: number, a: number): [number, number] => [CX + r * Math.cos(a), CY - r * Math.sin(a) * TILT];

// a point on the drawing for heliocentric ecliptic x, y in au
const place = (x: number, y: number) => at(radius(Math.hypot(x, y)), Math.atan2(y, x));

// the orbit from its mean elements, as a closed path
function orbitPath(name: string): string {
  const [a, e, inc, node, peri] = ELEMENTS[name];
  const O = node * D2R,
    i = inc * D2R,
    w = (peri - node) * D2R;
  const pts: string[] = [];
  for (let k = 0; k < 240; k++) {
    const v = (k / 240) * 2 * Math.PI;
    const r = (a * (1 - e * e)) / (1 + e * Math.cos(v)),
      u = w + v;
    const x = r * (Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i));
    const y = r * (Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i));
    const [px, py] = place(x, y);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}
// the orbits never change, so their paths are worked out once
const ORBIT_PATHS: Record<string, string> = {};
const orbitOf = (name: string) => (ORBIT_PATHS[name] ??= orbitPath(name));

export const BODY_GLYPH: Record<string, string> = {
  Mercury: '☿',
  Venus: '♀',
  Earth: '⊕',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  Moon: '☽',
  Lilith: '⚸',
};

function gradients(svg: SVGSVGElement) {
  const defs = el('defs', {}, svg);
  const sun = el('radialGradient', { id: 'solSun' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#fffbe6' }, sun);
  el('stop', { offset: '45%', 'stop-color': '#ffd36b' }, sun);
  el('stop', { offset: '100%', 'stop-color': '#ff9a3c' }, sun);
  const halo = el('radialGradient', { id: 'solHalo' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#ffcf6b', 'stop-opacity': 0.55 }, halo);
  el('stop', { offset: '100%', 'stop-color': '#ffcf6b', 'stop-opacity': 0 }, halo);
}

export function drawOrrery(svg: SVGSVGElement, model: Model) {
  svg.innerHTML = '';
  gradients(svg);
  // the zodiac, by heliocentric longitude
  [262, 290].forEach((rx) =>
    el('ellipse', { cx: CX, cy: CY, rx, ry: rx * TILT, fill: 'none', stroke: 'var(--rule)' }, svg),
  );
  for (let s = 0; s < 12; s++) {
    const a = s * 30 * D2R,
      [lx, ly] = at(276, (s * 30 + 15) * D2R);
    const [x1, y1] = at(262, a),
      [x2, y2] = at(290, a);
    el('line', { x1, y1, x2, y2, stroke: 'var(--rule)' }, svg);
    el(
      'text',
      {
        x: lx,
        y: ly,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': 15,
        fill: `var(${EL_VAR[s % 4]})`,
        'font-family': 'var(--f-glyph)',
        class: 'tipzone',
        'data-tip': `sol-sign:${s}`,
      },
      svg,
      SIGN_GLYPH[s] + VS,
    );
  }
  // orbits, then the planets on them
  PLANETS.forEach((name) =>
    el(
      'path',
      {
        d: orbitOf(name),
        fill: 'none',
        stroke: name === 'Earth' ? 'rgba(111, 183, 255, 0.45)' : 'var(--sol-orbit)',
        'stroke-width': name === 'Earth' ? 1.2 : 0.9,
      },
      svg,
    ),
  );
  // the far side first, then the Sun, then the near side, so the nearer body covers the farther
  const drawn = model.bodies.map((b) => ({ b, xy: place(b.x, b.y) }));
  const far = drawn.filter(({ xy }) => xy[1] < CY),
    near = drawn.filter(({ xy }) => xy[1] >= CY);
  far.forEach(({ b, xy }) => drawBody(svg, model, b, xy));
  // the Sun
  el('circle', { cx: CX, cy: CY, r: 46, fill: 'url(#solHalo)', class: 'sol-halo' }, svg);
  el(
    'circle',
    { cx: CX, cy: CY, r: 16, fill: 'url(#solSun)', class: 'tipzone', 'data-tip': 'sol-sun:', tabindex: 0 },
    svg,
  );
  near.forEach(({ b, xy }) => drawBody(svg, model, b, xy));
}

function drawBody(svg: SVGSVGElement, model: Model, b: Body, [x, y]: [number, number]) {
  const r = SIZE[b.name];
  const g = el(
    'g',
    { class: 'tipzone sol-body', 'data-tip': `sol-body:${b.name}`, tabindex: 0, 'aria-label': `${b.name} details` },
    svg,
  );
  // a hit area bigger than the dot
  el('circle', { cx: x, cy: y, r: Math.max(r + 6, 11), fill: 'transparent' }, g);
  if (b.name === 'Saturn')
    el(
      'ellipse',
      {
        cx: x,
        cy: y,
        rx: r * 1.9,
        ry: r * 0.7,
        fill: 'none',
        stroke: COLOR.Saturn,
        'stroke-width': 1.3,
        transform: `rotate(-20 ${x} ${y})`,
      },
      g,
    );
  // the side facing the Sun is lit
  const toSun = Math.atan2(CY - y, CX - x) / D2R;
  el('circle', { cx: x, cy: y, r, fill: COLOR[b.name] }, g);
  el(
    'path',
    {
      d: `M${x},${y - r}A${r},${r} 0 0 1 ${x},${y + r}Z`,
      fill: 'rgba(0, 0, 0, 0.55)',
      transform: `rotate(${toSun + 180} ${x} ${y})`,
    },
    g,
  );
  // the label sits outward from the Sun
  const out = Math.atan2(y - CY, x - CX);
  el(
    'text',
    {
      x: x + Math.cos(out) * (r + 9),
      y: y + Math.sin(out) * (r + 9),
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': 13,
      fill: COLOR[b.name],
      'font-family': 'var(--f-glyph)',
      'pointer-events': 'none',
    },
    g,
    BODY_GLYPH[b.name] + VS,
  );
  // the Moon around the Earth, far from scale
  if (b.name === 'Earth') {
    const a = model.moon.geoLon * D2R;
    el(
      'ellipse',
      {
        cx: x,
        cy: y,
        rx: 12,
        ry: 12 * TILT,
        fill: 'none',
        stroke: 'rgba(245, 236, 208, 0.25)',
        'stroke-dasharray': '1 2',
      },
      g,
    );
    el(
      'circle',
      {
        cx: x + 12 * Math.cos(a),
        cy: y - 12 * TILT * Math.sin(a),
        r: 2.2,
        fill: COLOR.Moon,
        class: 'tipzone',
        'data-tip': 'sol-moon:',
      },
      g,
    );
  }
}

// the Earth and the Moon from above, the Sun's light coming in from its direction
export function drawEarthMoon(svg: SVGSVGElement, model: Model) {
  svg.innerHTML = '';
  const c = 180,
    { moon } = model;
  const orbit = (128 * moon.km) / 405500; // apogee at the edge
  const sunA = moon.sunLon * D2R,
    moonA = moon.geoLon * D2R;
  // sunlight
  for (let k = -3; k <= 3; k++) {
    const ox = -Math.sin(sunA) * k * 34,
      oy = -Math.cos(sunA) * k * 34;
    const x1 = c + Math.cos(sunA) * 172 + ox,
      y1 = c - Math.sin(sunA) * 172 + oy;
    const x2 = c + Math.cos(sunA) * 150 + ox,
      y2 = c - Math.sin(sunA) * 150 + oy;
    el(
      'line',
      { x1, y1, x2, y2, stroke: 'rgba(255, 211, 107, 0.55)', 'stroke-width': 1.4, 'stroke-linecap': 'round' },
      svg,
    );
  }
  el(
    'text',
    {
      x: c + Math.cos(sunA) * 138,
      y: c - Math.sin(sunA) * 138,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': 16,
      fill: '#ffd36b',
      'font-family': 'var(--f-glyph)',
    },
    svg,
    '☉' + VS,
  );
  el(
    'circle',
    { cx: c, cy: c, r: orbit, fill: 'none', stroke: 'rgba(245, 236, 208, 0.3)', 'stroke-dasharray': '2 4' },
    svg,
  );
  const lit = (x: number, y: number, r: number, fill: string, tip: string) => {
    const g = el('g', { class: 'tipzone', 'data-tip': tip, tabindex: 0 }, svg);
    el('circle', { cx: x, cy: y, r, fill }, g);
    el(
      'path',
      {
        d: `M${x},${y - r}A${r},${r} 0 0 1 ${x},${y + r}Z`,
        fill: 'rgba(4, 6, 20, 0.72)',
        transform: `rotate(${-moon.sunLon + 180} ${x} ${y})`,
      },
      g,
    );
  };
  // Black Moon Lilith: the direction of the Moon's apogee, marked at the edge, where an apogee distance falls
  const la = moon.lilith * D2R;
  el(
    'line',
    {
      x1: c + 26 * Math.cos(la),
      y1: c - 26 * Math.sin(la),
      x2: c + 128 * Math.cos(la),
      y2: c - 128 * Math.sin(la),
      stroke: 'rgba(196, 150, 255, 0.4)',
      'stroke-dasharray': '2 3',
    },
    svg,
  );
  const lg = el('g', { class: 'tipzone', 'data-tip': 'sol-lilith:', tabindex: 0, 'aria-label': 'Lilith details' }, svg);
  const lx = c + 128 * Math.cos(la),
    ly = c - 128 * Math.sin(la);
  el('circle', { cx: lx, cy: ly, r: 10, fill: 'rgba(10, 8, 24, 0.9)', stroke: '#c496ff', 'stroke-width': 1 }, lg);
  el(
    'text',
    {
      x: lx,
      y: ly,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': 12,
      fill: '#c496ff',
      'font-family': 'var(--f-glyph)',
    },
    lg,
    '⚸' + VS,
  );
  lit(c, c, 22, COLOR.Earth, 'sol-body:Earth');
  lit(c + orbit * Math.cos(moonA), c - orbit * Math.sin(moonA), 8, COLOR.Moon, 'sol-moon:');
}

// the Moon as it looks from the Earth: lit on the right while waxing (northern hemisphere)
export function phasePath(elong: number, r: number): string {
  const waxing = elong < 180;
  const rx = Math.abs(Math.cos(elong * D2R)) * r;
  const gibbous = elong > 90 && elong < 270;
  const outer = waxing ? 1 : 0;
  const back = waxing ? (gibbous ? 1 : 0) : gibbous ? 0 : 1;
  return `M0,${-r}A${r},${r} 0 0 ${outer} 0,${r}A${rx.toFixed(2)},${r} 0 0 ${back} 0,${-r}Z`;
}

export function drawPhase(svg: SVGSVGElement, model: Model) {
  svg.innerHTML = '';
  const g = el('g', { transform: 'translate(60 60)' }, svg);
  el('circle', { r: 46, fill: '#1a1a2a', stroke: 'rgba(245, 236, 208, 0.25)' }, g);
  el('path', { d: phasePath(model.moon.phase.elong, 46), fill: 'var(--moonlit)' }, g);
}

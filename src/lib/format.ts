// Positions, glyphs and labels as text.
import * as Core from '#astro/core.ts';
import { GLYPH, LABEL, SIGN_ABBR, SIGN_GLYPH, VS } from '#lib/constants.ts';

export const norm = Core.norm;

export const pad = (n: number | string) => String(n).padStart(2, '0');

export function fmtPos(l: number) {
  l = norm(l);
  const s = Math.floor(l / 30);
  const d = l - s * 30;
  let deg = Math.floor(d),
    min = Math.round((d - deg) * 60);
  if (min === 60) {
    min = 0;
    deg += 1;
  }
  return { deg, min, sign: s, text: `${deg}° ${SIGN_ABBR[s]} ${pad(min)}′` };
}

export const g = (name: string) => (GLYPH[name] || '') + (GLYPH[name] && GLYPH[name].length === 1 ? VS : '');

export const sg = (s: number) => SIGN_GLYPH[s] + VS;

export const slug = (x: unknown) =>
  String(x)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// 12°34′56″, the degrees within the sign; the sign itself is drawn by <Dms> in components/Tip.tsx
export function dms(l: number) {
  l = norm(l);
  const s = Math.floor(l / 30);
  const x = l - s * 30;
  let d = Math.floor(x),
    m = Math.floor((x - d) * 60),
    sec = Math.round(((x - d) * 60 - m) * 60);
  if (sec === 60) {
    sec = 0;
    m += 1;
  }
  if (m === 60) {
    m = 0;
    d += 1;
  }
  return `${d}°${pad(m)}′${pad(sec)}″`;
}

export const dm = (x: number) => {
  const a = Math.abs(x);
  const d = Math.floor(a);
  const m = Math.round((a - d) * 60);
  return `${d}°${pad(m === 60 ? 0 : m)}′`;
};

// a planet's or point's name as shown: Node -> North Node
export const label = (n: string) => LABEL[n] || n;

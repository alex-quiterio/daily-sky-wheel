// Chinese tab: what its tooltips say.
import { Chinese } from '#astro';
import { row } from '#lib/format.ts';
import { tips } from '#lib/state.ts';
import { EL_COLOR } from '#views/chinese/constants.ts';
import { cn, polarity } from '#views/chinese/model.ts';

function tipCnStem(s: number) {
  const [ch, py, elx, img, text] = Chinese.STEMS[s];
  let h = `<div class="th"><span class="zh" style="color:${EL_COLOR[elx]}">${ch}</span> ${py} · ${polarity(s % 2 === 0)} ${Chinese.ELEMENTS[elx]}</div>`;
  h += `<div class="tplain">Heavenly stem, the image of ${img}. ${text}</div>`;
  if (cn) {
    const g2 = Chinese.tenGod(cn.dm, s);
    h += row(
      'To the Day Master',
      s === cn.dm ? 'Same stem as the Day Master' : `<span class="zh">${g2[0]}</span> ${g2[1]}`,
    );
  }
  h += row(
    'Element',
    `${Chinese.ELEMENTS[elx]} <span class="zh">${Chinese.ELEMENT_ZH[elx]}</span> · produces ${Chinese.ELEMENTS[(elx + 1) % 5]}, controls ${Chinese.ELEMENTS[(elx + 2) % 5]}`,
  );
  return h;
}

function tipCnBranch(b: number) {
  const [ch, py, animal, elx, hours, traits, hidden] = Chinese.BRANCHES[b];
  let h = `<div class="th"><span class="zh" style="color:${EL_COLOR[elx]}">${ch}</span> ${py} · ${animal}</div>`;
  h += `<div class="tplain">${traits}</div>`;
  h += row('Element', `${Chinese.ELEMENTS[elx]} <span class="zh">${Chinese.ELEMENT_ZH[elx]}</span>`);
  h += row('Hours', hours);
  h += row(
    'Hidden stems',
    hidden
      .map(
        (x) =>
          `<span class="zh" style="color:${EL_COLOR[Chinese.STEMS[x][2]]}">${Chinese.STEMS[x][0]}</span> ${Chinese.STEMS[x][1]}`,
      )
      .join(', '),
  );
  h += row(
    'Clashes with',
    `${Chinese.BRANCHES[(b + 6) % 12][2]} <span class="zh">${Chinese.BRANCHES[(b + 6) % 12][0]}</span>`,
  );
  const trine = [(b + 4) % 12, (b + 8) % 12].map((x) => Chinese.BRANCHES[x][2]).join(' and ');
  h += row('Allies (trine)', trine);
  if (cn) {
    const pillars: [role: string, pillar: Chinese.Pillar][] = [
      ['year', cn.p.year],
      ['month', cn.p.month],
      ['day', cn.p.day],
      ['hour', cn.p.hour],
    ];
    const roles = pillars.filter(([, x]) => x.branch === b).map(([k]) => k);
    if (roles.length) h += `<div class="muted tnote">This moment's ${roles.join(' and ')} branch.</div>`;
  }
  return h;
}

Object.assign(tips, { 'cn-stem': (v: string) => tipCnStem(+v), 'cn-branch': (v: string) => tipCnBranch(+v) });

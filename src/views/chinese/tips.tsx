// Chinese tab: what its tooltips say.
import { Chinese } from '#astro';
import { tips } from '#lib/state.ts';
import { TipHead, TipNote, TipRow, TipText } from '#components/Tip.tsx';
import { EL_COLOR } from '#views/chinese/constants.ts';
import { cn, polarity } from '#views/chinese/model.ts';

// a character in its element's colour
const Zh = ({ ch, elx }: { ch: string; elx: number }) => (
  <span class="zh" style={`color:${EL_COLOR[elx]}`}>
    {ch}
  </span>
);

function TipCnStem({ s }: { s: number }) {
  const [ch, py, elx, img, text] = Chinese.STEMS[s];
  const god = cn && s !== cn.dm ? Chinese.tenGod(cn.dm, s) : null;
  return (
    <>
      <TipHead>
        <Zh ch={ch} elx={elx} /> {py} · {polarity(s % 2 === 0)} {Chinese.ELEMENTS[elx]}
      </TipHead>
      <TipText>
        Heavenly stem, the image of {img}. {text}
      </TipText>
      {cn && (
        <TipRow k="To the Day Master">
          {god ? (
            <>
              <span class="zh">{god[0]}</span> {god[1]}
            </>
          ) : (
            'Same stem as the Day Master'
          )}
        </TipRow>
      )}
      <TipRow k="Element">
        {Chinese.ELEMENTS[elx]} <span class="zh">{Chinese.ELEMENT_ZH[elx]}</span> · produces{' '}
        {Chinese.ELEMENTS[(elx + 1) % 5]}, controls {Chinese.ELEMENTS[(elx + 2) % 5]}
      </TipRow>
    </>
  );
}

function TipCnBranch({ b }: { b: number }) {
  const [ch, py, animal, elx, hours, traits, hidden] = Chinese.BRANCHES[b];
  const clash = Chinese.BRANCHES[(b + 6) % 12];
  const trine = [(b + 4) % 12, (b + 8) % 12].map((x) => Chinese.BRANCHES[x][2]).join(' and ');
  const pillars: [role: string, pillar: Chinese.Pillar][] = cn
    ? [
        ['year', cn.p.year],
        ['month', cn.p.month],
        ['day', cn.p.day],
        ['hour', cn.p.hour],
      ]
    : [];
  const roles = pillars.filter(([, x]) => x.branch === b).map(([k]) => k);
  return (
    <>
      <TipHead>
        <Zh ch={ch} elx={elx} /> {py} · {animal}
      </TipHead>
      <TipText>{traits}</TipText>
      <TipRow k="Element">
        {Chinese.ELEMENTS[elx]} <span class="zh">{Chinese.ELEMENT_ZH[elx]}</span>
      </TipRow>
      <TipRow k="Hours">{hours}</TipRow>
      <TipRow k="Hidden stems">
        {hidden.map((x, i) => (
          <>
            {i > 0 && ', '}
            <Zh ch={Chinese.STEMS[x][0]} elx={Chinese.STEMS[x][2]} /> {Chinese.STEMS[x][1]}
          </>
        ))}
      </TipRow>
      <TipRow k="Clashes with">
        {clash[2]} <span class="zh">{clash[0]}</span>
      </TipRow>
      <TipRow k="Allies (trine)">{trine}</TipRow>
      {roles.length > 0 && <TipNote>This moment's {roles.join(' and ')} branch.</TipNote>}
    </>
  );
}

Object.assign(tips, {
  'cn-stem': (v: string) => <TipCnStem s={+v} />,
  'cn-branch': (v: string) => <TipCnBranch b={+v} />,
});

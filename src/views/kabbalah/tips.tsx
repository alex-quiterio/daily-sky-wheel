// Kabbalah tab: what its tooltips say.
import { Hebrew } from '#astro';
import { tips } from '#lib/state.ts';
import { TipHead, TipRow, TipText } from '#components/Tip.tsx';

function TipSefira({ i }: { i: number }) {
  const [he, tr, en, desc] = Hebrew.SEFIROT[i];
  const days = Hebrew.DAY_SEFIRA.map((s, d) => (s === i ? Hebrew.DAY_NAMES[d] : null)).filter(Boolean);
  return (
    <>
      <TipHead>
        <span class="he" lang="he">
          {he}
        </span>{' '}
        {tr} · {en}
      </TipHead>
      <TipText>{desc}</TipText>
      {days.length > 0 && <TipRow k="Day of the week">{days.join(', ')}</TipRow>}
      <TipRow k="Position">
        {i + 1} of 10{i < 3 ? ' · intellect' : i < 6 ? ' · emotion' : ' · action'}
      </TipRow>
    </>
  );
}

tips['kb-sefira'] = (v) => <TipSefira i={+v} />;

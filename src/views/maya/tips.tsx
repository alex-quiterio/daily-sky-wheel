// Maya tab: what its tooltips say.
import * as Maya from '#astro/maya.ts';
import { tips } from '#lib/state.ts';
import { TipHead, TipRow, TipText } from '#components/Tip.tsx';

function TipMayaSign({ i }: { i: number }) {
  const [name, eng, meaning] = Maya.SIGNS[i];
  const [dir, color] = Maya.DIRECTIONS[i % 4];
  return (
    <>
      <TipHead>
        {name} · {eng}
      </TipHead>
      <TipText>{meaning}</TipText>
      <TipRow k="Direction">
        {dir}, {color.toLowerCase()}
      </TipRow>
      <TipRow k="Position">{i + 1} of 20</TipRow>
    </>
  );
}

tips['my-sign'] = (v) => <TipMayaSign i={+v} />;

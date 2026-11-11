// The tab row: one tab per tradition.
import { useEffect, useRef } from 'preact/hooks';
import { TAB_NOTES, VIEWS } from '#lib/constants.ts';
import { setView } from '#shell/controls.ts';

export function Tabs({ view }: { view: string }) {
  const bar = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  // keep the chosen tab in view when the tab row scrolls (phones)
  useEffect(() => {
    const row = bar.current,
      tab = row?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (row && tab && row.scrollWidth > row.clientWidth)
      row.scrollTo({
        left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2,
        behavior: first.current ? 'auto' : 'smooth',
      });
    first.current = false;
  }, [view]);
  return (
    <div class="tabs" role="tablist" aria-label="Astrology system, in order of earliest documented practice" ref={bar}>
      {VIEWS.map(([name, label]) => {
        const [mark, cls, note] = TAB_NOTES[name];
        const on = name === view;
        return (
          <button
            type="button"
            role="tab"
            id={`tab${label}`}
            aria-controls={`view${label}`}
            aria-selected={on}
            tabindex={on ? 0 : -1}
            title={note}
            onClick={() => setView(name, true)}
          >
            {label}
            {mark && (
              <>
                {' '}
                <span class={cls}>{mark}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

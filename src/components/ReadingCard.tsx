// A reading shown as a card: summary, "good for / go easy on", then sections that fold open.
// A line with a `ref` opens that tooltip from its heading; a line with `more` unfolds a second layer of rows.
// Above the sections: Open all, Close all, and Explain terms, which adds a plain sentence under each term
// the first time it comes up in a section.
import { useState } from 'preact/hooks';
import { Glossary } from '#astro';
import type { GlossaryEntry, ReadingItem } from '#astro';
import type { ReadingCardProps } from '#lib/types.ts';
import { Card } from '#components/Card.tsx';
import { usePrinting } from '#components/usePrinting.ts';
import { useStored } from '#components/useStored.ts';

function Head({ item }: { item: ReadingItem }) {
  return item.ref ? (
    <span class="rd-head tipzone" data-tip={item.ref} tabindex={0}>
      {item.head}
    </span>
  ) : (
    <b class="rd-head">{item.head}</b>
  );
}

function Explained({ terms }: { terms: GlossaryEntry[] }) {
  if (!terms.length) return null;
  return (
    <dl class="rd-gloss">
      {terms.map((t) => (
        <div>
          <dt>{t.term}</dt>
          <dd>{t.text}</dd>
        </div>
      ))}
    </dl>
  );
}

const toggled = (list: string[], key: string, on: boolean) =>
  on ? [...new Set([...list, key])] : list.filter((k) => k !== key);

export function ReadingCard(props: ReadingCardProps) {
  const { id, heading, reading, storageKey, open, title, note, link, glossary } = props;
  const [goodLabel, careLabel] = props.adviceLabels ?? ['Good for', 'Go easy on'];
  const [sections, setSectionsNow] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null') || open;
    } catch (e) {
      return open;
    }
  });
  const [items, setItems] = useState<string[]>([]); // unfolded lines, kept while the page is open
  // on paper every section is open; the deeper layer of a line prints only where the reader had opened it
  const printing = usePrinting();
  const [copied, setCopied] = useState<'' | 'Reading copied' | 'Copy failed'>('');
  const [explain, setExplain] = useStored('skywheel-glossary', 'off'); // shared by every reading
  const explaining = explain === 'on';

  // the open sections, remembered between visits
  const setSections = (next: (list: string[]) => string[]) =>
    setSectionsNow((list) => {
      const value = next(list);
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch (e) {
        /* storage unavailable */
      }
      return value;
    });
  const allTitles = reading.sections.map((s) => s.title);
  const allOpen = allTitles.every((t) => sections.includes(t));
  const allClosed = !allTitles.some((t) => sections.includes(t)) && !items.length;

  const copy = () => {
    const done = (ok: boolean) => {
      setCopied(ok ? 'Reading copied' : 'Copy failed');
      setTimeout(() => setCopied(''), 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(`${title}\n\n${reading.text}\n\n${link()}`).then(
        () => done(true),
        () => done(false),
      );
    else done(false);
  };

  return (
    <Card title={heading} id={id} class="reading">
      <p class="rd-sum">{reading.summary}</p>
      {/* a box with nothing in it is left out */}
      {(reading.advice.good.length > 0 || reading.advice.care.length > 0) && (
        <div class="rd-advice">
          {reading.advice.good.length > 0 && (
            <div class="good">
              <b>{goodLabel}</b>
              {reading.advice.good.join(' · ')}
            </div>
          )}
          {reading.advice.care.length > 0 && (
            <div class="care">
              <b>{careLabel}</b>
              {reading.advice.care.join(' · ')}
            </div>
          )}
        </div>
      )}
      <div class="rd-tools" role="group" aria-label="Reading">
        <button type="button" disabled={allOpen} onClick={() => setSections(() => allTitles)}>
          Open all
        </button>
        <button
          type="button"
          disabled={allClosed}
          onClick={() => {
            setSections(() => []);
            setItems([]);
          }}
        >
          Close all
        </button>
        <label class="rd-explain">
          <input
            type="checkbox"
            checked={explaining}
            onChange={(e) => setExplain(e.currentTarget.checked ? 'on' : 'off')}
          />
          <span>Explain terms</span>
        </label>
      </div>
      <div>
        {reading.sections.map((sec) => {
          const seen = new Set<string>(); // each term is explained once per section
          const terms = (item: ReadingItem) =>
            explaining ? Glossary.termsIn(`${item.head} ${item.text}`, glossary, sec.title, seen) : [];
          return (
            <details
              class="rd-sec"
              data-sec={sec.title}
              open={printing || sections.includes(sec.title)}
              onToggle={(e) => {
                if (printing || e.target !== e.currentTarget) return;
                const on = e.currentTarget.open;
                setSections((list) => toggled(list, sec.title, on));
              }}
            >
              <summary>
                {sec.title}
                <span class="rd-n">{sec.items.length}</span>
              </summary>
              {sec.items.map((item) => {
                if (!item.more)
                  return (
                    <>
                      <p>
                        <Head item={item} /> {item.text}
                      </p>
                      <Explained terms={terms(item)} />
                    </>
                  );
                const key = `${sec.title}|${item.id || item.head}`;
                return (
                  <>
                    <details
                      class="rd-item"
                      data-item={key}
                      open={items.includes(key)}
                      onToggle={(e) => {
                        const on = e.currentTarget.open;
                        setItems((list) => toggled(list, key, on));
                      }}
                    >
                      {/* a heading inside a foldable line opens its tooltip without folding the line */}
                      <summary
                        onClick={(e) => {
                          if ((e.target as Element).closest('.tipzone')) e.preventDefault();
                        }}
                      >
                        <span>
                          <Head item={item} /> {item.text}
                        </span>
                      </summary>
                      <div class="rd-more">
                        {item.more.map(([k, v]) => (
                          <div class="tr">
                            <span>{k}</span>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                    <Explained terms={terms(item)} />
                  </>
                );
              })}
            </details>
          );
        })}
      </div>
      <div class="rd-foot">
        <p class="note">{note}</p>
        <button type="button" onClick={copy}>
          {copied || 'Copy reading'}
        </button>
      </div>
    </Card>
  );
}

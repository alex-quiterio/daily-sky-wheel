// A reading shown as a card: summary, "good for / go easy on", then sections that fold open.
// A line with a `ref` opens that tooltip from its heading; a line with `more` unfolds a second layer of rows.
import { useState } from 'preact/hooks';
import type { ReadingItem } from '#astro';
import type { ReadingCardProps } from '#lib/types.ts';
import { Card } from '#components/Card.tsx';

function Head({ item }: { item: ReadingItem }) {
  return item.ref ? (
    <span class="rd-head tipzone" data-tip={item.ref} tabindex={0}>
      {item.head}
    </span>
  ) : (
    <b class="rd-head">{item.head}</b>
  );
}

export function ReadingCard({ id, heading, reading, storageKey, open, title, note, link }: ReadingCardProps) {
  const [sections, setSections] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null') || open;
    } catch (e) {
      return open;
    }
  });
  const [items, setItems] = useState<string[]>([]); // unfolded lines, kept while the page is open
  const [copied, setCopied] = useState<'' | 'Reading copied' | 'Copy failed'>('');

  const toggled = (list: string[], key: string, on: boolean) =>
    on ? [...new Set([...list, key])] : list.filter((k) => k !== key);
  const foldSection = (key: string, on: boolean) => {
    const next = toggled(sections, key, on);
    setSections(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      /* storage unavailable */
    }
  };
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
      <div class="rd-advice">
        <div class="good">
          <b>Good for</b>
          {reading.advice.good.join(' · ')}
        </div>
        <div class="care">
          <b>Go easy on</b>
          {reading.advice.care.join(' · ')}
        </div>
      </div>
      <div>
        {reading.sections.map((sec) => (
          <details
            class="rd-sec"
            data-sec={sec.title}
            open={sections.includes(sec.title)}
            onToggle={(e) => {
              if (e.target === e.currentTarget) foldSection(sec.title, e.currentTarget.open);
            }}
          >
            <summary>
              {sec.title}
              <span class="rd-n">{sec.items.length}</span>
            </summary>
            {sec.items.map((item) => {
              if (!item.more)
                return (
                  <p>
                    <Head item={item} /> {item.text}
                  </p>
                );
              const key = `${sec.title}|${item.id || item.head}`;
              return (
                <details
                  class="rd-item"
                  data-item={key}
                  open={items.includes(key)}
                  onToggle={(e) => setItems(toggled(items, key, e.currentTarget.open))}
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
              );
            })}
          </details>
        ))}
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

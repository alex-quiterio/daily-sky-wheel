import type { ComponentChildren } from 'preact';

// Horizontal bars scaled to the largest count
export function Bars({ rows }: { rows: { label: ComponentChildren; n: number; color: string }[] }) {
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <>
      {rows.map((r) => (
        <div class="bar">
          <span>{r.label}</span>
          <span class="track">
            <span
              class="fill"
              style={`display:block;width:${(r.n / max) * 100}%;background:${r.color};color:${r.color}`}
            ></span>
          </span>
          <span class="n">{r.n}</span>
        </div>
      ))}
    </>
  );
}

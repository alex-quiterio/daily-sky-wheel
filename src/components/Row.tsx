import type { ComponentChildren } from 'preact';

// A label and its value on one line
export function Row({ k, children }: { k: ComponentChildren; children: ComponentChildren }) {
  return (
    <div class="tr">
      <span>{k}</span>
      <span>{children}</span>
    </div>
  );
}

import type { ComponentChildren } from 'preact';

// A titled panel
export function Card(props: { title: ComponentChildren; id?: string; class?: string; children: ComponentChildren }) {
  return (
    <section class={`card${props.class ? ` ${props.class}` : ''}`} id={props.id}>
      <h2>{props.title}</h2>
      {props.children}
    </section>
  );
}

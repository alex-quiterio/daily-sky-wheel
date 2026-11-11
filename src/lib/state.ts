// What several files share: the cast chart, and the registries that views and tooltips add themselves to.
// What the controls show (the moment, the place, the open tab) is in the controls store, shell/controls.ts.
import type { ComponentChildren } from 'preact';
import type { ChartContext, Moment, ViewDef } from '#lib/types.ts';

export const state = {
  ctx: null as ChartContext | null, // the chart the tooltips describe
  lastWhen: null as Date | null,
};

// The chart the tooltips describe. They only run once a chart has been cast, so a missing one is a bug.
export function chartContext(): ChartContext {
  if (!state.ctx) throw new Error('no chart has been cast yet');
  return state.ctx;
}

export const views: Record<string, ViewDef> = {}; // tab name -> view
// each tab registers itself; its model type is its own business, so it is erased here
export function defineView<M>(name: string, def: ViewDef<M>) {
  views[name] = def as unknown as ViewDef;
}
// tooltip kind -> what the tooltip says for a value ('planet:Mars' -> tips.planet('Mars')); null says nothing
export const tips: Record<string, (value: string) => ComponentChildren> = {};

// app.tsx owns the render loop; everything else asks for a repaint through render()
let renderer: () => void = () => {};
export const onRender = (fn: () => void) => {
  renderer = fn;
};
export const render = () => renderer();

// the render loop hands each new moment to the mounted <App>
let listener: (moment: Moment) => void = () => {};
export const onMoment = (fn: (moment: Moment) => void) => {
  listener = fn;
};
export const publish = (moment: Moment) => listener(moment);

// the wheel lights up the planet or aspect a tooltip is about
let focusHook: (key: string | null) => void = () => {};
export const onTipFocus = (fn: (key: string | null) => void) => {
  focusHook = fn;
};
export const tipFocus = (key: string | null) => focusHook(key);

// Start-up and the render loop: work out the chart for the chosen moment and place, then hand it to the open tab.
// Each tab's code and styles load the first time the tab is opened.
import { render as mount } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Core, Western } from '#astro';
import { VIEWS } from '#lib/constants.ts';
import { onMoment, onRender, publish, state as st, views } from '#lib/state.ts';
import { useStore } from '#lib/store.ts';
import { localToUTC, subtitleOf } from '#lib/time.ts';
import type { HeaderInfo, Moment } from '#lib/types.ts';
import { TabBoundary, TabLoading } from '#components/TabBoundary.tsx';
import { Tooltip, hideTip } from '#components/Tooltip.tsx';
import { Controls } from '#shell/Controls.tsx';
import { Header } from '#shell/Header.tsx';
import { MethodNotes } from '#shell/MethodNotes.tsx';
import { MiniBar } from '#shell/MiniBar.tsx';
import { Tabs } from '#shell/Tabs.tsx';
import { CHART_KEYS, controls, currentPlace, initControls, startControls } from '#shell/controls.ts';
import '#shell/base.css';
import '#shell/stars.ts';
import '#shell/shell.css';
import '#shell/print.css';

// ---------- the tabs, loaded on demand ----------
// Each tab is its own bundle (dist/view-<name>.js and .css, see scripts/build.mjs); importing it registers it.
const CODE: Record<string, () => Promise<unknown>> = {
  western: () => import('#views/western/index.tsx'),
  chinese: () => import('#views/chinese/index.tsx'),
  vedic: () => import('#views/vedic/index.tsx'),
  maya: () => import('#views/maya/index.tsx'),
  kabbalah: () => import('#views/kabbalah/index.tsx'),
  islamic: () => import('#views/islamic/index.tsx'),
};

// a tab's stylesheet sits next to this bundle and carries the same version stamp
function loadStyles(name: string) {
  const here = new URL(import.meta.url);
  const href = new URL(`view-${name}.css${here.search}`, here).href;
  return new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => {
      link.remove();
      reject(new Error(`could not load the styles for the ${name} tab`));
    };
    document.head.appendChild(link);
  });
}

// once per tab; a failed load is forgotten, so Try again starts it afresh
const loading = new Map<string, Promise<void>>();
function loadView(name: string): Promise<void> {
  let p = loading.get(name);
  if (!p) {
    p = Promise.all([CODE[name](), loadStyles(name)]).then(() => {
      if (!views[name]) throw new Error(`the ${name} tab did not register itself`);
    });
    p.catch(() => loading.delete(name));
    loading.set(name, p);
  }
  return p;
}

// ---------- the render loop ----------
// Read the controls, cast the chart, and publish the moment: { when, local, place, hsys, chart, asps, byName }
function cast() {
  hideTip(true);
  const s = controls.get();
  if (!s.date) return;
  const place = currentPlace(s);
  const [y, m, d] = s.date.split('-').map(Number);
  const [hh, mm] = (s.time || '12:00').split(':').map(Number);
  const when = localToUTC(y, m, d, hh, mm, place.tz);
  const chart = Core.chart(when, place.lat, place.lon, s.hsys);
  const asps = Western.aspects(chart.pts);
  const byName = Object.fromEntries(chart.pts.map((p) => [p.name, p]));
  st.ctx = { chart, asps, byName, place, houseOf: (lon) => Core.houseOf(chart.cusps, lon) };
  st.lastWhen = when;
  publish({ when, local: { y, m, d, hh, mm }, place, hsys: s.hsys, chart, asps, byName });
}
onRender(cast);

const BLANK: HeaderInfo = { title: 'Daily Sky Wheel', big3: null };

// the open tab's model and header, or why they could not be worked out
function useModel(view: string, ready: boolean, moment: Moment | null, attempt: number) {
  return useMemo(() => {
    if (!ready || !moment) return { header: BLANK };
    const { build, header } = views[view];
    try {
      const model = build(moment);
      return { model, header: header(model, moment) };
    } catch (error) {
      console.error(`The ${view} tab failed to work out the moment:`, error);
      return { header: BLANK, error };
    }
    // `attempt` makes Try again work it out afresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, ready, moment, attempt]);
}

function App() {
  const [moment, setMoment] = useState<Moment | null>(null);
  const view = useStore(controls, (s) => s.view);
  const label = VIEWS.find(([k]) => k === view)![1];
  const [loaded, setLoaded] = useState<{ view: string; error?: unknown } | null>(null);
  const [attempt, setAttempt] = useState(0);

  // cast the first chart, and again whenever the moment, the place or the houses change
  useEffect(() => {
    onMoment(setMoment);
    startControls();
    cast();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(cast);
    return controls.subscribe((s, prev) => {
      if (CHART_KEYS.some((k) => s[k] !== prev[k])) cast();
    });
  }, []);

  // fetch the open tab's code the first time it is opened (and again on Try again after a failure)
  useEffect(() => {
    if (views[view]) {
      setLoaded({ view });
      return;
    }
    let current = true;
    setLoaded(null);
    loadView(view).then(
      () => current && setLoaded({ view }),
      (error) => current && setLoaded({ view, error }),
    );
    return () => {
      current = false;
    };
  }, [view, attempt]);

  const ready = loaded?.view === view && !loaded.error && !!views[view];
  const { model, header, error } = useModel(view, ready, moment, attempt);
  const View = ready ? views[view].View : null;
  return (
    <>
      <MiniBar />
      <div class="wrap">
        <Tabs view={view} />
        <Header info={header} subtitle={moment ? subtitleOf(moment) : ''} />
        <Controls />
        <TabBoundary
          key={`${view}:${attempt}`}
          label={label}
          error={loaded?.view === view ? (loaded.error ?? error) : error}
          retry={() => setAttempt((n) => n + 1)}
        >
          {moment && View ? <View key={view} moment={moment} model={model} /> : <TabLoading label={label} />}
        </TabBoundary>
        <MethodNotes />
      </div>
      <Tooltip />
    </>
  );
}

initControls();
mount(<App />, document.getElementById('app')!);

// Start-up and the render loop: work out the chart for the chosen moment and place, then hand it to the open tab.
import { render as mount } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Core, Western } from '#astro';
import type { HouseSystem } from '#astro';
import { $, field } from '#lib/dom.ts';
import { slug } from '#lib/format.ts';
import { onMoment, onRender, publish, state as st, views } from '#lib/state.ts';
import { store } from '#lib/storage.ts';
import { localToUTC, subtitleOf } from '#lib/time.ts';
import type { HeaderInfo, Moment } from '#lib/types.ts';
import { Tooltip, hideTip } from '#components/Tooltip.tsx';
import { Controls } from '#shell/Controls.tsx';
import { Header } from '#shell/Header.tsx';
import { MethodNotes } from '#shell/MethodNotes.tsx';
import { MiniBar } from '#shell/MiniBar.tsx';
import { Tabs } from '#shell/Tabs.tsx';
import { currentPlace, initControls, syncMini, syncURL, wireControls } from '#shell/controls.ts';
import '#shell/base.css';
import '#shell/stars.ts';
import '#views/western/index.tsx';
import '#views/chinese/index.tsx';
import '#views/maya/index.tsx';
import '#views/kabbalah/index.tsx';
import '#views/vedic/index.tsx';
import '#views/islamic/index.tsx';
import '#shell/shell.css';

// Read the controls, cast the chart, and publish the moment: { when, local, place, hsys, chart, asps, byName }
function render() {
  hideTip(true);
  syncMini();
  setTimeout(syncURL, 0);
  const place = currentPlace();
  const hsys = field('hsys').value as HouseSystem;
  $('customBox').hidden = field('place').value !== 'custom';
  store.set({
    geo: st.fromGeo,
    place: field('place').value === 'custom' ? 'custom' : slug(place.name),
    hsys,
    lat: field('lat').value,
    lon: field('lon').value,
    tz: field('tz').value,
  });
  if (!field('date').value) return;
  const [y, m, d] = field('date').value.split('-').map(Number);
  const [hh, mm] = (field('time').value || '12:00').split(':').map(Number);
  const when = localToUTC(y, m, d, hh, mm, place.tz);
  const chart = Core.chart(when, place.lat, place.lon, hsys);
  const asps = Western.aspects(chart.pts);
  const byName = Object.fromEntries(chart.pts.map((p) => [p.name, p]));
  st.ctx = { chart, asps, byName, place, houseOf: (lon) => Core.houseOf(chart.cusps, lon) };
  st.lastWhen = when;
  publish({ when, local: { y, m, d, hh, mm }, place, hsys, chart, asps, byName });
}
onRender(render);

const BLANK: HeaderInfo = { title: 'Daily Sky Wheel', big3: null };

function App() {
  const [moment, setMoment] = useState<Moment | null>(null);
  // the controls exist once the shell is on the page; then the first chart can be cast
  useEffect(() => {
    onMoment(setMoment);
    initControls();
    wireControls();
    render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  }, []);

  const view = st.view;
  const { build, header, View } = views[view];
  const model = useMemo(() => (moment ? build(moment) : null), [moment, build]);
  return (
    <>
      <MiniBar />
      <div class="wrap">
        <Tabs view={view} />
        <Header info={moment ? header(model, moment) : BLANK} subtitle={moment ? subtitleOf(moment) : ''} />
        <Controls />
        {moment && <View key={view} moment={moment} model={model} />}
        <MethodNotes />
      </div>
      <Tooltip />
    </>
  );
}

mount(<App />, document.getElementById('app')!);

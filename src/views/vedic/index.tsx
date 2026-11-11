// Vedic tab: the reading, the Panchang, muhurta times and the days ahead; the rashi chart, the grahas and the dasha.
import { Vedic } from '#astro';
import { useEffect, useState } from 'preact/hooks';
import { background } from '#lib/background.ts';
import { defineView } from '#lib/state.ts';
import { localParts, localToUTC, subtitleOf } from '#lib/time.ts';
import type { HeaderInfo, Moment, ViewProps } from '#lib/types.ts';
import { Card } from '#components/Card.tsx';
import { Chips } from '#components/Chips.tsx';
import { Drawing } from '#components/Drawing.tsx';
import { ReadingCard } from '#components/ReadingCard.tsx';
import { Row } from '#components/Row.tsx';
import { useStored } from '#components/useStored.ts';
import { goTo, shareURL } from '#shell/controls.ts';
import { AHEAD_CATS } from '#views/vedic/constants.ts';
import { drawRashi } from '#views/vedic/draw.ts';
import { build, degMin, isNode } from '#views/vedic/model.ts';
import type { Model } from '#views/vedic/types.ts';
import '#views/vedic/tips.tsx';
import '#views/vedic/styles.css';

export const dev = (text: string) => <span class="dev">{text}</span>;

// ---------- the day ----------
function Panchang({ moment: { place }, model: { p, month, vara } }: { moment: Moment; model: Model }) {
  const until = (d: Date | null) =>
    d
      ? `until ${new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d)}`
      : '';
  const Limb = (props: { label: string; sub?: string; ends: Date | null; children: preact.ComponentChildren }) => (
    <div class="vd-limb">
      <span class="vd-l">{props.label}</span>
      <span class="vd-v">
        {props.children}
        {props.sub && <small>{props.sub}</small>}
      </span>
      <span class="vd-e">{until(props.ends)}</span>
    </div>
  );
  return (
    <Card title={<>Panchang {dev('पञ्चाङ्ग')}</>}>
      <div id="vdPanchang">
        <div class="vd-head">
          <div class="vd-big">
            {p.tithi.paksha} {p.tithi.name}
          </div>
          <div class="muted">
            {month.adhika ? 'Adhika ' : ''}
            {month.name} month (amanta) · {p.tithi.paksha === 'Shukla' ? 'waxing' : 'waning'} fortnight
          </div>
        </div>
        <Limb label="Tithi" sub={`${p.tithi.paksha} paksha`} ends={p.tithi.ends}>
          {p.tithi.n > 15 ? p.tithi.n - 15 : p.tithi.n}. {p.tithi.name}
        </Limb>
        <Limb label="Vara" sub={`day of ${Vedic.VARAS[vara][1]}`} ends={null}>
          {Vedic.VARAS[vara][0]}
        </Limb>
        <Limb
          label="Nakshatra"
          sub={`ruled by ${p.nakshatra.lord} · deity ${p.nakshatra.deity}`}
          ends={p.nakshatra.ends}
        >
          <span class="tipzone" data-tip={`vd-nak:${p.nakshatra.i}`} tabindex={0}>
            {p.nakshatra.name}
          </span>{' '}
          · pada {p.nakshatra.pada}
        </Limb>
        <Limb label="Yoga" ends={p.yoga.ends}>
          {p.yoga.n}. {p.yoga.name}
        </Limb>
        <Limb label="Karana" ends={p.karana.ends}>
          {p.karana.name}
        </Limb>
        <p class="cn-note">
          Ayanamsa (Lahiri) {degMin(p.ayanamsa)} · Moon in {Vedic.RASHIS[Math.floor(p.moonSid / 30)][1]} · Sun in{' '}
          {Vedic.RASHIS[Math.floor(p.sunSid / 30)][1]}
        </p>
      </div>
    </Card>
  );
}

function Muhurta({ moment: { when, place }, model: { p, periods } }: { moment: Moment; model: Model }) {
  const time = (d: Date | null) => (d ? localParts(d, place.tz).time : '—');
  const spans: [name: string, span: Vedic.Span, kind: string][] = periods
    ? [
        ['Rahu Kaal', periods.rahu, 'bad'],
        ['Yamaganda', periods.yama, 'bad'],
        ['Gulika Kaal', periods.gulika, 'bad'],
        ['Abhijit muhurta', periods.abhijit, 'good'],
      ]
    : [];
  return (
    <Card title="Muhurta · times of the day">
      <div id="vdTimes">
        <Row k="Sunrise">{time(p.sunrise)}</Row>
        <Row k="Sunset">{time(p.sunset)}</Row>
        {spans.map(([name, span, kind]) => {
          const now = when >= span.start && when < span.end;
          return (
            <div class={`tr vd-per ${kind}${now ? ' now' : ''}`}>
              <span>
                {name}
                {now && (
                  <>
                    {' '}
                    <b class="vd-now">now</b>
                  </>
                )}
              </span>
              <span>
                {time(span.start)} – {time(span.end)}
              </span>
            </div>
          );
        })}
        <p class="cn-note">
          Rahu Kaal, Yamaganda and Gulika are avoided for new beginnings. Abhijit, the midday muhurta, is favoured.
        </p>
      </div>
    </Card>
  );
}

let wanted = ''; // the place and day last asked for
export let ahead: { key: string; startDay: number; list: (Vedic.Observance & { civil: Date })[] } | null = null;

function DaysAhead({ moment: { local, place } }: { moment: Moment }) {
  const [cat, setCat] = useStored('skywheel-vedic-cat', 'festival');
  const DAY = 86400000;
  const startDay = Date.UTC(local.y, local.m - 1, local.d);
  const key = `${place.lat},${place.lon},${place.tz}`;
  // reuse a computed year while the selected day stays inside its first month
  const fresh = !!ahead && ahead.key === key && startDay >= ahead.startDay && startDay <= ahead.startDay + 30 * DAY;
  const [, repaint] = useState(0);
  // otherwise work out a new one in the background; the last request made is the one that counts
  useEffect(() => {
    if (fresh) return;
    const request = `${key}|${startDay}`;
    wanted = request;
    const start = localToUTC(local.y, local.m, local.d, 0, 0, place.tz).getTime();
    background('vedicDaysAhead', start, 400, place.lat, place.lon)
      .catch((): Vedic.Observance[] => [])
      .then((found) => {
        if (wanted !== request) return;
        ahead = { key, startDay, list: found.map((e) => ({ ...e, civil: new Date(startDay + e.k * DAY) })) };
        repaint((n) => n + 1);
      });
  }, [fresh, key, startDay, local.y, local.m, local.d, place.lat, place.lon, place.tz]);

  // until the first answer for this place arrives there is nothing to show; after that, the last list stands in
  if (!ahead || ahead.key !== key)
    return (
      <Card title="Days ahead · utsava and vrata" id="vedicAheadCard">
        <Chips id="vdChips" options={AHEAD_CATS} value={cat} onPick={setCat} />
        <div class="yearlist" id="vdAhead">
          <p class="empty">Working out the festivals and fasts of the coming year…</p>
        </div>
      </Card>
    );
  const list = ahead.list.filter(
    (e) =>
      e.civil.getTime() >= startDay && e.civil.getTime() < startDay + 366 * DAY && (cat === 'all' || e.kind === cat),
  );
  const fmtMonth = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const fmtDay = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  let month = '';
  return (
    <Card title="Days ahead · utsava and vrata" id="vedicAheadCard">
      <Chips id="vdChips" options={AHEAD_CATS} value={cat} onPick={setCat} />
      <div class="yearlist" id="vdAhead">
        {!list.length && <p class="empty">Nothing of this kind in the coming year.</p>}
        {list.map((e) => {
          const label = fmtMonth.format(e.civil);
          const head = label !== month && <div class="ymonth">{label}</div>;
          month = label;
          const days = Math.round((e.civil.getTime() - startDay) / DAY);
          const iso = e.civil.toISOString().slice(0, 10);
          return (
            <>
              {head}
              <button
                type="button"
                class={`yitem vd-item vd-${e.kind}${days === 0 ? ' active' : ''}`}
                data-date={iso}
                onClick={() => goTo({ date: iso })}
              >
                <span class="yd">
                  <b>{fmtDay.format(e.civil).replace(',', '')}</b>
                </span>
                <span class="vd-ico" aria-hidden="true"></span>
                <span class="yt">
                  {e.name}
                  {e.note && <small>{e.note}</small>}
                </span>
                <span class="yin">{days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} d`}</span>
              </button>
            </>
          );
        })}
      </div>
    </Card>
  );
}

// ---------- the chart ----------
function RashiChart({ model }: { model: Model }) {
  const [style, setStyle] = useStored('skywheel-vedic-style', 'north');
  return (
    <Card title={<>Rashi chart {dev('राशि')}</>}>
      <div class="wheelbar">
        <div class="seg" role="radiogroup" aria-label="Chart style">
          {[
            ['north', 'North Indian'],
            ['south', 'South Indian'],
          ].map(([value, label]) => (
            <label>
              <input
                type="radio"
                name="vdStyle"
                value={value}
                checked={style === value}
                onChange={() => setStyle(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <Drawing
        id="vdChart"
        viewBox="0 0 400 400"
        role="img"
        aria-label="Sidereal rashi chart with whole-sign houses"
        draw={(svg) => drawRashi(svg, style)}
        deps={[model, style]}
      />
    </Card>
  );
}

function Grahas({ model: { g, lagna, lagnaSign } }: { model: Model }) {
  const house = (sign: number) => ((sign - lagnaSign + 12) % 12) + 1;
  const rising = Vedic.nakshatraOf(lagna);
  return (
    <Card title={<>Grahas {dev('ग्रह')}</>}>
      <table class="eph" id="vdGrahas">
        <tr class="vd-lagna">
          <td class="g">La</td>
          <td>Lagna</td>
          <td class="pos">
            {degMin(lagna % 30)} {Vedic.RASHIS[lagnaSign][1]}
          </td>
          <td>
            {Vedic.NAKSHATRAS[rising.i][0]} {rising.pada}
          </td>
          <td class="h">H1</td>
        </tr>
        {g.list.map((x) => {
          const [, sanskrit, devanagari] = Vedic.GRAHAS.find((q) => q[0] === x.key)!;
          return (
            <tr>
              <td class="g dev">{devanagari}</td>
              <td>
                {sanskrit}
                {x.retro && !isNode(x.key) && (
                  <>
                    {' '}
                    <span class="r">R</span>
                  </>
                )}
                {x.dignity && (
                  <>
                    {' '}
                    <span
                      class={`vd-dig ${x.dignity === 'Debilitated' ? 'down' : 'up'} tipzone`}
                      data-tip={`vd-dig:${x.dignity}`}
                      tabindex={0}
                    >
                      {x.dignity}
                    </span>
                  </>
                )}
              </td>
              <td class="pos">
                {degMin(x.deg)} {Vedic.RASHIS[x.sign][1]}
              </td>
              <td>
                <span class="tipzone" data-tip={`vd-nak:${x.nak.i}`} tabindex={0}>
                  {Vedic.NAKSHATRAS[x.nak.i][0]}
                </span>{' '}
                {x.nak.pada}
              </td>
              <td class="h">H{house(x.sign)}</td>
            </tr>
          );
        })}
      </table>
    </Card>
  );
}

function Dasha({ moment: { place }, model: { g, dashas } }: { moment: Moment; model: Model }) {
  const moon = g.list.find((x) => x.key === 'Moon')!;
  const monthYear = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, month: 'short', year: 'numeric' }).format(d);
  return (
    <Card title="Vimshottari dasha">
      <div id="vdDasha">
        <p class="cn-note" style="margin-top:0">
          For someone born at this moment: the Moon in {Vedic.NAKSHATRAS[moon.nak.i][0]} (ruled by {moon.nak.lord}) sets
          the sequence.
        </p>
        {dashas.map((x, i) => (
          <div class={`tr${i === 0 ? ' vd-first' : ''}`}>
            <span>
              {x.lord}
              {i === 0 && (
                <>
                  {' '}
                  <small class="muted">(balance)</small>
                </>
              )}
            </span>
            <span>
              {monthYear(x.start)} – {monthYear(x.end)} <small class="muted">{x.years.toFixed(1)} y</small>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VedicView({ moment, model }: ViewProps<Model>) {
  return (
    <div class="main" id="viewVedic" role="tabpanel" aria-labelledby="tabVedic">
      <div class="side">
        <ReadingCard
          id="vedicReadingCard"
          heading={<>Reading {dev('फल')}</>}
          reading={model.reading}
          link={shareURL}
          storageKey="skywheel-vedic-reading"
          open={['The day', 'Lagna, Moon and Sun']}
          title={`${model.title} · ${subtitleOf(moment)}`}
          note="Open a section, then a line, to go deeper: each graha and each house unfolds into its sign lord, nakshatra, navamsa, aspects and condition. Read as the quality of this moment; for someone born now, the same lines describe the birth chart."
        />
        <Panchang moment={moment} model={model} />
        <Muhurta moment={moment} model={model} />
        <DaysAhead moment={moment} />
      </div>
      <div class="side">
        <RashiChart model={model} />
        <Grahas model={model} />
        <Dasha moment={moment} model={model} />
      </div>
    </div>
  );
}

// what the page header shows for this tab
function header({ title, p, lagnaSign, month }: Model): HeaderInfo {
  return {
    title,
    big3: (
      <>
        <div>
          <b>{Vedic.RASHIS[lagnaSign][1]}</b> Lagna
        </div>
        <div>
          <b>{Vedic.RASHIS[Math.floor(p.moonSid / 30)][1]}</b> Chandra
        </div>
        <div>
          <b>
            {month.adhika ? 'Adhika ' : ''}
            {month.name}
          </b>{' '}
          masa
        </div>
      </>
    ),
  };
}

defineView('vedic', { build, header, View: VedicView });

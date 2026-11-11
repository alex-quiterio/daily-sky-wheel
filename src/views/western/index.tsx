// Western tab: the wheel and its tables on the left; the reading, the day, planetary hours and the year ahead on the right.
import * as Astronomy from 'astronomy-engine';
import { background } from '#lib/background.ts';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Western } from '#astro';
import type { Pattern, YearEvent } from '#astro';
import { APPROX, ASPECT_COLOR, ASPECT_GLYPH, EL_VAR, LABEL, VS } from '#lib/constants.ts';
import { isCompact } from '#lib/dom.ts';
import { fmtPos, g, norm, pad, sg } from '#lib/format.ts';
import { defineView, state as st } from '#lib/state.ts';
import { localParts, localToUTC, subtitleOf } from '#lib/time.ts';
import type { HeaderInfo, Moment, ViewProps } from '#lib/types.ts';
import { Bars } from '#components/Bars.tsx';
import { Card } from '#components/Card.tsx';
import { Chips } from '#components/Chips.tsx';
import { Drawing } from '#components/Drawing.tsx';
import { ReadingCard } from '#components/ReadingCard.tsx';
import { useStored } from '#components/useStored.ts';
import { goTo, jumpTo, setHouses, shiftDay, shareURL } from '#shell/controls.ts';
import { SYSTEMS, YEAR_CATS } from '#views/western/constants.ts';
import { drawMoon, drawWheel } from '#views/western/draw.ts';
import { build } from '#views/western/model.ts';
import type { Model } from '#views/western/types.ts';
import '#views/western/tips.tsx';
import '#views/western/styles.css';

function Wheel({ moment }: { moment: Moment }) {
  // redraw when crossing the phone/desktop width (e.g. rotating a phone)
  const [compact, setCompact] = useState(isCompact());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setCompact(isCompact()), 150);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // swipe left or right to change day
  const [touch, setTouch] = useState({ x: 0, y: 0, t: 0 });

  return (
    <div class="wheelbox">
      <div class="wheelbar">
        <span class="wheelbar-label" id="hsysLabel">
          Houses
        </span>
        <div class="seg" role="radiogroup" aria-labelledby="hsysLabel">
          {SYSTEMS.map(([value, label]) => (
            <label data-tip={`hsys:${value}`} data-tip-hover>
              <input
                type="radio"
                name="hsysPick"
                value={value}
                checked={moment.hsys === value}
                onChange={() => setHouses(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <button type="button" class="infobtn" data-tip="houses:all" aria-label="What each house means">
          i
        </button>
      </div>
      <Drawing
        id="wheel"
        viewBox="-16 -16 672 672"
        role="img"
        aria-label="Chart wheel"
        draw={(svg) => drawWheel(svg, moment.chart, moment.asps)}
        deps={[moment.chart, compact]}
        onTouchStart={(e) => setTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() })}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touch.x,
            dy = e.changedTouches[0].clientY - touch.y;
          if (Date.now() - touch.t < 600 && Math.abs(dx) > 60 && Math.abs(dy) < 45) shiftDay(dx < 0 ? 1 : -1);
        }}
      />
      <div class="legend">
        <span>
          <i style="border-color:var(--fire)"></i>square / opposition
        </span>
        <span>
          <i style="border-color:var(--water)"></i>trine / sextile
        </span>
        <span>
          <i class="dash" style="border-color:var(--air)"></i>quincunx
        </span>
        <span>
          <i style="border-color:var(--muted)"></i>conjunction
        </span>
      </div>
    </div>
  );
}

// ---------- the tables ----------
function Positions({ moment }: { moment: Moment }) {
  const { chart } = moment;
  const houseOf = st.ctx!.houseOf;
  const rows: { name: string; lon: number; retro?: boolean }[] = [
    ...chart.pts,
    { name: 'Asc', lon: chart.asc },
    { name: 'MC', lon: chart.mc },
    { name: 'Vertex', lon: chart.vertex },
  ];
  const ANGLE: Record<string, string> = { Asc: 'angle:AC', MC: 'angle:MC', Vertex: 'angle:Vx' };
  return (
    <Card title="Positions" id="positionsCard">
      <table class="eph" id="eph">
        {rows.map((p) => {
          const pos = fmtPos(p.lon);
          const isAngle = p.name in ANGLE;
          return (
            <tr
              data-tip={ANGLE[p.name] || `planet:${p.name}`}
              tabindex={0}
              class={`tipzone${APPROX.includes(p.name) ? ' approx' : ''}`}
            >
              <td class="g" style={isAngle ? 'font-family:var(--f-data);font-size:11px;font-weight:600' : ''}>
                {g(p.name)}
              </td>
              <td class="nm">{LABEL[p.name] || p.name}</td>
              <td class="pos">
                {pos.deg}°{' '}
                <span style={`color:var(${EL_VAR[pos.sign % 4]});font-family:var(--f-glyph)`}>{sg(pos.sign)}</span>{' '}
                {pad(pos.min)}′
              </td>
              <td class="r">{p.retro ? 'R' : ''}</td>
              <td class="h">
                {!isAngle && (
                  <span class="tipzone hcell" data-tip={`house:${houseOf(p.lon) - 1}`} tabindex={0}>
                    H{houseOf(p.lon)}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </table>
    </Card>
  );
}

function Aspects({ moment }: { moment: Moment }) {
  return (
    <Card title="Aspects" id="aspectsCard">
      <div class="asplist" id="asplist">
        {moment.asps.map((a, i) => (
          <div data-tip={`aspect:${i}`} tabindex={0} class="tipzone">
            <span class="gl">{g(a.a)}</span>
            <span class="gl" style={`color:${ASPECT_COLOR[a.type.key]}`}>
              {ASPECT_GLYPH[a.type.key]}
              {VS}
            </span>
            <span class="gl">{g(a.b)}</span>
            <span>
              {a.a} {a.type.name.toLowerCase()} {a.b}
            </span>
            <span class="o">
              {a.applying ? 'a' : 's'} {a.orb.toFixed(1)}°
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Balance({ moment, pats }: { moment: Moment; pats: Pattern[] }) {
  const bal = Western.balance(moment.chart);
  const ascSign = Math.floor(moment.chart.asc / 30);
  return (
    <Card title="Balance and patterns" id="balanceCard">
      <div class="grid2">
        <div>
          <div class="bars" id="elements">
            <Bars rows={Western.ELEMENT.map((label, i) => ({ label, n: bal.el[i], color: `var(${EL_VAR[i]})` }))} />
          </div>
        </div>
        <div>
          <div class="bars" id="modes">
            <Bars rows={Western.MODE.map((label, i) => ({ label, n: bal.md[i], color: 'var(--violet)' }))} />
          </div>
        </div>
      </div>
      <div id="patterns" style="margin-top:10px">
        <div style="margin-bottom:6px;font-size:13px">
          Strongest: <b>{bal.strongEl}</b>, <b>{bal.strongMd}</b> · Chart ruler: <b>{Western.RULER[ascSign]}</b> (
          {Western.SIGNS[ascSign]} rising) · <span class="note">counts Sun to Pluto plus the Ascendant</span>
        </div>
        {pats.length ? (
          pats.map((p) => (
            <span class="pill">
              <b>{p.type}</b> {p.type === 'Stellium' ? `in ${p.focus} · ` : p.focus ? `to ${p.focus} · ` : ''}
              {p.members
                .filter((n) => n !== p.focus)
                .map((n) => `${g(n)} ${n}`)
                .join(', ')}
            </span>
          ))
        ) : (
          <span class="empty">No Yod, T-square, Grand Trine or stellium right now.</span>
        )}
      </div>
    </Card>
  );
}

// ---------- the day ----------
function Day({ moment, model }: { moment: Moment; model: Model }) {
  const { phase, moonSign } = model;
  const shown = model.events.filter(
    (e) => e.kind !== 'aspect' || ['conj', 'opp', 'sq', 'tri', 'sex'].includes(e.type!.key),
  );
  return (
    <Card title="The day" id="todayCard">
      <div class="today-head">
        <Drawing
          class="moonpic"
          id="moonpic"
          width="56"
          height="56"
          viewBox="0 0 56 56"
          aria-hidden="true"
          draw={(svg) => drawMoon(svg, phase)}
          deps={[phase.elong]}
        />
        <div>
          <div class="ph" id="phase">
            {phase.name} in {moonSign}
          </div>
          <div class="meta" id="phasemeta">
            {Math.round(phase.illum * 100)}% lit · {Math.round(phase.elong)}° from the Sun
          </div>
        </div>
      </div>
      <ul class="events" id="events">
        {!shown.length && (
          <li class="empty" style="display:block">
            No exact aspects, sign changes or stations on this day.
          </li>
        )}
        {shown.map((e) => {
          const time = localParts(e.t, moment.place.tz).time;
          const glyph = e.kind === 'aspect' ? ASPECT_GLYPH[e.type!.key] : e.kind === 'lunation' ? '☽' : g(e.body);
          return (
            <li class={e.kind !== 'aspect' ? 'big' : undefined}>
              <span class="t">{time}</span>
              <span class="g">
                {glyph}
                {VS}
              </span>
              <span class="txt">
                <button type="button" title="Cast the chart for this moment" onClick={() => goTo({ time })}>
                  {e.text}
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// ---------- planetary hours ----------
function PlanetaryHours({ moment }: { moment: Moment }) {
  const { when, place, local } = moment;
  const ph = useMemo(() => {
    const obs = new Astronomy.Observer(place.lat, place.lon, 0);
    const dayAt = (y: number, m: number, d: number) => {
      const mid = localToUTC(y, m, d, 0, 0, place.tz);
      const rise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, +1, mid, 1),
        set = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, mid, 1);
      return rise && set
        ? { sunrise: rise.date, sunset: set.date, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
        : null;
    };
    const shift = (n: number): [number, number, number] => {
      const t = new Date(Date.UTC(local.y, local.m - 1, local.d + n));
      return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
    };
    const today = dayAt(local.y, local.m, local.d);
    if (!today) return 'none' as const;
    // before sunrise the hours still belong to the previous planetary day
    const early = when < today.sunrise;
    const base = early ? dayAt(...shift(-1)) : today,
      next = early ? today : dayAt(...shift(1));
    if (!base || !next) return null;
    return Western.planetaryHours(base.sunrise, base.sunset, next.sunrise, base.weekday);
  }, [when, local, place]);

  // count down only when the chart shows the present moment
  const live = Math.abs(when.getTime() - Date.now()) < 5 * 60000;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [live, when]);

  const time = (d: Date) => localParts(d, place.tz).time;
  if (ph === 'none')
    return (
      <Card title="Planetary hours" id="hoursCard">
        <div id="phNow">
          <p class="empty">The Sun does not rise or set here today, so there are no planetary hours.</p>
        </div>
        <div class="ph-grid" id="phList"></div>
      </Card>
    );
  if (!ph)
    return (
      <Card title="Planetary hours" id="hoursCard">
        <div id="phNow"></div>
        <div class="ph-grid" id="phList"></div>
      </Card>
    );

  const cur = ph.hours.find((x) => when >= x.start && when < x.end);
  const left = cur ? cur.end.getTime() - now : 0;
  const half = (title: string, hours: typeof ph.hours) => (
    <div>
      <div class="ph-head">
        {title} · {Math.round(hours[0].minutes)} min hours
      </div>
      {hours.map((x) => (
        <button
          type="button"
          class={`ph-item${x === cur ? ' now' : ''}`}
          data-t={x.start.toISOString()}
          title={`${x.ruler} · ${Math.round(x.minutes)} minutes`}
          onClick={() => goTo(localParts(x.start, place.tz))}
        >
          <span class="ph-t">{time(x.start)}</span>
          <span class="ph-ig">{g(x.ruler)}</span>
          <span>{x.ruler}</span>
        </button>
      ))}
    </div>
  );
  return (
    <Card title="Planetary hours" id="hoursCard">
      <div id="phNow">
        <div class="ph-now">
          <div class="ph-big tipzone" data-tip={`ph:${ph.dayRuler}`} tabindex={0}>
            <span class="ph-g">{g(ph.dayRuler)}</span>
            <div>
              <small>Day of</small>
              <b>{ph.dayRuler}</b>
            </div>
          </div>
          {cur && (
            <div class="ph-big ph-cur tipzone" data-tip={`ph:${cur.ruler}`} tabindex={0}>
              <span class="ph-g">{g(cur.ruler)}</span>
              <div>
                <small>
                  {cur.isDay ? 'Day' : 'Night'} hour {cur.isDay ? cur.n : cur.n - 12} of 12
                </small>
                <b>Hour of {cur.ruler}</b>
                <small id="phCountdown" data-end={cur.end.toISOString()}>
                  {live && left > 0 && left < 6 * 3600000 ? `${Math.floor(left / 60000)} min left · ` : ''}until{' '}
                  {time(cur.end)}
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
      <div class="ph-grid" id="phList">
        {half('☀︎ Day', ph.hours.slice(0, 12))}
        {half('☾ Night', ph.hours.slice(12))}
      </div>
    </Card>
  );
}

let yearCache: YearEvent[] | null = null; // worked out once, from today
let yearJob: Promise<YearEvent[]> | null = null; // the request, so a remount never asks twice
const startOfToday = () => {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

function YearGlyphs({ e }: { e: YearEvent }) {
  const sym = (x: string) => <span class="yg-s">{x}</span>;
  if (e.cat === 'retro')
    return (
      <>
        {g(e.body)}
        {sym(e.retro ? '℞' : 'D')}
      </>
    );
  if (e.cat === 'ingress' || e.cat === 'season')
    return (
      <>
        {g(e.cat === 'season' ? 'Sun' : e.body)}
        {sym('→')}
        {sg(e.sign!)}
      </>
    );
  if (e.cat === 'aspect')
    return (
      <>
        {g(e.body)}
        <span style={`color:${ASPECT_COLOR[e.aspKey!]}`}>
          {ASPECT_GLYPH[e.aspKey!]}
          {VS}
        </span>
        {g(e.other!)}
      </>
    );
  if (e.cat === 'eclipse') return <span class={`ecl ecl-${e.body === 'Sun' ? 'sun' : 'moon'}`}></span>;
  if (e.cat === 'venus')
    return (
      <>
        {g('Venus')}
        {ASPECT_GLYPH.conj}
        {VS}
        {g('Sun')}
      </>
    );
  return null;
}

function YearAhead({ moment }: { moment: Moment }) {
  const { place, when } = moment;
  const [events, setEvents] = useState(yearCache);
  const [cat, setCat] = useStored('skywheel-year', 'all');
  // the year ahead takes a moment to work out, so it runs in the background, once
  useEffect(() => {
    if (yearCache) return;
    let mounted = true;
    yearJob ??= background('yearAhead', startOfToday()).catch((): YearEvent[] => []);
    yearJob.then((found) => {
      yearCache = found;
      if (mounted) setEvents(found);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!events)
    return (
      <Card title="Year ahead" id="yearCard">
        <div class="chips" id="yearChips" role="group" aria-label="Show"></div>
        <div class="yearlist" id="yearlist">
          <p class="empty">Finding the eclipses, stations and ingresses of the next 12 months…</p>
        </div>
      </Card>
    );

  const list = events.filter((e) => cat === 'all' || e.cat === cat);
  const fmtMonth = new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, month: 'long', year: 'numeric' });
  const fmtDay = new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, day: 'numeric', month: 'short' });
  const now = Date.now();
  let month = '';
  return (
    <Card title="Year ahead" id="yearCard">
      <Chips
        id="yearChips"
        options={YEAR_CATS.map(([c, label]) => [
          c,
          c === 'all' ? label : `${label} ${events.filter((e) => e.cat === c).length}`,
        ])}
        value={cat}
        onPick={setCat}
      />
      <div class="yearlist" id="yearlist">
        {!list.length && <p class="empty">Nothing of this kind in the next 12 months.</p>}
        {list.map((e) => {
          const m = fmtMonth.format(e.t);
          const head = m !== month && <div class="ymonth">{m}</div>;
          month = m;
          const days = Math.round((e.t.getTime() - now) / 86400000);
          const active = Math.abs(e.t.getTime() - when.getTime()) < 90000;
          return (
            <>
              {head}
              <button
                type="button"
                class={`yitem y-${e.cat}${active ? ' active' : ''}`}
                data-t={e.t.toISOString()}
                title="Cast the chart for this moment"
                onClick={() => jumpTo(e.t.toISOString())}
              >
                <span class="yd">
                  <b>{fmtDay.format(e.t)}</b>
                  <small>{localParts(e.t, place.tz).time}</small>
                </span>
                <span class="yg">
                  <YearGlyphs e={e} />
                </span>
                <span class="yt">
                  {e.title}
                  {e.detail && <small>{e.detail}</small>}
                </span>
                <span class="yin">{days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} d`}</span>
              </button>
            </>
          );
        })}
      </div>
    </Card>
  );
}

// ---------- the tab ----------
function WesternView({ moment, model }: ViewProps<Model>) {
  return (
    <div class="main" id="viewWestern" role="tabpanel" aria-labelledby="tabWestern">
      {/* left: the chart and its numbers */}
      <div class="side">
        <Wheel moment={moment} />
        <Positions moment={moment} />
        <Aspects moment={moment} />
        <Balance moment={moment} pats={model.pats} />
      </div>
      {/* right: what it means, and when */}
      <div class="side">
        <ReadingCard
          id="readingCard"
          heading="Reading"
          reading={model.reading}
          link={shareURL}
          storageKey="skywheel-reading"
          open={['Sun, Moon and Rising', 'Strongest contacts']}
          title={`${model.title} · ${subtitleOf(moment)}`}
          note="Built from the traditional meanings of the signs, planets, aspects and houses, for the sky of this moment. For someone born at this minute, the same lines describe character. A way of reading the symbols, not a prediction."
        />
        <Day moment={moment} model={model} />
        <PlanetaryHours moment={moment} />
        <YearAhead moment={moment} />
      </div>
    </div>
  );
}

// what the page header shows for this tab
function header(model: Model, { chart, byName }: Moment): HeaderInfo {
  const lights: [string, number][] = [
    ['Rising', chart.asc],
    ['Moon', byName.Moon.lon],
    ['Sun', byName.Sun.lon],
  ];
  return {
    title: model.title,
    big3: lights.map(([label, lon]) => (
      <div>
        <b>{Western.SIGNS[Math.floor(norm(lon) / 30)]}</b> {label}
      </div>
    )),
  };
}

defineView('western', { build, header, View: WesternView });

// Maya tab: the Tzolk'in day, the Long Count, the Haab' and the calendar gears.
import { Maya } from '#astro';
import { defineView } from '#lib/state.ts';
import type { HeaderInfo, Moment, ViewProps } from '#lib/types.ts';
import { Card } from '#components/Card.tsx';
import { Drawing } from '#components/Drawing.tsx';
import { Row } from '#components/Row.tsx';
import { goTo } from '#shell/controls.ts';
import { DIR_COLOR } from '#views/maya/constants.ts';
import { drawGears } from '#views/maya/draw.ts';
import { build, utcDate } from '#views/maya/model.ts';
import type { MayaDate, Model } from '#views/maya/types.ts';
import '#views/maya/tips.ts';
import '#views/maya/styles.css';

// Maya bar-and-dot numeral (0-19); 0 is the shell.
function BarDot({ n, w = 44 }: { n: number; w?: number }) {
  const h = w * 1.25,
    cx = w / 2;
  if (n === 0)
    return (
      <svg class="bardot" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-label={String(n)}>
        <ellipse cx={cx} cy={h / 2} rx={w * 0.38} ry={h * 0.2} fill="none" stroke="currentColor" stroke-width="2.2" />
        <path
          d={`M${cx - w * 0.24} ${h / 2 - 2} q${w * 0.24} ${h * 0.12} ${w * 0.48} 0`}
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        />
      </svg>
    );
  const bars = Math.floor(n / 5),
    dots = n % 5,
    bh = h * 0.11,
    gap = h * 0.06;
  const total = bars * (bh + gap) + (dots ? bh * 1.2 + gap : 0);
  const top = (h - total) / 2;
  const r = bh * 0.6,
    step = (w * 0.8) / 4;
  const x0 = cx - (step * (dots - 1)) / 2;
  const barsTop = top + (dots ? bh * 1.2 + gap : 0);
  return (
    <svg class="bardot" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-label={String(n)}>
      {Array.from({ length: dots }, (_, i) => (
        <circle cx={x0 + i * step} cy={top + r} r={r} fill="currentColor" />
      ))}
      {Array.from({ length: bars }, (_, i) => (
        <rect x={w * 0.08} y={barsTop + i * (bh + gap)} width={w * 0.84} height={bh} rx={bh / 2} fill="currentColor" />
      ))}
    </svg>
  );
}

function Cartouche({ sign, size = '' }: { sign: number; size?: string }) {
  const [name, english] = Maya.SIGNS[sign];
  const [, colour] = Maya.DIRECTIONS[sign % 4];
  return (
    <span class={`cartouche ${size}`} style={`--dir:${DIR_COLOR[colour]}`}>
      <b>{name}</b>
      <small>{english}</small>
    </span>
  );
}

function DaySign({ r }: { r: MayaDate }) {
  const [name, english, meaning] = Maya.SIGNS[r.tz.sign];
  const [direction, colour] = r.direction;
  return (
    <Card title="Tzolk'in · day sign">
      <div id="myDay">
        <div class="my-hero tipzone" data-tip={`my-sign:${r.tz.sign}`} tabindex={0}>
          <span class="my-num" style={`color:${DIR_COLOR[colour]}`}>
            <BarDot n={r.tz.number} w={56} />
          </span>
          <Cartouche sign={r.tz.sign} size="big" />
          <div class="my-hero-text">
            <div class="my-title">
              {r.tz.number} {name}
            </div>
            <div class="muted">
              {english} · {direction}, {colour.toLowerCase()}
            </div>
          </div>
        </div>
        <div class="tplain my-meaning">{meaning}</div>
        <Row k="Day of the count">{r.kin} of 260</Row>
        <Row k="Trecena">
          began on 1 {Maya.SIGNS[r.trecena][0]} ({Maya.SIGNS[r.trecena][1]}) · day {r.tz.number} of 13
        </Row>
        <Row k="Lord of the Night">G{r.lord} of 9</Row>
        <Row k="Calendar Round">
          {r.tz.number} {name} {r.hb.day} {Maya.HAAB[r.hb.month]}
        </Row>
      </div>
    </Card>
  );
}

function LongCount({ r }: { r: MayaDate }) {
  return (
    <Card title="Long Count">
      <div class="lc" id="myLong">
        {Maya.LC_UNITS.map(([unit, days], i) => (
          <div class="lc-col">
            <span class="lc-num">
              <BarDot n={r.longCount[i]} w={40} />
            </span>
            <b>{r.longCount[i]}</b>
            <small>{unit}</small>
            <small class="muted">{days.toLocaleString('en')} d</small>
          </div>
        ))}
      </div>
      <p class="cn-note" id="myRound">
        {r.longCount.join('.')} · {r.days.toLocaleString('en')} days since the Maya creation date, 11 August 3114 BCE.
      </p>
    </Card>
  );
}

function NextDays({ moment: { local }, r }: { moment: Moment; r: MayaDate }) {
  return (
    <Card title="The next 20 days">
      <div class="my-next" id="myNext">
        {Array.from({ length: 20 }, (_, i) => {
          const date = new Date(Date.UTC(local.y, local.m - 1, local.d + i + 1));
          const t = Maya.tzolkin(r.days + i + 1);
          const iso = date.toISOString().slice(0, 10);
          return (
            <button
              type="button"
              class="my-day"
              data-date={iso}
              style={`--dir:${DIR_COLOR[Maya.DIRECTIONS[t.sign % 4][1]]}`}
              onClick={() => goTo({ date: iso })}
            >
              <span class="my-day-n">{t.number}</span>
              <span class="my-day-s">{Maya.SIGNS[t.sign][0]}</span>
              <small>{utcDate(date)}</small>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Gears({ r }: { r: MayaDate }) {
  return (
    <Card title="Calendar gears">
      <Drawing
        id="myGears"
        viewBox="0 0 460 300"
        role="img"
        aria-label="The 13-number and 20-sign gears of the Tzolk'in, turned to this day"
        draw={(svg) => drawGears(svg, r)}
        deps={[r.days]}
      />
      <p class="cn-note">
        The 13 numbers and 20 day signs turn together, so the same pair returns every 260 days. Where the gears meet is
        this day.
      </p>
    </Card>
  );
}

function Haab({ moment: { local }, r }: { moment: Moment; r: MayaDate }) {
  const newYear = new Date(Date.UTC(local.y, local.m - 1, local.d + r.daysToNewYear));
  return (
    <Card title="Haab' · the 365-day year">
      <div id="myHaab">
        <div class="hb-now">
          <span class="my-num">
            <BarDot n={r.hb.day} w={44} />
          </span>
          <div>
            <div class="my-title">
              {r.hb.day} {Maya.HAAB[r.hb.month]}
            </div>
            <div class="muted">
              {r.hb.month === 18
                ? "Wayeb' · the five nameless days"
                : `Month ${r.hb.month + 1} of 18 · day ${r.hb.day} of 20`}
            </div>
          </div>
        </div>
        <div class="hb-strip">
          {Maya.HAAB.map((month, i) => (
            <span class={`hb-m${i === r.hb.month ? ' on' : ''}${i === 18 ? ' wayeb' : ''}`} title={month}>
              {month}
            </span>
          ))}
        </div>
        <Row k="Year bearer">
          {r.bearer.number} {Maya.SIGNS[r.bearer.sign][0]} <span class="muted">({Maya.SIGNS[r.bearer.sign][1]})</span>
        </Row>
        <Row k="Next 0 Pop">
          {utcDate(newYear, true)} · in {r.daysToNewYear} days
        </Row>
      </div>
    </Card>
  );
}

function MayaView({ moment, model: { r } }: ViewProps<Model>) {
  return (
    <div class="main" id="viewMaya" role="tabpanel" aria-labelledby="tabMaya">
      <div class="side">
        <DaySign r={r} />
        <LongCount r={r} />
        <NextDays moment={moment} r={r} />
      </div>
      <div class="side">
        <Gears r={r} />
        <Haab moment={moment} r={r} />
      </div>
    </div>
  );
}

// what the page header shows for this tab
function header({ r }: Model): HeaderInfo {
  const [name, english] = Maya.SIGNS[r.tz.sign];
  return {
    title: `${r.tz.number} ${name} · ${r.hb.day} ${Maya.HAAB[r.hb.month]}`,
    emblem: { mark: <BarDot n={r.tz.number} w={34} />, title: `${r.tz.number} ${name}` },
    big3: (
      <>
        <div>
          <b>{r.longCount.join('.')}</b>
        </div>
        <div>
          <b>{english}</b> day · {r.direction[0]}
        </div>
        <div>
          Lord of the Night <b>G{r.lord}</b>
        </div>
      </>
    ),
  };
}

defineView('maya', { build, header, View: MayaView });

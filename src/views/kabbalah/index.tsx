// Kabbalah tab: the Hebrew date, Shabbat times, the month in Sefer Yetzirah and the Tree of Life.
import { Hebrew } from '#astro';
import { defineView } from '#lib/state.ts';
import { localParts } from '#lib/time.ts';
import type { HeaderInfo, Moment, ViewProps } from '#lib/types.ts';
import { Card } from '#components/Card.tsx';
import { Drawing } from '#components/Drawing.tsx';
import { Row } from '#components/Row.tsx';
import { goTo } from '#shell/controls.ts';
import { drawTree } from '#views/kabbalah/draw.ts';
import { build, sunEvents } from '#views/kabbalah/model.ts';
import type { Model } from '#views/kabbalah/types.ts';
import '#views/kabbalah/tips.ts';
import '#views/kabbalah/styles.css';

export const he = (text: string) => (
  <span class="he" lang="he">
    {text}
  </span>
);

function HebrewDate({ moment: { local, place }, model: { h, after, today } }: { moment: Moment; model: Model }) {
  const time = (d?: Date) => (d ? localParts(d, place.tz).time : '—');
  const day = (d: Date) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: place.tz, weekday: 'short', day: 'numeric', month: 'short' }).format(
      d,
    );
  const holidays = Hebrew.holidays(h);
  // Shabbat times for the coming (or current) Shabbat
  const rd = Hebrew.rdFromCivil(local.y, local.m, local.d);
  const weekday = ((rd % 7) + 7) % 7;
  const friday = rd + (weekday === 6 ? -1 : (5 - weekday + 7) % 7);
  const fridaySunset = sunEvents(Hebrew.civilFromRd(friday), place).sunset;
  const candles = fridaySunset ? new Date(fridaySunset.getTime() - 18 * 60000) : null;
  const havdalah = sunEvents(Hebrew.civilFromRd(friday + 1), place).nightfall;
  return (
    <Card title="Hebrew date">
      <div id="kbDate">
        <div class="kb-hero">
          <div class="kb-he" lang="he" dir="rtl">
            {Hebrew.gematria(h.day)} {h.monthNameHe} {Hebrew.gematria(h.year)}
          </div>
          <div class="kb-en">
            {h.day} {h.monthName} {h.year}
          </div>
          <div class="muted">
            {Hebrew.DAY_NAMES[h.dow]}
            {after ? ' · began at sunset' : ''}
          </div>
        </div>
        {holidays.length > 0 && <div class="kb-hol">{holidays.join(' · ')}</div>}
        <Row k={after ? 'Began at sunset' : 'Sunset today'}>{time(today.sunset)}</Row>
        <Row k="Nightfall">{time(today.nightfall)}</Row>
        <Row k="Candle lighting">{candles ? `${day(candles)} · ${time(candles)}` : '—'}</Row>
        <Row k="Havdalah">{havdalah ? `${day(havdalah)} · ${time(havdalah)}` : '—'}</Row>
      </div>
    </Card>
  );
}

function Month({ h }: { h: Hebrew.HebrewDate }) {
  const [letter, letterName, sign, tribe, sense] = Hebrew.MONTH_KABBALAH[h.month];
  return (
    <Card title="The month · Sefer Yetzirah">
      <div id="kbMonth">
        <div class="kb-month">
          <span class="kb-letter" lang="he">
            {letter}
          </span>
          <div>
            <div class="kb-en">
              {h.monthName} {he(h.monthNameHe)}
            </div>
            <div class="muted">
              {h.monthLength} days · day {h.day}
            </div>
          </div>
        </div>
        <Row k="Letter">
          {letterName} {he(letter)}
        </Row>
        <Row k="Sign">{sign}</Row>
        <Row k="Tribe">{tribe}</Row>
        <Row k="Sense">{sense}</Row>
        <p class="cn-note">
          Sefer Yetzirah gives each month one of the twelve simple letters, a sign of the zodiac, a tribe of Israel and
          a human faculty.
        </p>
      </div>
    </Card>
  );
}

// holy days in the next 120 days, each holiday grouped into its own run of days
function Coming({ h }: { h: Hebrew.HebrewDate }) {
  interface Run {
    k: number; // days from now
    endK: number;
    label: string;
    civil: { y: number; m: number; d: number };
    date: Hebrew.HebrewDay;
  }
  const runs: Run[] = [],
    open: Record<string, Run> = {};
  for (let k = 1; k <= 120; k++) {
    const date = Hebrew.hebrewFromFixed(h.rd + k);
    Hebrew.holidays(date).forEach((label) => {
      if (open[label] && open[label].endK === k - 1) open[label].endK = k;
      else {
        open[label] = { k, endK: k, label, civil: Hebrew.civilFromRd(h.rd + k), date };
        runs.push(open[label]);
      }
    });
  }
  const coming = runs.sort((x, y) => x.k - y.k).slice(0, 8);
  return (
    <Card title="Coming days">
      <div id="kbComing">
        {!coming.length && <p class="empty">No holy days in the next 120 days.</p>}
        {coming.map((x) => {
          const civil = new Date(Date.UTC(x.civil.y, x.civil.m - 1, x.civil.d));
          const iso = civil.toISOString().slice(0, 10);
          const label = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'UTC',
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }).format(civil);
          return (
            <button type="button" class="kb-coming" data-date={iso} onClick={() => goTo({ date: iso })}>
              <span class="kb-c-d">{label}</span>
              <span>
                {x.label}
                {x.endK > x.k ? ` (${x.endK - x.k + 1} days)` : ''}
                <small>
                  {x.date.day} {Hebrew.monthName(x.date.year, x.date.month)} · from the evening before · in {x.k} d
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function Tree({ model: { h, omer } }: { model: Model }) {
  const sefira = Hebrew.DAY_SEFIRA[h.dow];
  return (
    <Card title={<>Tree of Life {he('עץ חיים')}</>}>
      <Drawing
        id="kbTree"
        viewBox="0 0 360 520"
        role="img"
        aria-label="The Tree of Life with this day's sefira lit"
        draw={(svg) => drawTree(svg, sefira, omer)}
        deps={[sefira, omer?.day]}
      />
      <div class="legend" id="kbLegend">
        <span>
          <b class="kb-dot"></b>the day's sefira{omer ? ' and the Omer pair' : ''}
        </span>
      </div>
    </Card>
  );
}

// the sefira and planet of the weekday, and the Omer in season
function Day({ model: { h, omer } }: { model: Model }) {
  const index = Hebrew.DAY_SEFIRA[h.dow];
  const [hebrew, name, english, about] = Hebrew.SEFIROT[index];
  const inner = omer && Hebrew.SEFIROT[omer.inner],
    outer = omer && Hebrew.SEFIROT[omer.outer];
  return (
    <Card title={omer ? 'The day · Counting of the Omer' : 'The day'}>
      <div id="kbDay">
        <div class="kb-sef tipzone" data-tip={`kb-sefira:${index}`} tabindex={0}>
          <span class="kb-sef-he" lang="he">
            {hebrew}
          </span>
          <div>
            <div class="kb-en">
              {name} · {english}
            </div>
            <div class="muted">
              {Hebrew.DAY_NAMES[h.dow]} · day of {Hebrew.DAY_PLANET[h.dow]}
            </div>
          </div>
        </div>
        <div class="tplain">{about}</div>
        {omer && inner && outer && (
          <div class="kb-omer">
            <div class="kb-omer-n">{omer.day}</div>
            <div>
              <b>Day {omer.day} of the Omer</b>
              {omer.day >= 7 && (
                <div class="muted">
                  {omer.weeks} week{omer.weeks === 1 ? '' : 's'}
                  {omer.rest < 7 ? ` and ${omer.rest} day${omer.rest === 1 ? '' : 's'}` : ''}
                </div>
              )}
              <div>
                {inner[1]} she'b'{outer[1]} {he(`${inner[0]} שב${outer[0]}`)}
              </div>
              <div class="muted">
                {inner[2]} within {outer[2]}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function KabbalahView({ moment, model }: ViewProps<Model>) {
  return (
    <div class="main" id="viewKabbalah" role="tabpanel" aria-labelledby="tabKabbalah">
      <div class="side">
        <HebrewDate moment={moment} model={model} />
        <Month h={model.h} />
        <Coming h={model.h} />
      </div>
      <div class="side">
        <Tree model={model} />
        <Day model={model} />
      </div>
    </div>
  );
}

// what the page header shows for this tab
function header({ h, today }: Model, { place }: Moment): HeaderInfo {
  const [letter, letterName, sign] = Hebrew.MONTH_KABBALAH[h.month];
  const sefira = Hebrew.SEFIROT[Hebrew.DAY_SEFIRA[h.dow]];
  return {
    title: `${h.day} ${h.monthName} ${h.year}`,
    letter,
    big3: (
      <>
        <div>
          <b>{Hebrew.DAY_NAMES[h.dow]}</b> · {sefira[1]}
        </div>
        <div>
          Month of <b>{letterName}</b> · {sign}
        </div>
        <div>
          Sunset <b>{today.sunset ? localParts(today.sunset, place.tz).time : '—'}</b>
        </div>
      </>
    ),
  };
}

defineView('kabbalah', { build, header, View: KabbalahView });

// Islamic tab: the Hijri date, prayer times, the Qibla, dates ahead and the Moon.
import { useEffect, useState } from 'preact/hooks';
import { Western, Islamic } from '#astro';
import { defineView } from '#lib/state.ts';
import { dateFormat, localParts } from '#lib/time.ts';
import type { HeaderInfo, Moment, ViewProps } from '#lib/types.ts';
import { Card } from '#components/Card.tsx';
import { Drawing } from '#components/Drawing.tsx';
import { Row } from '#components/Row.tsx';
import { goTo } from '#shell/controls.ts';
import { PRAYERS } from '#views/islamic/constants.ts';
import { drawQibla } from '#views/islamic/draw.ts';
import { build, setPrefs } from '#views/islamic/model.ts';
import type { Model } from '#views/islamic/types.ts';
import '#views/islamic/styles.css';

const ar = (text: string) => (
  <span class="ar" lang="ar">
    {text}
  </span>
);

function HijriDate({ model: { h, after } }: { model: Model }) {
  const [month, monthAr] = Islamic.MONTHS[h.month - 1];
  const [weekday, weekdayAr] = Islamic.WEEKDAYS[h.weekday];
  const occasions = Islamic.OCCASIONS.filter((o) => o[0] === h.month && o[1] === h.day).map((o) => o[2]);
  if (h.day >= 13 && h.day <= 15) occasions.push('Ayyam al-Bid, the white days');
  if (h.weekday === 5) occasions.push("Jumu'ah");
  return (
    <Card title={<>Hijri date {<span class="ar">التقويم الهجري</span>}</>}>
      <div id="isDate">
        <div class="is-hero">
          <div class="is-ar" lang="ar" dir="rtl">
            {Islamic.indic(h.day)} {monthAr} {Islamic.indic(h.year)} هـ
          </div>
          <div class="kb-en">
            {h.day} {month} {h.year} AH
          </div>
          <div class="muted">
            {weekday} {ar(weekdayAr)}
            {after ? ' · began at Maghrib' : ''}
          </div>
        </div>
        {occasions.length > 0 && <div class="kb-hol">{occasions.join(' · ')}</div>}
        <Row k="Month">
          day {h.day} of {h.length}
        </Row>
        <p class="cn-note">
          Months begin by the Umm al-Qura rule at Mecca. Where the new crescent is sighted locally, the date can differ
          by a day.
        </p>
      </div>
    </Card>
  );
}

// "Asr in 2 h 14 min.", refreshed every half minute
function Countdown({ name, at }: { name: string; at: Date }) {
  const target = at.getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [target]);
  const ms = target - now;
  const hours = Math.floor(ms / 3600000),
    minutes = Math.floor((ms % 3600000) / 60000);
  return (
    <span id="isCountdown" data-t={at.toISOString()} data-n={name}>
      {ms > 0 && ms <= 86400000 ? `${name} in ${hours ? `${hours} h ` : ''}${minutes} min.` : ''}
    </span>
  );
}

function PrayerTimes({ moment: { place }, model }: { moment: Moment; model: Model }) {
  const { times, current, next } = model;
  const time = (d: Date | null) => (d ? localParts(d, place.tz).time : '—');
  const nextAt = next && times[next[0]];
  return (
    <Card title={<>Prayer times {<span class="ar">مواقيت الصلاة</span>}</>}>
      <div class="is-opts">
        <label class="field">
          <span>Method</span>
          <select id="isMethod" value={model.method} onChange={(e) => setPrefs({ method: e.currentTarget.value })}>
            {Object.entries(Islamic.METHODS).map(([key, method]) => (
              <option value={key}>{method.name}</option>
            ))}
          </select>
        </label>
        <div class="seg" role="radiogroup" aria-label="Asr">
          {[
            [1, "Asr: Shafi'i"],
            [2, 'Hanafi'],
          ].map(([value, label]) => (
            <label>
              <input
                type="radio"
                name="isAsr"
                value={value}
                checked={model.asr === value}
                onChange={() => setPrefs({ asr: +value })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div id="isPrayers">
        {PRAYERS.map(([key, english, arabic]) => (
          <div class={`tr is-pr${key === current ? ' now' : ''}${key === 'sunrise' ? ' minor' : ''}`}>
            <span>
              {english} {ar(arabic)}
              {key === current && (
                <>
                  {' '}
                  <b class="vd-now">now</b>
                </>
              )}
            </span>
            <span>{time(times[key])}</span>
          </div>
        ))}
        <p class="cn-note">
          {times.method}
          {model.method === 'uqa' ? ' (Isha 90 minutes after Maghrib)' : ''}.
          {times.adjusted
            ? ' The Sun does not reach the usual angle here tonight, so Fajr and Isha use the high-latitude share of the night.'
            : ''}
          {next && nextAt && (
            <>
              {' '}
              <Countdown name={next[1]} at={nextAt} />
            </>
          )}
        </p>
      </div>
    </Card>
  );
}

function DatesAhead({ moment: { local } }: { moment: Moment }) {
  const dayNumber = Math.floor(Date.UTC(local.y, local.m - 1, local.d) / 86400000);
  return (
    <Card title="Dates ahead">
      <div id="isComing">
        {Islamic.upcoming(dayNumber + 1, 8).map((o) => {
          const iso = o.date.toISOString().slice(0, 10);
          const label = dateFormat('en-GB', {
            timeZone: 'UTC',
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(o.date);
          return (
            <button type="button" class="kb-coming" data-date={iso} onClick={() => goTo({ date: iso })}>
              <span class="kb-c-d">{label}</span>
              <span>
                {o.name}
                <small>
                  {o.day} {Islamic.MONTHS[o.month - 1][0]} {o.year}
                  {o.note ? ` · ${o.note}` : ''} · in {o.inDays + 1} d
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function Qibla({ model: { qibla } }: { model: Model }) {
  const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(qibla.bearing / 45) % 8];
  return (
    <Card title={<>Qibla {<span class="ar">القبلة</span>}</>}>
      <Drawing
        id="isQibla"
        viewBox="0 0 300 300"
        role="img"
        aria-label="Compass with the direction of the Qibla"
        draw={(svg) => drawQibla(svg, qibla.bearing)}
        deps={[qibla.bearing]}
      />
      <div id="isQiblaText" class="is-qtext">
        <b>{qibla.bearing.toFixed(1)}°</b> from true north ({compass}) · {Math.round(qibla.km).toLocaleString('en')} km
        to the Kaaba
      </div>
    </Card>
  );
}

function Moon({ moment: { place, byName }, model: { times } }: { moment: Moment; model: Model }) {
  const crescent = Islamic.crescent(times.maghrib, place.lat, place.lon);
  const phase = Western.moonPhase(byName.Sun.lon, byName.Moon.lon);
  const mansion = Islamic.manzil(byName.Moon.lon),
    [name, meaning] = Islamic.MANAZIL[mansion];
  return (
    <Card title={<>The Moon {<span class="ar">القمر</span>}</>}>
      <div id="isMoon">
        <Row k="Phase">
          {phase.name} · {Math.round(phase.illum * 100)}% lit
        </Row>
        {crescent && crescent.ageH != null && (
          <Row k="Age at Maghrib">
            {crescent.ageH < 48 ? `${crescent.ageH.toFixed(1)} hours` : `${(crescent.ageH / 24).toFixed(1)} days`}
          </Row>
        )}
        {crescent && (
          <Row k="Altitude at Maghrib">
            {crescent.altitude.toFixed(1)}° · {crescent.elong.toFixed(1)}° from the Sun
          </Row>
        )}
        {crescent && crescent.verdict && <div class="kb-hol">Crescent tonight: {crescent.verdict}</div>}
        <Row k="Lunar mansion">
          {mansion + 1}. {name} <span class="muted">({meaning})</span>
        </Row>
        <p class="cn-note">
          The 28 lunar mansions (manāzil al-qamar) come from pre-Islamic Arab sky-lore and later Arabic astronomy, where
          they marked seasons and rains (anwāʾ). They are shown here as heritage, not religious practice.
        </p>
      </div>
    </Card>
  );
}

function IslamicView({ moment, model }: ViewProps<Model>) {
  return (
    <div class="main" id="viewIslamic" role="tabpanel" aria-labelledby="tabIslamic">
      <div class="side">
        <HijriDate model={model} />
        <PrayerTimes moment={moment} model={model} />
        <DatesAhead moment={moment} />
      </div>
      <div class="side">
        <Qibla model={model} />
        <Moon moment={moment} model={model} />
      </div>
    </div>
  );
}

// what the page header shows for this tab
function header({ h, next, times, qibla }: Model, { place }: Moment): HeaderInfo {
  const nextAt = next && times[next[0]];
  return {
    title: `${h.day} ${Islamic.MONTHS[h.month - 1][0]} ${h.year}`,
    day: Islamic.indic(h.day),
    big3: (
      <>
        <div>
          <b>{Islamic.WEEKDAYS[h.weekday][0]}</b>
        </div>
        <div>
          Next: <b>{next && nextAt ? `${next[1]} ${localParts(nextAt, place.tz).time}` : 'Fajr tomorrow'}</b>
        </div>
        <div>
          Qibla <b>{qibla.bearing.toFixed(0)}°</b>
        </div>
      </>
    ),
  };
}

defineView('islamic', { build, header, View: IslamicView });

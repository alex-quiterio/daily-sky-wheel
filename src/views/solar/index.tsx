// Solar System tab, the hidden one: an orrery of the Sun and the planets, the Earth and the Moon, for the moment.
// Opened from the globe at the foot of the page (or by typing "orrery"); Back to the wheel returns.
import { useEffect, useState } from 'preact/hooks';
import { sg } from '#lib/format.ts';
import { defineView } from '#lib/state.ts';
import type { HeaderInfo, ViewProps } from '#lib/types.ts';
import { Card } from '#components/Card.tsx';
import { Drawing } from '#components/Drawing.tsx';
import { Row } from '#components/Row.tsx';
import * as Western from '#astro/western.ts';
import { controls, goTo, shiftDay, toggleSecret } from '#shell/controls.ts';
import { COLOR, ELEMENTS } from '#views/solar/constants.ts';
import { BODY_GLYPH, drawEarthMoon, drawOrrery, drawPhase } from '#views/solar/draw.ts';
import { build } from '#views/solar/model.ts';
import { au, lightTime, period, showing } from '#views/solar/tips.tsx';
import type { Model } from '#views/solar/types.ts';
import '#views/solar/styles.css';

// move the date by months or years, keeping the day where the month allows
function shiftMonths(n: number) {
  const [y, m, d] = controls.get().date.split('-').map(Number);
  const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  goTo({ date: new Date(Date.UTC(y, m - 1 + n, Math.min(d, last))).toISOString().slice(0, 10) });
}

const STEPS: [label: string, title: string, go: () => void][] = [
  ['−1y', 'A year back', () => shiftMonths(-12)],
  ['−1m', 'A month back', () => shiftMonths(-1)],
  ['−1w', 'A week back', () => shiftDay(-7)],
  ['+1w', 'A week on', () => shiftDay(7)],
  ['+1m', 'A month on', () => shiftMonths(1)],
  ['+1y', 'A year on', () => shiftMonths(12)],
];

function Orrery({ moment, model }: ViewProps<Model>) {
  const [spinning, setSpinning] = useState(false);
  // two days a frame, about a year every fifteen seconds; any other change of date stops it
  useEffect(() => {
    if (!spinning) return;
    const timer = setInterval(() => shiftDay(2), 80);
    return () => clearInterval(timer);
  }, [spinning]);
  return (
    <Card title="The Solar System" class="sol-orrery">
      <Drawing
        id="solOrrery"
        viewBox="0 0 600 360"
        role="img"
        aria-label="The Sun and the planets, seen from above, at this moment"
        draw={(svg) => drawOrrery(svg, model)}
        deps={[moment.when.getTime()]}
      />
      <div class="sol-steps" role="group" aria-label="Move through time">
        {STEPS.slice(0, 3).map(([label, title, go]) => (
          <button type="button" title={title} onClick={go}>
            {label}
          </button>
        ))}
        <button
          type="button"
          class={spinning ? 'primary' : ''}
          aria-pressed={spinning}
          title={spinning ? 'Stop' : 'Run the planets forward, two days a step'}
          onClick={() => setSpinning(!spinning)}
        >
          {spinning ? '■ Stop' : '▶ Spin'}
        </button>
        {STEPS.slice(3).map(([label, title, go]) => (
          <button type="button" title={title} onClick={go}>
            {label}
          </button>
        ))}
      </div>
      <div class="legend">
        <span>Seen at a slant from above the north pole · 0° Aries to the right</span>
        <span>Distances on a log scale · sizes not to scale</span>
      </div>
    </Card>
  );
}

function EarthMoon({ moment, model }: ViewProps<Model>) {
  const { moon } = model;
  return (
    <Card title="Earth and Moon">
      <div class="sol-em">
        <Drawing
          id="solEarthMoon"
          viewBox="0 0 360 360"
          aria-label="The Earth and the Moon from above, lit from the Sun's side"
          draw={(svg) => drawEarthMoon(svg, model)}
          deps={[moment.when.getTime()]}
        />
        <div class="sol-phase">
          <Drawing
            viewBox="0 0 120 120"
            aria-label={`The Moon from the Earth: ${moon.phase.name}`}
            draw={(svg) => drawPhase(svg, model)}
            deps={[moment.when.getTime()]}
          />
          <div class="sol-phase-name">{moon.phase.name}</div>
          <div class="muted">{Math.round(moon.phase.illum * 100)}% lit</div>
        </div>
      </div>
      <Row k="Distance">{Math.round(moon.km).toLocaleString('en-GB')} km</Row>
      <Row k="Light takes">{(moon.km / 299792.458).toFixed(2)} s</Row>
      <Row k="Moon in">
        {sg(Math.floor(moon.geoLon / 30))} {Western.SIGNS[Math.floor(moon.geoLon / 30)]}
      </Row>
      <Row k="Earth from the Sun">{au(model.byName.Earth.sun)}</Row>
    </Card>
  );
}

function Table({ model }: { model: Model }) {
  return (
    <Card title="The planets">
      <div class="sol-table" role="table" aria-label="Distances and positions">
        <div class="sol-tr sol-th" role="row">
          <span role="columnheader">Planet</span>
          <span role="columnheader">From the Sun</span>
          <span role="columnheader">From the Earth</span>
          <span role="columnheader">In our sky</span>
        </div>
        {model.bodies.map((b) => {
          const s = Math.floor(b.geoLon / 30);
          return (
            <div class="sol-tr tipzone" role="row" data-tip={`sol-body:${b.name}`} tabindex={0}>
              <span role="cell">
                <span class="tg" style={{ color: COLOR[b.name] }}>
                  {BODY_GLYPH[b.name]}
                </span>{' '}
                {b.name}
              </span>
              <span role="cell">{au(b.sun)}</span>
              <span role="cell">
                {b.name === 'Earth' ? (
                  '—'
                ) : (
                  <>
                    {au(b.earth)}
                    <small>{lightTime(b.earth)}</small>
                  </>
                )}
              </span>
              <span role="cell">
                {b.name === 'Earth' ? (
                  <small>{period(ELEMENTS.Earth[5])} a lap</small>
                ) : (
                  <>
                    {sg(s)} {Western.SIGNS[s].slice(0, 3)}
                    {b.retro && <b class="sol-rx"> ℞</b>}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p class="cn-note">
        "In our sky" is where the planet stands in the zodiac seen from the Earth, as on the wheel. The orrery's ring
        shows the same planets seen from the Sun.
      </p>
    </Card>
  );
}

function SolarView({ moment, model }: ViewProps<Model>) {
  showing(model);
  return (
    <div class="main" id="viewSolarSystem" role="tabpanel" aria-labelledby="tabSolarSystem">
      <div class="sol-bar">
        <button type="button" class="sol-back" onClick={toggleSecret}>
          ← Back to the wheel
        </button>
        <span class="muted">You found the orrery.</span>
      </div>
      <div class="side">
        <Orrery moment={moment} model={model} />
      </div>
      <div class="side">
        <EarthMoon moment={moment} model={model} />
        <Table model={model} />
      </div>
    </div>
  );
}

function header(model: Model): HeaderInfo {
  const { moon, closest } = model;
  return {
    title: 'The Solar System',
    big3: (
      <>
        <div>
          <b>{moon.phase.name}</b> · {Math.round(moon.phase.illum * 100)}% lit
        </div>
        <div>
          Nearest planet <b>{closest.name}</b> · {au(closest.earth)}
        </div>
        <div>
          Earth <b>{au(model.byName.Earth.sun)}</b> from the Sun
        </div>
      </>
    ),
  };
}

defineView('solar', { build, header, View: SolarView });

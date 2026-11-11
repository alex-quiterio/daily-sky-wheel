// Chinese tab: Four Pillars, the Five Elements, the lunar calendar and the animal wheel.
import * as Chinese from '#astro/chinese.ts';
import * as Glossary from '#astro/glossary.ts';
import { defineView } from '#lib/state.ts';
import type { HeaderInfo, Moment, ViewProps } from '#lib/types.ts';
import { dateFormat, subtitleOf } from '#lib/time.ts';
import { Bars } from '#components/Bars.tsx';
import { Card } from '#components/Card.tsx';
import { Drawing } from '#components/Drawing.tsx';
import { ReadingCard } from '#components/ReadingCard.tsx';
import { Row } from '#components/Row.tsx';
import { shareURL } from '#shell/controls.ts';
import { EL_COLOR } from '#views/chinese/constants.ts';
import { drawAnimalWheel } from '#views/chinese/draw.ts';
import { build, polarity } from '#views/chinese/model.ts';
import type { Model } from '#views/chinese/types.ts';
import '#views/chinese/tips.tsx';
import '#views/chinese/styles.css';

const zh = (text: string) => <span class="zh">{text}</span>;

// ---------- Four Pillars ----------
function Stem({ s, god }: { s: number; god: string }) {
  const [ch, py, element] = Chinese.STEMS[s];
  return (
    <div class="pc-stem tipzone" data-tip={`cn-stem:${s}`} tabindex={0}>
      <span class="pc-god">{god}</span>
      <span class="pc-ch" style={`color:${EL_COLOR[element]}`}>
        {ch}
      </span>
      <span class="pc-py">{py}</span>
      <span class="pc-el">
        {polarity(s % 2 === 0)} {Chinese.ELEMENTS[element]}
      </span>
    </div>
  );
}

function Branch({ b, dm }: { b: number; dm: number }) {
  const [ch, py, animal, element, , , hidden] = Chinese.BRANCHES[b];
  return (
    <div class="pc-branch tipzone" data-tip={`cn-branch:${b}`} tabindex={0}>
      <span class="pc-ch" style={`color:${EL_COLOR[element]}`}>
        {ch}
      </span>
      <span class="pc-py">
        {py} · {animal}
      </span>
      <span class="pc-el">{Chinese.ELEMENTS[element]}</span>
      <span class="pc-hidden">
        {hidden.map((h) => (
          <span
            title={`${Chinese.STEMS[h][1]} ${Chinese.ELEMENTS[Chinese.STEMS[h][2]]} · ${Chinese.tenGod(dm, h)[1]}`}
            style={`color:${EL_COLOR[Chinese.STEMS[h][2]]}`}
          >
            {Chinese.STEMS[h][0]}
          </span>
        ))}
      </span>
    </div>
  );
}

function Pillars({ model: { p, dm } }: { model: Model }) {
  // shown right to left: hour, day, month, year
  const cols: [label: string, mark: string, pillar: Chinese.Pillar][] = [
    ['Hour', '時', p.hour],
    ['Day', '日', p.day],
    ['Month', '月', p.month],
    ['Year', '年', p.year],
  ];
  return (
    <Card title={<>Four Pillars {zh('四柱')}</>}>
      <div class="pillars" id="pillars">
        {cols.map(([label, mark, x]) => (
          <div class={`pcol${label === 'Day' ? ' pcol-dm' : ''}`}>
            <div class="pc-head">
              {label} {zh(mark)}
            </div>
            <Stem s={x.stem} god={label === 'Day' ? 'Day Master' : Chinese.tenGod(dm, x.stem)[1]} />
            <Branch b={x.branch} dm={dm} />
          </div>
        ))}
      </div>
      <p class="cn-note">
        Read right to left: year, month, day, hour. The year pillar turns at Start of Spring (立春), the month pillar at
        each solar term, and the day at local midnight.
      </p>
    </Card>
  );
}

function Elements({ model: { p, dm } }: { model: Model }) {
  const counts = Chinese.elementCount(p);
  const [ch, py, element, image, nature] = Chinese.STEMS[dm];
  const missing = Chinese.ELEMENTS.filter((_, i) => !counts[i]);
  return (
    <Card title={<>Five Elements {zh('五行')}</>}>
      <div class="bars" id="cnElements">
        <Bars
          rows={Chinese.ELEMENTS.map((name, i) => ({
            label: (
              <>
                {name} {zh(Chinese.ELEMENT_ZH[i])}
              </>
            ),
            n: counts[i],
            color: EL_COLOR[i],
          }))}
        />
      </div>
      <div id="cnDM" class="cn-dm">
        <div class="cn-dm-head">
          <span class="pc-ch" style={`color:${EL_COLOR[element]}`}>
            {ch}
          </span>
          <div>
            <b>
              Day Master: {polarity(dm % 2 === 0)} {Chinese.ELEMENTS[element]}
            </b>{' '}
            <span class="muted">
              ({py}, {image})
            </span>
            <p>{nature}</p>
          </div>
        </div>
        <p class="cn-note">
          Counts the eight characters by their main element.{missing.length ? ` Missing: ${missing.join(', ')}.` : ''}{' '}
          If this moment is a birth time, the Day Master stands for the person.
        </p>
      </div>
    </Card>
  );
}

function Calendar({ moment: { place }, model: { p, lun, terms, zodiac } }: { moment: Moment; model: Model }) {
  const element = Chinese.ELEMENTS[Chinese.STEMS[zodiac.stem][2]];
  const [mark, , animal] = Chinese.BRANCHES[zodiac.branch];
  const date = (d: Date, timeZone = place.tz) =>
    dateFormat('en-GB', { timeZone, day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  const china = (d: Date) => date(d, 'Asia/Shanghai'); // calendar dates are China dates
  const dateTime = (d: Date) =>
    dateFormat('en-GB', {
      timeZone: place.tz,
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(d);
  const next = Chinese.pillar(lun.year - 3);
  const cur = Chinese.TERMS[terms.current.i],
    nxt = Chinese.TERMS[terms.next.i];
  const clash = (p.day.branch + 6) % 12;
  return (
    <Card title={<>Calendar {zh('農曆')}</>}>
      <div id="cnCal">
        <div class="cn-year">
          <span class="cn-year-ch">
            {Chinese.STEMS[zodiac.stem][0]}
            {mark}
          </span>
          <div>
            <div class="cn-year-name">
              Year of the {element} {animal}
            </div>
            <div class="muted">
              {polarity(zodiac.stem % 2 === 0)} {element} · since Chinese New Year, {china(lun.newYear)}
            </div>
          </div>
        </div>
        <Row k="Lunar date">
          {lun.leap ? 'Leap ' : ''}
          {Chinese.LUNAR_MONTHS[lun.month]} month, day {lun.day} <span class="muted">of {lun.monthLength}</span>
        </Row>
        <Row k="Solar term">
          {zh(cur[0])} {cur[2]} <span class="muted">since {terms.current.at ? date(terms.current.at) : '—'}</span>
        </Row>
        <Row k="Next term">
          {zh(nxt[0])} {nxt[2]} <span class="muted">{terms.next.at ? dateTime(terms.next.at) : '—'}</span>
        </Row>
        <Row k="Day">
          {zh(Chinese.STEMS[p.day.stem][0] + Chinese.BRANCHES[p.day.branch][0])} {Chinese.BRANCHES[p.day.branch][2]} day
          · clashes with the {Chinese.BRANCHES[clash][2]} {zh(Chinese.BRANCHES[clash][0])}
        </Row>
        <Row k="Next New Year">
          {china(Chinese.chineseNewYear(lun.year + 1))} · {Chinese.ELEMENTS[Chinese.STEMS[next.stem][2]]}{' '}
          {Chinese.BRANCHES[next.branch][2]}
        </Row>
        {zodiac.index !== p.year.index && (
          <p class="cn-note">
            Between Start of Spring and Chinese New Year the year pillar ({Chinese.STEMS[p.year.stem][0]}
            {Chinese.BRANCHES[p.year.branch][0]}) and the zodiac year differ. Four Pillars uses Start of Spring.
          </p>
        )}
      </div>
    </Card>
  );
}

function AnimalWheel({ model: { p } }: { model: Model }) {
  return (
    <Card title={<>Animal wheel {zh('十二生肖')}</>}>
      <Drawing
        id="cnWheel"
        viewBox="-10 -10 420 420"
        role="img"
        aria-label="The twelve animals with this moment's year, month, day and hour"
        draw={(svg) => drawAnimalWheel(svg, p)}
        deps={[p.year.index, p.month.index, p.day.index, p.hour.index]}
      />
      <div class="legend" id="cnLegend">
        <span>
          <b>Y</b> year · <b>M</b> month · <b>D</b> day · <b>H</b> hour
        </span>
        <span>
          <i style="border-color:var(--fire);border-top-style:dashed"></i>day clash
        </span>
      </div>
    </Card>
  );
}

function ChineseView({ moment, model }: ViewProps<Model>) {
  return (
    <div class="main" id="viewChinese" role="tabpanel" aria-labelledby="tabChinese">
      <div class="side">
        <Pillars model={model} />
        <Elements model={model} />
      </div>
      <div class="side">
        <ReadingCard
          glossary={Glossary.CHINESE}
          id="chineseReadingCard"
          heading={<>Reading {zh('命理')}</>}
          reading={model.reading}
          link={shareURL}
          storageKey="skywheel-chinese-reading"
          open={['Day Master', 'The day’s officer']}
          title={`${header(model).title} · ${subtitleOf(moment)}`}
          note="The Day Master's strength is the common simplified count: the season first, then the other seven characters weighted by place. The officers follow the Tong Shu almanac, whose lists differ a little between editions. Read as the quality of this moment; for someone born now, the same lines describe the birth chart."
        />
        <Calendar moment={moment} model={model} />
        <AnimalWheel model={model} />
      </div>
    </div>
  );
}

// what the page header shows for this tab
function header({ p, dm, lun, terms, zodiac }: Model): HeaderInfo {
  const element = Chinese.ELEMENTS[Chinese.STEMS[zodiac.stem][2]],
    animal = Chinese.BRANCHES[zodiac.branch][2];
  return {
    title: `${Chinese.BRANCHES[p.day.branch][2]} Day · ${element} ${animal} Year`,
    seal: Chinese.BRANCHES[zodiac.branch][0],
    big3: (
      <>
        <div>
          <b>
            {Chinese.STEMS[dm][1]} {Chinese.ELEMENTS[Chinese.STEMS[dm][2]]}
          </b>{' '}
          Day Master
        </div>
        <div>
          <b>{Chinese.LUNAR_MONTHS[lun.month]}</b> lunar month
        </div>
        <div>
          <b>{Chinese.TERMS[terms.current.i][2]}</b>
        </div>
      </>
    ),
  };
}

defineView('chinese', { build, header, View: ChineseView });

// The method notes at the foot of the page.

export function MethodNotes() {
  return (
    <footer class="method">
      <h2>Method</h2>
      <dl>
        <div>
          <dt>Zodiac</dt>
          <dd>Tropical, geocentric. True node; mean or true (osculating) Lilith, as chosen under Positions.</dd>
        </div>
        <div>
          <dt>Planets</dt>
          <dd>Astronomy Engine, accurate to under 1′.</dd>
        </div>
        <div>
          <dt>Chiron &amp; asteroids</dt>
          <dd>
            Orbits from JPL Horizons, a set of elements every one or two years from 1900 to 2100: within about 1′.
            Outside those years they are marked <span class="approx-mark">≈</span> and drift further.
          </dd>
        </div>
        <div>
          <dt>Houses</dt>
          <dd>Placidus falls back to Equal above 66° latitude.</dd>
        </div>
        <div>
          <dt>Chinese</dt>
          <dd>
            Lunar months and New Year follow China Standard Time. The month pillar turns at each solar term and the day
            pillar at local midnight, with no true-solar-time correction.
          </dd>
        </div>
        <div>
          <dt>Maya</dt>
          <dd>
            GMT correlation (584283): 21 Dec 2012 = 13.0.0.0.0 4 Ajaw 3 K'ank'in. The day turns at local midnight.
          </dd>
        </div>
        <div>
          <dt>Kabbalah</dt>
          <dd>
            Hebrew calendar by the fixed arithmetic rules; the day turns at local sunset. Candle lighting 18 minutes
            before sunset; Havdalah when the Sun is 8.5° below the horizon. Month correspondences after Sefer Yetzirah.
          </dd>
        </div>
        <div>
          <dt>Vedic</dt>
          <dd>
            Sidereal zodiac with the Lahiri ayanamsa, mean Rahu and Ketu, whole-sign houses from the Lagna, and amanta
            lunar months. The weekday (vara) turns at sunrise.
          </dd>
        </div>
        <div>
          <dt>Islamic</dt>
          <dd>
            Hijri months by the Umm al-Qura rule at Mecca; local moon sighting may differ by a day. The day turns at
            Maghrib. Prayer times by the chosen method, with an angle-based fallback at high latitudes.
          </dd>
        </div>
        <div>
          <dt>Times</dt>
          <dd>Shown in the selected place's local time.</dd>
        </div>
      </dl>
    </footer>
  );
}

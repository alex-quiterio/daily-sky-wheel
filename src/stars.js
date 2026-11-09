// Background sky: drifting, twinkling stars, the odd shooting star, and a faint zodiac ring
// turning behind the page. Everything holds still when reduced motion is preferred.
(function () {
  const canvas = document.getElementById('stars');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [], meteors = [], w = 0, h = 0, dpr = 1, nextMeteor = 0, last = 0;

  // faint zodiac ring behind everything
  (function zodiacRing() {
    const ring = document.createElement('div');
    ring.className = 'sky-ring';
    ring.setAttribute('aria-hidden', 'true');
    const glyphs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    let svg = '<svg viewBox="-500 -500 1000 1000" xmlns="http://www.w3.org/2000/svg">';
    svg += '<circle r="470" fill="none" stroke="currentColor" stroke-width="1"/>';
    svg += '<circle r="400" fill="none" stroke="currentColor" stroke-width="0.6"/>';
    svg += '<circle r="300" fill="none" stroke="currentColor" stroke-width="0.4" stroke-dasharray="2 10"/>';
    for (let i = 0; i < 12; i++) {
      const a = (i * 30) * Math.PI / 180, m = (i * 30 + 15) * Math.PI / 180;
      svg += `<line x1="${400 * Math.cos(a)}" y1="${400 * Math.sin(a)}" x2="${470 * Math.cos(a)}" y2="${470 * Math.sin(a)}" stroke="currentColor" stroke-width="0.8"/>`;
      svg += `<text x="${435 * Math.cos(m)}" y="${435 * Math.sin(m)}" font-size="34" text-anchor="middle" dominant-baseline="central" fill="currentColor" transform="rotate(${i * 30 + 105} ${435 * Math.cos(m)} ${435 * Math.sin(m)})">${glyphs[i]}︎</text>`;
    }
    for (let d = 0; d < 360; d += 5) {
      const a = d * Math.PI / 180, len = d % 30 === 0 ? 0 : d % 10 === 0 ? 12 : 6;
      if (len) svg += `<line x1="${400 * Math.cos(a)}" y1="${400 * Math.sin(a)}" x2="${(400 + len) * Math.cos(a)}" y2="${(400 + len) * Math.sin(a)}" stroke="currentColor" stroke-width="0.5"/>`;
    }
    svg += '</svg>';
    ring.innerHTML = svg;
    document.body.insertBefore(ring, canvas.nextSibling);
  })();

  function seed() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((w * h) / 4200);
    stars = Array.from({ length: n }, () => {
      const tone = Math.random();
      const depth = Math.random();
      return {
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() < 0.06 ? 1.1 + Math.random() * 0.9 : 0.3 + Math.random() * 0.7,
        a: 0.25 + Math.random() * 0.6,
        tw: 0.4 + Math.random() * 1.6, ph: Math.random() * Math.PI * 2,
        vx: (0.6 + depth * 2.4), // px per second, nearer stars drift faster
        c: tone < 0.15 ? '244,220,156' : tone < 0.35 ? '190,170,255' : '235,232,255',
      };
    });
  }

  function spawnMeteor() {
    const fromTop = Math.random() < 0.7;
    const x = fromTop ? Math.random() * w * 0.9 : w * (0.6 + Math.random() * 0.4);
    const y = fromTop ? -20 : Math.random() * h * 0.4;
    const angle = (200 + Math.random() * 30) * Math.PI / 180; // down and to the left
    const speed = 650 + Math.random() * 450;
    meteors.push({ x, y, vx: Math.cos(angle) * speed, vy: -Math.sin(angle) * speed, life: 0, max: 0.9 + Math.random() * 0.7, len: 90 + Math.random() * 120 });
  }

  function draw(t) {
    const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
    last = t;
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      if (!still) { s.x -= s.vx * dt; if (s.x < -4) { s.x = w + 4; s.y = Math.random() * h; } }
      const a = still ? s.a : s.a * (0.55 + 0.45 * Math.sin(s.ph + (t / 1000) * s.tw));
      ctx.beginPath();
      ctx.fillStyle = `rgba(${s.c},${a.toFixed(3)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.1) {
        ctx.fillStyle = `rgba(${s.c},${(a * 0.12).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (!still) {
      if (t > nextMeteor) { if (nextMeteor) spawnMeteor(); nextMeteor = t + 4000 + Math.random() * 9000; }
      meteors = meteors.filter((m) => m.life < m.max);
      for (const m of meteors) {
        m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt;
        const fade = Math.sin(Math.PI * (m.life / m.max));
        const sp = Math.hypot(m.vx, m.vy), ux = m.vx / sp, uy = m.vy / sp;
        const g = ctx.createLinearGradient(m.x, m.y, m.x - ux * m.len, m.y - uy * m.len);
        g.addColorStop(0, `rgba(255,244,214,${(0.9 * fade).toFixed(3)})`);
        g.addColorStop(1, 'rgba(190,170,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - ux * m.len, m.y - uy * m.len); ctx.stroke();
        ctx.fillStyle = `rgba(255,248,230,${fade.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
  }

  seed();
  window.addEventListener('resize', () => { seed(); if (still) draw(0); });
  document.addEventListener('visibilitychange', () => { last = 0; });
  if (still) draw(0); else requestAnimationFrame(draw);
})();

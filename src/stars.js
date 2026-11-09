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

  // Chinese theme: a ring of the twelve branches around the eight trigrams
  (function branchRing() {
    const ring = document.createElement('div');
    ring.className = 'sky-ring sky-ring-cn';
    ring.setAttribute('aria-hidden', 'true');
    const branches = '子丑寅卯辰巳午未申酉戌亥';
    const trigrams = ['☰', '☴', '☵', '☶', '☷', '☳', '☲', '☱'];
    let svg = '<svg viewBox="-500 -500 1000 1000" xmlns="http://www.w3.org/2000/svg">';
    svg += '<circle r="470" fill="none" stroke="currentColor" stroke-width="1.2"/><circle r="458" fill="none" stroke="currentColor" stroke-width="0.5"/>';
    svg += '<circle r="380" fill="none" stroke="currentColor" stroke-width="0.8"/><circle r="250" fill="none" stroke="currentColor" stroke-width="0.6" stroke-dasharray="3 9"/>';
    svg += '<circle r="150" fill="none" stroke="currentColor" stroke-width="0.8"/>';
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 - 90) * Math.PI / 180, m = (i * 30 - 75) * Math.PI / 180;
      svg += `<line x1="${380 * Math.cos(m)}" y1="${380 * Math.sin(m)}" x2="${458 * Math.cos(m)}" y2="${458 * Math.sin(m)}" stroke="currentColor" stroke-width="0.8"/>`;
      svg += `<text x="${420 * Math.cos(a)}" y="${420 * Math.sin(a)}" font-size="46" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-family="Ma Shan Zheng, Noto Serif SC, serif" transform="rotate(${i * 30} ${420 * Math.cos(a)} ${420 * Math.sin(a)})">${branches[i]}</text>`;
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * 45 - 90) * Math.PI / 180;
      svg += `<text x="${200 * Math.cos(a)}" y="${200 * Math.sin(a)}" font-size="40" text-anchor="middle" dominant-baseline="central" fill="currentColor" transform="rotate(${i * 45} ${200 * Math.cos(a)} ${200 * Math.sin(a)})">${trigrams[i]}︎</text>`;
    }
    // taijitu at the centre
    svg += '<g transform="scale(1.1)"><circle r="100" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M0 -100 A100 100 0 0 1 0 100 A50 50 0 0 1 0 0 A50 50 0 0 0 0 -100Z" fill="currentColor" fill-opacity="0.55"/><circle cy="-50" r="13" fill="currentColor" fill-opacity="0.55"/><circle cy="50" r="13" fill="none" stroke="currentColor" stroke-width="1.5"/></g>';
    svg += '</svg>';
    ring.innerHTML = svg;
    document.body.insertBefore(ring, canvas.nextSibling);
  })();
  // Maya theme: a ring of the twenty day signs around the thirteen numbers
  (function mayaRing() {
    const ring = document.createElement('div');
    ring.className = 'sky-ring sky-ring-maya';
    ring.setAttribute('aria-hidden', 'true');
    const signs = ["Imix'", "Ik'", "Ak'b'al", "K'an", 'Chikchan', 'Kimi', "Manik'", 'Lamat', 'Muluk', 'Ok', 'Chuwen', "Eb'", "B'en", 'Ix', 'Men', "Kib'", "Kab'an", "Etz'nab'", 'Kawak', 'Ajaw'];
    let svg = '<svg viewBox="-500 -500 1000 1000" xmlns="http://www.w3.org/2000/svg">';
    svg += '<circle r="470" fill="none" stroke="currentColor" stroke-width="1.2"/><circle r="380" fill="none" stroke="currentColor" stroke-width="0.8"/>';
    svg += '<circle r="300" fill="none" stroke="currentColor" stroke-width="0.6" stroke-dasharray="1 7"/><circle r="200" fill="none" stroke="currentColor" stroke-width="0.8"/>';
    for (let i = 0; i < 20; i++) {
      const a = (i * 18 - 90) * Math.PI / 180, m = (i * 18 - 81) * Math.PI / 180;
      svg += `<line x1="${380 * Math.cos(m)}" y1="${380 * Math.sin(m)}" x2="${470 * Math.cos(m)}" y2="${470 * Math.sin(m)}" stroke="currentColor" stroke-width="0.8"/>`;
      svg += `<text x="${425 * Math.cos(a)}" y="${425 * Math.sin(a)}" font-size="26" text-anchor="middle" dominant-baseline="central" fill="currentColor" font-family="Cinzel, serif" transform="rotate(${i * 18} ${425 * Math.cos(a)} ${425 * Math.sin(a)})">${signs[i]}</text>`;
    }
    for (let j = 0; j < 13; j++) {
      const a = (j * 360 / 13 - 90) * Math.PI / 180, x = 250 * Math.cos(a), y = 250 * Math.sin(a);
      const n = j + 1, bars = Math.floor(n / 5), dots = n % 5;
      let g = `<g transform="translate(${x} ${y}) rotate(${j * 360 / 13})">`;
      for (let d = 0; d < dots; d++) g += `<circle cx="${(d - (dots - 1) / 2) * 12}" cy="${-8 - bars * 5}" r="4" fill="currentColor"/>`;
      for (let b = 0; b < bars; b++) g += `<rect x="-22" y="${-2 + b * 10 - bars * 5}" width="44" height="6" rx="3" fill="currentColor"/>`;
      svg += g + '</g>';
    }
    svg += '<path d="M0 -120 L120 0 L0 120 L-120 0 Z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle r="40" fill="none" stroke="currentColor" stroke-width="1.5"/>';
    svg += '</svg>';
    ring.innerHTML = svg;
    document.body.insertBefore(ring, canvas.nextSibling);
  })();
  const isMaya = () => document.documentElement.classList.contains('theme-maya');
  let flies = [];
  function spawnFly() {
    flies.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, ph: Math.random() * Math.PI * 2, rate: 0.6 + Math.random() * 1.2, r: 1.4 + Math.random() * 1.6 });
  }
  const isCN = () => document.documentElement.classList.contains('theme-cn');
  let lanterns = [];
  function spawnLantern(anywhere) {
    lanterns.push({
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 30,
      r: 3 + Math.random() * 4.5, vy: 9 + Math.random() * 14, sway: 6 + Math.random() * 14,
      ph: Math.random() * Math.PI * 2, fl: 2 + Math.random() * 3, a: 0.35 + Math.random() * 0.45,
    });
  }

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
    const cnStars = isCN();
    for (const s of stars) {
      if (!still) { s.x -= s.vx * dt; if (s.x < -4) { s.x = w + 4; s.y = Math.random() * h; } }
      const a = still ? s.a : s.a * (0.55 + 0.45 * Math.sin(s.ph + (t / 1000) * s.tw));
      ctx.beginPath();
      ctx.fillStyle = `rgba(${cnStars ? '255,226,180' : isMaya() ? '210,240,220' : s.c},${a.toFixed(3)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.1) {
        ctx.fillStyle = `rgba(${s.c},${(a * 0.12).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    const mayaNow = isMaya();
    if (mayaNow) {
      const want = Math.round((w * h) / 26000);
      while (flies.length < want) spawnFly();
      for (const f of flies) {
        if (!still) {
          f.vx += (Math.random() - 0.5) * 30 * dt; f.vy += (Math.random() - 0.5) * 30 * dt;
          f.vx = Math.max(-22, Math.min(22, f.vx)); f.vy = Math.max(-22, Math.min(22, f.vy));
          f.x = (f.x + f.vx * dt + w) % w; f.y = (f.y + f.vy * dt + h) % h;
        }
        const glow = still ? 0.6 : Math.max(0, Math.sin(f.ph + (t / 1000) * f.rate)) ** 3;
        if (glow < 0.02) continue;
        const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
        gr.addColorStop(0, `rgba(230,255,150,${(0.9 * glow).toFixed(3)})`);
        gr.addColorStop(0.3, `rgba(150,230,120,${(0.35 * glow).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(80,200,120,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 7, 0, Math.PI * 2); ctx.fill();
      }
    } else if (flies.length) flies = [];
    const cnNow = isCN();
    if (cnNow) {
      if (!lanterns.length) for (let k = 0; k < Math.round(w / 90); k++) spawnLantern(true);
      lanterns = lanterns.filter((l) => l.y > -40);
      while (!still && lanterns.length < Math.round(w / 90)) spawnLantern(false);
      for (const l of lanterns) {
        if (!still) l.y -= l.vy * dt;
        const x = l.x + Math.sin(l.ph + t / 1000 * 0.5) * l.sway;
        const flick = still ? 1 : 0.85 + 0.15 * Math.sin(l.ph + t / 1000 * l.fl);
        const gr = ctx.createRadialGradient(x, l.y, 0, x, l.y, l.r * 6);
        gr.addColorStop(0, `rgba(255,190,110,${(l.a * flick).toFixed(3)})`);
        gr.addColorStop(0.25, `rgba(255,110,60,${(l.a * 0.55 * flick).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(200,40,30,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, l.y, l.r * 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,214,150,${(0.9 * l.a * flick).toFixed(3)})`;
        ctx.beginPath(); ctx.ellipse(x, l.y, l.r * 0.75, l.r, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (lanterns.length) lanterns = [];
    if (!still) {
      if (!cnNow && !mayaNow && t > nextMeteor) { if (nextMeteor) spawnMeteor(); nextMeteor = t + 4000 + Math.random() * 9000; }
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
  window.addEventListener('skywheel-theme', () => { if (still) draw(0); });
  if (still) draw(0); else requestAnimationFrame(draw);
})();

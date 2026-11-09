// Background starfield: a few hundred stars with a slow twinkle (still when reduced motion is preferred).
(function () {
  const canvas = document.getElementById('stars');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [], w = 0, h = 0, dpr = 1;

  function seed() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((w * h) / 4200);
    stars = Array.from({ length: n }, () => {
      const warm = Math.random();
      return {
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() < 0.06 ? 1.1 + Math.random() * 0.9 : 0.3 + Math.random() * 0.7,
        a: 0.25 + Math.random() * 0.6,
        tw: 0.4 + Math.random() * 1.6, ph: Math.random() * Math.PI * 2,
        c: warm < 0.15 ? '244,220,156' : warm < 0.35 ? '190,170,255' : '235,232,255',
      };
    });
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
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
    if (!still) requestAnimationFrame(draw);
  }

  seed();
  window.addEventListener('resize', () => { seed(); if (still) draw(0); });
  if (still) draw(0); else requestAnimationFrame(draw);
})();

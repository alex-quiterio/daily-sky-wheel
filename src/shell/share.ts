// "Share image": the open tab as a picture. Title, date line, the tab's main drawing and, where there is one,
// the reading's summary, painted on a canvas in the tab's own colours and handed to the share sheet or saved.
import { $, one } from '#lib/dom.ts';

const WIDTH = 1080,
  PAD = 64,
  SCALE = 2; // drawn at twice the size, so it stays sharp on phones

// a CSS variable of the current theme
const themeValue = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// The drawing as an image. An SVG drawn into a canvas cannot see the page's stylesheet, so every var(--x) in it
// is replaced by its value first. Web fonts do not reach it either: its glyphs fall back to the system's.
async function drawingAsImage(svg: SVGSVGElement, size: number): Promise<HTMLImageElement> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const box = svg.viewBox.baseVal;
  const ratio = box && box.width ? box.height / box.width : 1;
  copy.setAttribute('width', String(size));
  copy.setAttribute('height', String(Math.round(size * ratio)));
  let xml = new XMLSerializer().serializeToString(copy);
  for (let pass = 0; pass < 2; pass++)
    xml = xml.replace(/var\((--[\w-]+)\)/g, (_, name: string) => themeValue(name).replace(/"/g, "'"));
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await image.decode();
  return image;
}

// break text into lines no wider than `width` in the context's current font
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

interface Block {
  font: string;
  color: string;
  lineHeight: number;
  lines: string[];
  gapAfter: number;
}

// Paint the card and return it as a JPEG: a tenth the size of a PNG for a picture full of gradients
async function render(): Promise<Blob> {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const panel = one('.main[role="tabpanel"]');
  const drawing = panel.querySelector<SVGSVGElement>('svg[role="img"]');
  const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const display = themeValue('--f-display'),
    body = themeValue('--f-body');
  const inner = WIDTH - PAD * 2;

  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) throw new Error('no canvas');
  const block = (font: string, color: string, size: number, content: string, gapAfter: number): Block => {
    measure.font = font;
    return {
      font,
      color,
      lineHeight: Math.round(size * 1.4),
      lines: content ? wrap(measure, content, inner) : [],
      gapAfter,
    };
  };

  const above: Block[] = [
    block(`600 22px ${display}`, themeValue('--gold'), 22, 'DAILY SKY WHEEL', 10),
    block(`600 58px ${display}`, themeValue('--gold-bright'), 50, text($('title')), 12),
    block(`italic 26px ${body}`, themeValue('--muted'), 26, text($('subtitle')), 8),
    block(`26px ${body}`, themeValue('--ink'), 26, [...$('big3').children].map(text).filter(Boolean).join('  ·  '), 28),
  ];
  const below: Block[] = [
    block(`30px ${body}`, themeValue('--ink'), 31, text(panel.querySelector('.rd-sum')), 20),
    block(
      `24px ${body}`,
      themeValue('--muted'),
      25,
      text(panel.querySelector('.rd-advice .good')).replace(/^Good for/, 'Good for: '),
      6,
    ),
    block(
      `24px ${body}`,
      themeValue('--muted'),
      25,
      text(panel.querySelector('.rd-advice .care')).replace(/^Go easy on/, 'Go easy on: '),
      20,
    ),
  ].filter((b) => b.lines.length);
  const foot = block(
    `20px ${body}`,
    themeValue('--muted'),
    20,
    `${location.host}${location.pathname}`.replace(/\/(index\.html)?$/, ''),
    0,
  );

  const picture = drawing ? await drawingAsImage(drawing, Math.min(inner, 860)) : null;
  const heightOf = (blocks: Block[]) => blocks.reduce((sum, b) => sum + b.lines.length * b.lineHeight + b.gapAfter, 0);
  const pictureHeight = picture ? picture.height + 36 : 0;
  const height = PAD + heightOf(above) + pictureHeight + heightOf(below) + heightOf([foot]) + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.scale(SCALE, SCALE);

  // the night sky of the current theme
  ctx.fillStyle = themeValue('--void');
  ctx.fillRect(0, 0, WIDTH, height);
  const glow = (x: number, y: number, radius: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, height);
    ctx.globalAlpha = 1;
  };
  glow(WIDTH * 0.12, height * 0.06, WIDTH * 0.8, themeValue('--nebula-1'));
  glow(WIDTH * 0.92, height * 0.3, WIDTH * 0.7, themeValue('--nebula-2'));
  glow(WIDTH * 0.5, height, WIDTH * 0.8, themeValue('--nebula-3'));
  ctx.strokeStyle = themeValue('--gold');
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, WIDTH - 44, height - 44);
  ctx.globalAlpha = 1;

  ctx.textBaseline = 'top';
  let y = PAD;
  const paint = (b: Block) => {
    ctx.font = b.font;
    ctx.fillStyle = b.color;
    for (const line of b.lines) {
      ctx.fillText(line, PAD, y);
      y += b.lineHeight;
    }
    y += b.gapAfter;
  };
  above.forEach(paint);
  if (picture) {
    ctx.drawImage(picture, (WIDTH - picture.width) / 2, y, picture.width, picture.height);
    y += pictureHeight;
  }
  below.forEach(paint);
  paint(foot);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('the image could not be made'))),
      'image/jpeg',
      0.9,
    ),
  );
}

// Share the picture where the device can, save it where it cannot. Says which happened.
// `date` and `view` name the file; `link` goes along with a shared image
export async function shareImage({
  date,
  view,
  link: linkOf,
}: {
  date: string;
  view: string;
  link: () => string;
}): Promise<'shared' | 'saved' | 'cancelled'> {
  const blob = await render();
  const file = new File([blob], `sky-wheel-${date}-${view}.jpg`, {
    type: 'image/jpeg',
  });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: $('title').textContent ?? 'Daily Sky Wheel', text: linkOf() });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // sharing was refused: fall through and save it instead
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  return 'saved';
}

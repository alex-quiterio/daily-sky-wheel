// The page header: emblem, title, date line and the three lines on the right.
import type { HeaderInfo } from '#lib/types.ts';

export function Header({ info, subtitle }: { info: HeaderInfo; subtitle: string }) {
  return (
    <header class="top">
      <div class="brand">
        <div class="seal" id="seal" aria-hidden="true">
          <span id="sealChar">{info.seal ?? '午'}</span>
        </div>
        <div class="emblem" id="emblem" aria-hidden="true" title={info.emblem?.title}>
          <span id="emblemNum">{info.emblem?.mark}</span>
        </div>
        <div class="kb-emblem" id="kbEmblem" aria-hidden="true">
          <span id="kbEmblemLetter">{info.letter ?? 'נ'}</span>
        </div>
        <div class="vd-emblem" aria-hidden="true">
          <span>ॐ</span>
        </div>
        <div class="is-emblem" aria-hidden="true">
          <span id="isEmblemDay">{info.day ?? '١'}</span>
        </div>
        <svg class="logo" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="pgold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#f7e3a8" />
              <stop offset="0.5" stop-color="#d8b46a" />
              <stop offset="1" stop-color="#a58bff" />
            </linearGradient>
            <radialGradient id="pcore" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stop-color="#2a1460" stop-opacity="0.9" />
              <stop offset="1" stop-color="#07061a" stop-opacity="0" />
            </radialGradient>
            <mask id="pmoon">
              <rect width="120" height="120" fill="#fff" />
              <circle cx="67" cy="54" r="24" fill="#000" />
            </mask>
            <filter id="pglow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="60" cy="60" r="44" fill="url(#pcore)" />
          <g class="logo-ring" fill="none" stroke="url(#pgold)">
            <circle cx="60" cy="60" r="56" stroke-width="1.3" />
            <circle cx="60" cy="60" r="50" stroke-width="0.6" stroke-opacity="0.7" />
            <circle
              cx="60"
              cy="60"
              r="53"
              stroke-width="1.6"
              stroke-dasharray="0.1 5.45"
              stroke-linecap="round"
              stroke-opacity="0.9"
            />
            <g stroke-width="1.2">
              <line x1="110.00" y1="60.00" x2="116.00" y2="60.00" />
              <line x1="103.30" y1="85.00" x2="108.50" y2="88.00" />
              <line x1="85.00" y1="103.30" x2="88.00" y2="108.50" />
              <line x1="60.00" y1="110.00" x2="60.00" y2="116.00" />
              <line x1="35.00" y1="103.30" x2="32.00" y2="108.50" />
              <line x1="16.70" y1="85.00" x2="11.50" y2="88.00" />
              <line x1="10.00" y1="60.00" x2="4.00" y2="60.00" />
              <line x1="16.70" y1="35.00" x2="11.50" y2="32.00" />
              <line x1="35.00" y1="16.70" x2="32.00" y2="11.50" />
              <line x1="60.00" y1="10.00" x2="60.00" y2="4.00" />
              <line x1="85.00" y1="16.70" x2="88.00" y2="11.50" />
              <line x1="103.30" y1="35.00" x2="108.50" y2="32.00" />
            </g>
          </g>
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="#a58bff"
            stroke-width="0.6"
            stroke-opacity="0.55"
            stroke-dasharray="2 3"
          />
          <circle cx="54" cy="61" r="29" fill="url(#pgold)" mask="url(#pmoon)" filter="url(#pglow)" />
          <g class="logo-star" filter="url(#pglow)">
            <path
              d="M70.00,40.00 L70.99,50.60 L75.06,47.94 L72.40,52.01 L83.00,53.00 L72.40,53.99 L75.06,58.06 L70.99,55.40 L70.00,66.00 L69.01,55.40 L64.94,58.06 L67.60,53.99 L57.00,53.00 L67.60,52.01 L64.94,47.94 L69.01,50.60Z"
              fill="#fbefc9"
            />
          </g>
          <g fill="#ede7ff" opacity="0.8">
            <circle cx="36" cy="34" r="0.9" />
            <circle cx="88" cy="86" r="0.8" />
            <circle cx="30" cy="78" r="0.6" />
            <circle cx="84" cy="36" r="0.7" />
            <circle cx="46" cy="92" r="0.5" />
          </g>
        </svg>
        <div class="brand-text">
          <div class="eyebrow">Daily Sky Wheel</div>
          <h1 id="title">{info.title}</h1>
          <div class="sub" id="subtitle">
            {subtitle}
          </div>
        </div>
      </div>
      <div class="big3" id="big3">
        {info.big3}
      </div>
    </header>
  );
}

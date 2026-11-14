import { svg, type TemplateResult } from 'lit';
import type { MachineType } from '../types';

const glyph = (inner: TemplateResult): TemplateResult =>
  svg`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;

/** Full machine glyph. `.spin` groups are animated by the tile while busy. */
export function machineIcon(type: MachineType): TemplateResult {
  if (type === 'mangle') {
    return svg`<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="9" width="40" height="27" rx="7"/>
        <path d="M10 36v5M38 36v5"/>
        <circle cx="17" cy="22.5" r="7.5"/>
        <circle cx="31" cy="22.5" r="7.5"/>
        <g class="spin" style="transform-origin:17px 22.5px"><path d="M17 17.5v10M12 22.5h10" stroke-width="1.6" opacity=".75"/></g>
        <g class="spin rev" style="transform-origin:31px 22.5px"><path d="M31 17.5v10M26 22.5h10" stroke-width="1.6" opacity=".75"/></g>
      </g>
    </svg>`;
  }
  const drum =
    type === 'dryer'
      ? svg`<g class="spin" style="transform-origin:24px 29px"><circle cx="24" cy="29" r="7.5" stroke-width="1.6" stroke-dasharray="3.5 3.2" opacity=".6"/></g>
        <path class="flame" fill="currentColor" stroke="none" d="M24 21.5c.9 2.8 4 4.3 4 7.7a4 4 0 0 1-8 0c0-1.3.7-2.5 1.5-3.4.3 1.2.9 1.8 1.7 2.1-.4-2.3.2-4.4.8-6.4z"/>`
      : svg`<g class="spin" style="transform-origin:24px 29px">
          <path d="M16.5 29c2.5-3 5-3 7.5 0s5 3 7.5 0"/>
          <circle cx="28" cy="24.5" r="1.6" fill="currentColor" stroke="none"/>
        </g>`;
  return svg`<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="7" y="4" width="34" height="40" rx="7"/>
      <path d="M7 13h34"/>
      <circle cx="13" cy="8.5" r=".9" fill="currentColor" stroke="none"/>
      <circle cx="18" cy="8.5" r=".9" fill="currentColor" stroke="none"/>
      <circle cx="24" cy="29" r="11"/>
      ${drum}
    </g>
  </svg>`;
}

/** Small glyph used for section labels and rings. */
export function typeGlyph(type: MachineType): TemplateResult {
  switch (type) {
    case 'washer':
      return glyph(svg`<path d="M12 3.5c3.3 4 5.5 6.7 5.5 9.7a5.5 5.5 0 0 1-11 0c0-3 2.2-5.7 5.5-9.7z"/>`);
    case 'dryer':
      return glyph(svg`<path d="M12 3c.8 3.2 5.5 5.3 5.5 10.2a5.5 5.5 0 0 1-11 0c0-1.8.9-3.3 2-4.5.4 1.6 1.2 2.4 2.2 2.8C10 9.4 10.8 6.2 12 3z"/>`);
    case 'mangle':
      return glyph(svg`<rect x="3" y="6" width="18" height="12" rx="4"/><circle cx="9" cy="12" r="3"/><circle cx="15" cy="12" r="3"/>`);
    default:
      return glyph(svg`<rect x="5" y="3" width="14" height="18" rx="3.5"/><circle cx="12" cy="13" r="4"/>`);
  }
}

export const bubbleIcon = glyph(
  svg`<circle cx="9" cy="14" r="5.5"/><circle cx="17" cy="8" r="3.5"/><circle cx="17.5" cy="17.5" r="2"/><path d="M6.8 12.3a3 3 0 0 1 2.2-1.1" opacity=".7"/>`,
);
export const warningIcon = glyph(svg`<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>`);
export const checkIcon = glyph(svg`<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.8 2.8 5.4-5.6"/>`);
export const houseIcon = glyph(svg`<path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>`);
export const bankIcon = glyph(svg`<path d="M3.5 9.5 12 4l8.5 5.5z"/><path d="M6 12v6M10 12v6M14 12v6M18 12v6M4 20.5h16"/>`);
export const clockIcon = glyph(svg`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`);
export const starIcon = glyph(svg`<path d="m12 3.5 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>`);
export const thermoIcon = glyph(svg`<path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/>`);
export const coinIcon = glyph(svg`<circle cx="12" cy="12" r="9"/><path d="M9 9.5c.5-1 1.6-1.5 3-1.5 1.8 0 3 .8 3 2s-1.2 1.7-3 2-3 .8-3 2 1.2 2 3 2c1.4 0 2.5-.5 3-1.5"/>`);
export const infoIcon = glyph(svg`<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>`);

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Translate } from '../localize';
import { type Fmt, weekdayNames } from '../logic/format';
import { analyseHeatmap, heatIntensity, heatmapMax, normalizeHeatmap } from '../logic/heatmap';
import { base, reducedMotion, tokens } from './styles';

@customElement('ev-heatmap')
export class EvHeatmap extends LitElement {
  @property({ attribute: false }) t!: Translate;
  @property({ attribute: false }) fmt!: Fmt;
  @property({ attribute: false }) matrix: number[][] = [];
  @state() private hover: { d: number; h: number } | null = null;

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      .insight {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        font-size: 0.92rem;
        font-weight: 550;
        line-height: 1.35;
      }
      .insight::before {
        content: '';
        flex: none;
        width: 4px;
        align-self: stretch;
        border-radius: 4px;
        background: var(--primary-color, var(--ev-washer));
      }
      .insight em {
        font-style: normal;
        color: var(--primary-color, var(--ev-washer));
      }
      .map {
        display: grid;
        grid-template-columns: auto repeat(24, minmax(0, 1fr));
        gap: 3px;
        align-items: center;
      }
      .dow {
        font-size: 0.68rem;
        color: var(--ev-text-2);
        padding-right: 6px;
        text-transform: capitalize;
        white-space: nowrap;
      }
      .cell {
        position: relative;
        aspect-ratio: 1;
        min-width: 0;
        border-radius: 25%;
        background: color-mix(in srgb, var(--ev-text) 6%, transparent);
        overflow: hidden;
        cursor: default;
      }
      .cell i {
        position: absolute;
        inset: 0;
        background: var(--primary-color, var(--ev-washer));
        opacity: var(--o);
        animation: fade 0.6s ease both;
        animation-delay: calc(var(--c) * 12ms);
      }
      .cell.top {
        outline: 1.5px solid color-mix(in srgb, var(--primary-color, var(--ev-washer)) 60%, var(--ev-text));
        outline-offset: -1.5px;
      }
      .cell.hov {
        outline: 1.5px solid var(--ev-text);
        outline-offset: -1.5px;
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
      }
      .hl {
        grid-column: span 3;
        margin-top: 2px;
        font-size: 0.64rem;
        color: var(--ev-text-2);
        font-variant-numeric: tabular-nums;
        line-height: 1;
      }
      .foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
        font-size: 0.72rem;
        color: var(--ev-text-2);
        min-height: 1.3em;
      }
      .legend {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .legend i {
        width: 12px;
        height: 12px;
        border-radius: 4px;
        background: var(--primary-color, var(--ev-washer));
        opacity: var(--o);
      }
      .legend i.zero {
        background: color-mix(in srgb, var(--ev-text) 10%, transparent);
        opacity: 1;
      }
      .legend span {
        margin: 0 4px;
      }
    `,
  ];

  private insightText(matrix: number[][]) {
    const t = this.t;
    const found = analyseHeatmap(matrix);
    if (!found) return t('insightNone');
    const day = weekdayNames(this.fmt, 'long')[found.weekday];
    const text = t('insight', { day: '\u0000', from: found.startHour, to: found.endHour });
    const [a, b] = text.split('\u0000');
    return html`${a}<em>${day}</em>${b}`;
  }

  render() {
    const matrix = normalizeHeatmap(this.matrix);
    const max = heatmapMax(matrix);
    const days = weekdayNames(this.fmt, 'short');
    const top = analyseHeatmap(matrix);
    const t = this.t;
    const hov = this.hover;
    const levels = [0.18, 0.4, 0.62, 0.82, 1];
    return html`
      <section class="panel" aria-label="${t('heatmap')}">
        <div class="panel-head"><span class="label">${t('heatmap')}</span></div>
        <div class="insight">${this.insightText(matrix)}</div>
        <div class="map" role="img" aria-label="${t('heatmap')}">
          ${matrix.map(
            (row, d) => html`<span class="dow">${days[d]}</span>${row.map((v, h) => {
              const isTop = top && top.weekday === d && h >= top.startHour && h < top.endHour;
              const on = hov && hov.d === d && hov.h === h;
              return html`<div class="cell ${isTop ? 'top' : ''} ${on ? 'hov' : ''}"
                title="${days[d]} ${String(h).padStart(2, '0')}:00 · ${t('uses_n', { n: v })}"
                @pointerenter=${() => (this.hover = { d, h })}
                @pointerleave=${() => (this.hover = null)}>
                ${v > 0 ? html`<i style="--o:${heatIntensity(v, max).toFixed(3)};--c:${(d * 3 + h) % 24}"></i>` : nothing}
              </div>`;
            })}`,
          )}
          <span></span>${[0, 3, 6, 9, 12, 15, 18, 21].map((h) => html`<span class="hl" aria-hidden="true">${String(h).padStart(2, '0')}</span>`)}
        </div>
        <div class="foot">
          <span>${hov ? `${days[hov.d]} ${String(hov.h).padStart(2, '0')}–${String((hov.h + 1) % 24).padStart(2, '0')} · ${t('uses_n', { n: matrix[hov.d][hov.h] })}` : ''}</span>
          <span class="legend">${t('less')}<span></span><i class="zero"></i>${levels.map((l) => html`<i style="--o:${l}"></i>`)}<span></span>${t('more')}</span>
        </div>
      </section>
    `;
  }
}

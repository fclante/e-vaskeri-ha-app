import { LitElement, html, css, nothing, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { AccountOverview } from '../types';
import { type Translate, makeTranslate } from '../localize';
import { type Fmt, formatMoney, formatMonthLong, formatMonthShort, formatNumber, formatPercent } from '../logic/format';
import { barChart, donutSegments, topTemperature } from '../logic/charts';
import { localizeUnitLabel } from '../logic/machines';
import { base, reducedMotion, tokens } from './styles';
import { coinIcon, starIcon, thermoIcon, typeGlyph } from './icons';

const CHART_H = 176;
const DR = 38;
const DC = 2 * Math.PI * DR;

@customElement('ev-spend')
export class EvSpend extends LitElement {
  @property({ attribute: false }) t: Translate = makeTranslate('en');
  @property({ attribute: false }) fmt!: Fmt;
  @property({ attribute: false }) account!: AccountOverview;
  @state() private width = 320;
  @state() private active: number | null = null;
  private observer?: ResizeObserver;

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      .body {
        display: flex;
        flex-wrap: wrap;
        gap: 18px 24px;
        align-items: center;
      }
      .chart {
        position: relative;
        flex: 1 1 280px;
        min-width: 0;
      }
      .chart svg {
        width: 100%;
        height: ${CHART_H}px;
        overflow: visible;
        touch-action: manipulation;
      }
      .grid-line {
        stroke: color-mix(in srgb, var(--ev-line) 70%, transparent);
        stroke-dasharray: 3 4;
      }
      .axis {
        font-size: 10px;
        fill: var(--ev-text-2);
        paint-order: stroke;
        stroke: var(--card-background-color, #fff);
        stroke-width: 3px;
        stroke-linejoin: round;
        font-variant-numeric: tabular-nums;
      }
      .mlabel {
        font-size: 10.5px;
        fill: var(--ev-text-2);
        text-anchor: middle;
        text-transform: capitalize;
      }
      .mlabel.cur {
        fill: var(--ev-text);
        font-weight: 650;
      }
      .bar {
        transform-box: fill-box;
        transform-origin: 50% 100%;
        animation: grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        animation-delay: calc(var(--i) * 35ms);
        transition: opacity 0.2s;
      }
      .washer {
        fill: var(--ev-washer);
      }
      .dryer {
        fill: var(--ev-dryer);
      }
      .dim .bar:not(.on) {
        opacity: 0.45;
      }
      .hit {
        fill: transparent;
        cursor: pointer;
      }
      .sel {
        fill: color-mix(in srgb, var(--ev-text) 6%, transparent);
      }
      @keyframes grow {
        from {
          transform: scaleY(0);
          opacity: 0;
        }
      }
      .tip {
        position: absolute;
        top: 0;
        z-index: 2;
        transform: translate(-50%, -4px);
        pointer-events: none;
        padding: 8px 11px;
        border-radius: 12px;
        font-size: 0.76rem;
        line-height: 1.45;
        white-space: nowrap;
        color: var(--ev-text);
        background: var(--card-background-color, #fff);
        border: 1px solid var(--ev-line);
        box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.35);
      }
      .tip .m {
        font-weight: 650;
        text-transform: capitalize;
        margin-bottom: 2px;
      }
      .tip .r {
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: space-between;
        font-variant-numeric: tabular-nums;
      }
      .tip i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
      }
      .tip .r span:first-child {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ev-text-2);
        margin-right: 12px;
      }
      .tip .tot {
        margin-top: 2px;
        padding-top: 3px;
        border-top: 1px solid var(--ev-line);
        font-weight: 650;
      }
      .donut {
        flex: 0 1 200px;
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 0 auto;
      }
      .donut .ring {
        position: relative;
        width: 124px;
        height: 124px;
        flex: none;
      }
      .donut svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }
      .seg {
        fill: none;
        stroke-width: 12;
        stroke-linecap: butt;
        animation: seg-in 1s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .seg.washer {
        stroke: var(--ev-washer);
      }
      .seg.dryer {
        stroke: var(--ev-dryer);
      }
      @keyframes seg-in {
        from {
          stroke-dasharray: 0 ${DC};
        }
      }
      .donut .mid {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        text-align: center;
        line-height: 1.15;
      }
      .mid b {
        font-size: 0.84rem;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .mid span {
        font-size: 0.68rem;
        color: var(--ev-text-2);
      }
      .legend {
        display: grid;
        gap: 10px;
        font-size: 0.8rem;
        min-width: 0;
      }
      .legend .k {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--ev-text-2);
      }
      .legend .k svg {
        width: 14px;
        height: 14px;
      }
      .legend .washer-c {
        color: var(--ev-washer);
      }
      .legend .dryer-c {
        color: var(--ev-dryer);
      }
      .legend b {
        display: block;
        font-weight: 650;
        font-size: 0.9rem;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
        margin-top: 16px;
      }
      .kpi {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: var(--ev-radius-sm);
        background: var(--ev-surface);
        border: 1px solid color-mix(in srgb, var(--ev-line) 55%, transparent);
        min-width: 0;
      }
      .kpi .ic {
        flex: none;
        width: 30px;
        height: 30px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        color: var(--tint, var(--ev-text-2));
        background: color-mix(in srgb, var(--tint, var(--ev-text-2)) 14%, transparent);
      }
      .kpi .ic svg {
        width: 17px;
        height: 17px;
      }
      .kpi .v {
        font-size: 0.95rem;
        font-weight: 650;
        line-height: 1.2;
        font-variant-numeric: tabular-nums;
        overflow-wrap: break-word;
      }
      .kpi .l {
        font-size: 0.7rem;
        color: var(--ev-text-2);
        line-height: 1.25;
      }
      .kpi > div:last-child {
        min-width: 0;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver((entries) => {
        const w = Math.round(entries[0]?.contentRect.width ?? 0);
        if (w > 0 && Math.abs(w - this.width) > 1) this.width = w;
      });
      this.observer.observe(this);
    }
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    super.disconnectedCallback();
  }

  private chartWidth(): number {
    // The chart takes the full width when the donut wraps below, otherwise roughly 55%.
    const inner = Math.max(220, this.width - 34);
    return inner >= 560 ? Math.round(inner - 224 - 24) : inner;
  }

  private select(i: number | null, ev?: PointerEvent) {
    if (ev && ev.type === 'pointerleave' && ev.pointerType !== 'mouse') return;
    this.active = i;
  }

  private chart() {
    const months = this.account.stats?.months ?? [];
    if (!months.length) return nothing;
    const w = this.chartWidth();
    const { bars, gridLines, baseline } = barChart(months, w, CHART_H);
    const t = this.t;
    const fmt = this.fmt;
    const slot = bars.length ? w / bars.length : w;
    const everyOther = slot < 30;
    const act = this.active != null ? bars[this.active] : null;
    const tipX = act ? Math.min(Math.max(act.x + act.width / 2, 70), w - 70) : 0;
    return html`
      <div class="chart" style="max-width:${w}px;flex-basis:${w}px">
        <svg viewBox="0 0 ${w} ${CHART_H}" role="img" aria-label="${t('spend')} · ${t('last12')}"
          class="${act ? 'dim' : ''}" @pointerleave=${(e: PointerEvent) => this.select(null, e)}>
          ${gridLines.map((g) => svg`<line class="grid-line" x1="0" x2="${w}" y1="${g.y}" y2="${g.y}"/>`)}
          ${bars.map((b, i) => {
            const cur = i === bars.length - 1;
            const showLabel = !everyOther || (bars.length - 1 - i) % 2 === 0;
            return svg`
              ${this.active === i ? svg`<rect class="sel" x="${i * slot}" y="0" width="${slot}" height="${baseline}" rx="8"/>` : nothing}
              <g class="bar ${this.active === i ? 'on' : ''}" style="--i:${i}">
                ${b.dryerH > 0.5 ? svg`<rect class="dryer" x="${b.x}" y="${b.dryerY}" width="${b.width}" height="${b.dryerH + 5}" rx="4"/>` : nothing}
                ${b.washerH > 0.5 ? svg`<rect class="washer" x="${b.x}" y="${b.washerY}" width="${b.width}" height="${b.washerH}" rx="4"/>` : nothing}
              </g>
              ${showLabel ? svg`<text class="mlabel ${cur ? 'cur' : ''}" x="${i * slot + slot / 2}" y="${CHART_H - 5}">${formatMonthShort(fmt, b.month)}</text>` : nothing}
              <rect class="hit" x="${i * slot}" y="0" width="${slot}" height="${CHART_H}"
                @pointerenter=${(e: PointerEvent) => e.pointerType === 'mouse' && this.select(i)}
                @click=${() => this.select(this.active === i ? null : i)}/>`;
          })}
          ${gridLines.map((g) => svg`<text class="axis" x="0" y="${g.y - 4}">${formatNumber(fmt, g.value, 0)} kr</text>`)}
        </svg>
        ${act
          ? html`<div class="tip" style="left:${tipX}px" role="status">
              <div class="m">${formatMonthLong(fmt, act.month)}</div>
              <div class="r"><span><i style="background:var(--ev-washer)"></i>${t('washing')}</span><span>${formatMoney(fmt, act.stat.washer_dkk, 'never')}</span></div>
              <div class="r"><span><i style="background:var(--ev-dryer)"></i>${t('drying')}</span><span>${formatMoney(fmt, act.stat.dryer_dkk, 'never')}</span></div>
              <div class="r tot"><span>${t('total')}</span><span>${formatMoney(fmt, act.stat.total_dkk, 'never')}</span></div>
            </div>`
          : nothing}
      </div>
    `;
  }

  private donut() {
    const totals = this.account.stats?.totals;
    if (!totals) return nothing;
    const { t, fmt } = this;
    const segs = donutSegments(totals.washer_dkk, totals.dryer_dkk, DC);
    const sum = totals.washer_dkk + totals.dryer_dkk;
    if (!segs.length) return nothing;
    return html`
      <div class="donut">
        <div class="ring" role="img" aria-label="${t('washing')} ${formatPercent(fmt, totals.washer_dkk / sum)}, ${t('drying')} ${formatPercent(fmt, totals.dryer_dkk / sum)}">
          ${svg`<svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="${DR}" fill="none" stroke="var(--ev-line)" stroke-width="12" opacity=".35"/>
            ${segs.map((s) => svg`<circle class="seg ${s.key}" cx="50" cy="50" r="${DR}" stroke-dasharray="${s.dash} ${DC}" stroke-dashoffset="${s.offset}"/>`)}
          </svg>`}
          <div class="mid"><b>${formatMoney(fmt, sum, 'never', 0)}</b><span>${t('total')}</span></div>
        </div>
        <div class="legend">
          <div><span class="k washer-c">${typeGlyph('washer')}<span style="color:var(--ev-text-2)">${t('washing')}</span></span><b>${formatPercent(fmt, totals.washer_dkk / sum)}</b></div>
          <div><span class="k dryer-c">${typeGlyph('dryer')}<span style="color:var(--ev-text-2)">${t('drying')}</span></span><b>${formatPercent(fmt, totals.dryer_dkk / sum)}</b></div>
        </div>
      </div>
    `;
  }

  private kpis() {
    const s = this.account.stats;
    if (!s) return nothing;
    const { t, fmt } = this;
    const temp = topTemperature(s.top_temperatures);
    const items: { icon: unknown; tint: string; value: string; label: string }[] = [];
    if (s.avg_cost_per_wash_dkk != null)
      items.push({ icon: typeGlyph('washer'), tint: 'var(--ev-washer)', value: formatMoney(fmt, s.avg_cost_per_wash_dkk), label: t('avgWash') });
    if (s.avg_cost_per_dry_dkk != null)
      items.push({ icon: typeGlyph('dryer'), tint: 'var(--ev-dryer)', value: formatMoney(fmt, s.avg_cost_per_dry_dkk), label: t('avgDry') });
    if (s.totals) {
      items.push({ icon: coinIcon, tint: 'var(--ev-washer)', value: formatNumber(fmt, s.totals.washes, 0), label: t('washes') });
      items.push({ icon: coinIcon, tint: 'var(--ev-dryer)', value: formatNumber(fmt, s.totals.dries, 0), label: t('dries') });
    }
    if (s.favourite_machine)
      items.push({
        icon: starIcon,
        tint: 'var(--ev-done)',
        value: localizeUnitLabel(t, s.favourite_machine.name),
        label: `${t('favourite')} · ${t('uses', { n: s.favourite_machine.count })}`,
      });
    if (temp != null) items.push({ icon: thermoIcon, tint: 'var(--ev-error)', value: `${temp}°C`, label: t('topTemp') });
    return html`<div class="kpis">${items.map(
      (i) => html`<div class="kpi" style="--tint:${i.tint}"><div class="ic">${i.icon}</div><div><div class="v">${i.value}</div><div class="l">${i.label}</div></div></div>`,
    )}</div>`;
  }

  render() {
    if (!this.account?.stats) return nothing;
    return html`
      <section class="panel" aria-label="${this.t('spend')}">
        <div class="panel-head"><span class="label">${this.t('spend')}</span><span class="sub">${this.t('last12')}</span></div>
        <div class="body">${this.chart()}${this.donut()}</div>
        ${this.kpis()}
      </section>
    `;
  }
}

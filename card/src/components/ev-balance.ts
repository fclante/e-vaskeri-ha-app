import { LitElement, html, css, nothing, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { AccountOverview } from '../types';
import type { Translate } from '../localize';
import { type Fmt, formatMoney, formatShortDate, formatMonthShort } from '../logic/format';
import { sparkline } from '../logic/charts';
import { base, reducedMotion, tokens } from './styles';
import { bankIcon, houseIcon } from './icons';

const W = 160;
const H = 56;

@customElement('ev-balance')
export class EvBalance extends LitElement {
  @property({ attribute: false }) t!: Translate;
  @property({ attribute: false }) fmt!: Fmt;
  @property({ attribute: false }) account!: AccountOverview;

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      .top {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .amount {
        font-size: 2.2rem;
        font-size: clamp(1.9rem, 9cqi, 2.6rem);
        font-weight: 700;
        letter-spacing: -0.03em;
        line-height: 1.05;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .amount.pos {
        color: var(--ev-free);
      }
      .caption {
        margin-top: 4px;
        font-size: 0.85rem;
        color: var(--ev-text-2);
      }
      .delta {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 10px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        background: var(--ev-surface-2);
        color: var(--ev-text-2);
        font-variant-numeric: tabular-nums;
      }
      .delta.up {
        color: var(--ev-free);
        background: color-mix(in srgb, var(--ev-free) 14%, transparent);
      }
      .delta small {
        font-weight: 500;
        opacity: 0.85;
      }
      .spark {
        flex: 1 1 140px;
        max-width: 240px;
        min-width: 120px;
        margin-left: auto;
      }
      .spark svg {
        width: 100%;
        height: 64px;
        overflow: visible;
      }
      .spark .cap {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        color: var(--ev-text-2);
        margin-top: 4px;
      }
      .spark .line {
        fill: none;
        stroke: var(--primary-color, var(--ev-washer));
        stroke-width: 2.4;
        stroke-linecap: round;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
        stroke-dasharray: 600;
        stroke-dashoffset: 0;
        animation: draw 1.4s ease-out both;
      }
      .spark circle {
        fill: var(--card-background-color, #fff);
        stroke: var(--primary-color, var(--ev-washer));
        stroke-width: 2.4;
      }
      @keyframes draw {
        from {
          stroke-dashoffset: 600;
        }
      }
      .payment {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px dashed color-mix(in srgb, var(--ev-line) 80%, transparent);
        font-size: 0.82rem;
        color: var(--ev-text-2);
        min-width: 0;
      }
      .payment svg {
        width: 18px;
        height: 18px;
        flex: none;
        color: var(--ev-free);
      }
      .payment .txt {
        min-width: 0;
        line-height: 1.4;
      }
      .payment b {
        color: var(--ev-text);
        font-weight: 600;
      }
    `,
  ];

  private sparkline() {
    const months = this.account.stats?.months.slice(-12) ?? [];
    if (months.length < 2) return nothing;
    const s = sparkline(months.map((m) => m.total_dkk), W, H);
    const first = months[0].month;
    const last = months[months.length - 1].month;
    const short = (m: string) => formatMonthShort(this.fmt, m);
    return html`
      <div class="spark" role="img" aria-label="${this.t('monthlySpend')}">
        ${svg`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
          <defs><linearGradient id="ev-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--primary-color, #3b8cff)" stop-opacity=".28"/>
            <stop offset="1" stop-color="var(--primary-color, #3b8cff)" stop-opacity="0"/>
          </linearGradient></defs>
          <path class="area" d="${s.area}" fill="url(#ev-spark-fill)"/>
          <path class="line" d="${s.line}"/>
        </svg>`}
        <div class="cap"><span>${short(first)}</span><span>${this.t('monthlySpend')}</span><span>${short(last)}</span></div>
      </div>
    `;
  }

  render() {
    const { t, fmt, account } = this;
    const balance = account.balance ?? 0;
    const rounded = Math.round(balance * 100) / 100;
    const caption = rounded < 0 ? t('owed') : rounded > 0 ? t('credit') : t('settled');
    const delta = account.previousPeriod != null ? Math.round((balance - account.previousPeriod) * 100) / 100 : null;
    const lp = account.lastPayment;
    const rent = lp?.description ? /husleje|rent/i.test(lp.description) : false;
    return html`
      <section class="panel" aria-label="${t('balance')}">
        <div class="panel-head"><span class="label">${t('balance')}</span></div>
        <div class="top">
          <div>
            <div class="amount ${rounded > 0 ? 'pos' : ''}">${formatMoney(fmt, balance)}</div>
            <div class="caption">${caption}</div>
            ${delta != null && delta !== 0
              ? html`<div class="delta ${delta > 0 ? 'up' : ''}">
                  <span aria-hidden="true">${delta > 0 ? '▲' : '▼'}</span>
                  ${formatMoney(fmt, delta, 'never')} <small>${t('vsPrevious')}</small>
                </div>`
              : nothing}
          </div>
          ${this.sparkline()}
        </div>
        ${lp
          ? html`<div class="payment" title="${lp.description ?? ''}">
              ${rent ? houseIcon : bankIcon}
              <span class="txt">${t('lastPayment')} <b>${formatShortDate(fmt, lp.date)}</b> · <b>${formatMoney(fmt, lp.amount_dkk, 'never')}</b>${lp.description ? html` · ${lp.description}` : nothing}</span>
            </div>`
          : nothing}
      </section>
    `;
  }
}

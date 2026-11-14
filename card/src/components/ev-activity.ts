import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { MachineType, StatementEntry } from '../types';
import type { Translate } from '../localize';
import { type Fmt, formatMoney, formatShortDate } from '../logic/format';
import { base, reducedMotion, tokens } from './styles';
import { bankIcon, houseIcon, typeGlyph } from './icons';

const MAX_ENTRIES = 8;

@customElement('ev-activity')
export class EvActivity extends LitElement {
  @property({ attribute: false }) t!: Translate;
  @property({ attribute: false }) fmt!: Fmt;
  @property({ attribute: false }) entries: StatementEntry[] = [];

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      ol {
        list-style: none;
        margin: 0;
        padding: 0;
        position: relative;
      }
      li {
        position: relative;
        display: grid;
        grid-template-columns: 34px 1fr auto;
        align-items: center;
        gap: 12px;
        padding: 7px 0;
      }
      li:not(:last-child)::before {
        content: '';
        position: absolute;
        left: 16.5px;
        top: 41px;
        bottom: -7px;
        width: 1px;
        background: var(--ev-line);
        opacity: 0.8;
      }
      .ic {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--accent);
        background: color-mix(in srgb, var(--accent) 15%, var(--card-background-color, transparent));
        border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
        position: relative;
        z-index: 1;
      }
      .ic svg {
        width: 18px;
        height: 18px;
      }
      .pay {
        --accent: var(--ev-free);
      }
      .main {
        min-width: 0;
      }
      .title {
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.3;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        column-gap: 8px;
      }
      .title .det {
        font-weight: 450;
        font-size: 0.82rem;
        color: var(--ev-text-2);
        white-space: nowrap;
      }
      .meta {
        font-size: 0.75rem;
        color: var(--ev-text-2);
        margin-top: 2px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
      }
      .amt {
        text-align: right;
        font-size: 0.92rem;
        font-weight: 650;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .amt.plus {
        color: var(--ev-free);
      }
      .empty {
        font-size: 0.85rem;
        color: var(--ev-text-2);
      }
    `,
  ];

  private row(e: StatementEntry) {
    const { t, fmt } = this;
    const isPayment = e.kind === 'payment' || e.amount_dkk < 0;
    const type: MachineType = e.unit_type === 'dryer' ? 'dryer' : e.unit_type === 'mangle' ? 'mangle' : 'washer';
    const rent = !!e.description && /husleje|rent/i.test(e.description);
    const title = isPayment
      ? t('payment')
      : e.unit_id != null && e.unit_type
        ? `${t(`type_${type}`)} ${e.unit_id}`
        : e.unit_label ?? t('type_other');
    const details: string[] = [];
    if (isPayment) {
      if (e.description) details.push(e.description);
    } else {
      if (e.temperature_c != null) details.push(`${e.temperature_c}°C`);
      if (e.duration_min != null) details.push(t('min', { n: e.duration_min }));
      if (e.program != null && e.program !== '' && (type === 'washer' || e.duration_min == null)) {
        details.push(t('program', { n: e.program }));
      }
    }
    const when = [formatShortDate(fmt, e.date), e.time].filter(Boolean).join(' ');
    const amount = isPayment ? formatMoney(fmt, Math.abs(e.amount_dkk), 'always') : formatMoney(fmt, -Math.abs(e.amount_dkk));
    return html`
      <li title="${e.description ?? ''}" class="${isPayment ? 'pay' : `t-${type}`}">
        <span class="ic">${isPayment ? (rent ? houseIcon : bankIcon) : typeGlyph(type)}</span>
        <div class="main">
          <div class="title"><span>${title}</span>${details.length ? html`<span class="det">${details.join(' · ')}</span>` : nothing}</div>
          <div class="meta">${when}</div>
        </div>
        <div class="amt ${isPayment ? 'plus' : ''}">${amount}</div>
      </li>
    `;
  }

  render() {
    const entries = this.entries.slice(0, MAX_ENTRIES);
    return html`
      <section class="panel" aria-label="${this.t('activity')}">
        <div class="panel-head"><span class="label">${this.t('activity')}</span></div>
        ${entries.length
          ? html`<ol>${entries.map((e) => this.row(e))}</ol>`
          : html`<div class="empty">${this.t('noActivity')}</div>`}
      </section>
    `;
  }
}

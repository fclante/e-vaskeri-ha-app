import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Translate } from '../localize';
import type { Connection } from '../logic/machines';
import { base, reducedMotion, tokens } from './styles';
import { bubbleIcon } from './icons';

@customElement('ev-header')
export class EvHeader extends LitElement {
  @property({ attribute: false }) t!: Translate;
  @property() title = '';
  @property() status: Connection = 'live';
  @property() upstream: string | null = null;
  @property({ type: Number }) ageMin: number | null = null;

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      :host {
        display: block;
      }
      .head {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
      }
      .logo {
        flex: none;
        width: 46px;
        height: 46px;
        border-radius: 15px;
        display: grid;
        place-items: center;
        color: #fff;
        background: linear-gradient(145deg, var(--ev-washer), color-mix(in srgb, var(--ev-washer) 55%, var(--ev-mangle)));
        box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--ev-washer) 70%, transparent);
      }
      .logo svg {
        width: 26px;
        height: 26px;
      }
      .text {
        min-width: 0;
      }
      h2 {
        margin: 0;
        font-size: 1.25rem;
        line-height: 1.2;
        font-weight: 650;
        letter-spacing: -0.01em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 3px;
        font-size: 0.82rem;
        color: var(--ev-text-2);
      }
      .dot {
        position: relative;
        flex: none;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--ev-free);
      }
      .live .dot::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: var(--ev-free);
        animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
      }
      .stale .dot {
        background: var(--ev-done);
      }
      .unavailable .dot {
        background: var(--ev-error);
      }
      .unavailable .status {
        color: var(--ev-error);
      }
      @keyframes ping {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        80%,
        100% {
          transform: scale(3);
          opacity: 0;
        }
      }
    `,
  ];

  render() {
    const t = this.t;
    let text: string;
    if (this.status === 'unavailable') text = t('unavailable');
    else if (this.status === 'stale' && this.ageMin != null) text = t('stale', { n: this.ageMin });
    else text = this.upstream ? t('live', { time: this.upstream }) : t('liveNoTime');
    return html`
      <div class="head ${this.status}">
        <div class="logo">${bubbleIcon}</div>
        <div class="text">
          <h2>${this.title || 'E-Vaskeri'}</h2>
          <div class="status" role="status">
            <span class="dot"></span><span>${text}</span>
            ${this.status === 'stale' && this.upstream ? html`<span>· ${this.upstream}</span>` : nothing}
          </div>
        </div>
      </div>
    `;
  }
}

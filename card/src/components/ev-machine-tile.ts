import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Machine } from '../types';
import { type Translate, stateLabel } from '../localize';
import { formatCountdown } from '../logic/countdown';
import { base, reducedMotion, tokens } from './styles';
import { checkIcon, machineIcon, warningIcon } from './icons';

const R = 34;
const C = 2 * Math.PI * R;

@customElement('ev-machine-tile')
export class EvMachineTile extends LitElement {
  @property({ attribute: false }) t!: Translate;
  @property({ attribute: false }) machine!: Machine;
  @property() displayName = '';
  /** Seconds left, or null when unknown. */
  @property({ attribute: false }) remaining: number | null = null;
  /** Elapsed fraction 0..1, or null for the indeterminate ring. */
  @property({ attribute: false }) fraction: number | null = null;
  @property() finishTime: string | null = null;

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      :host {
        display: block;
      }
      .tile {
        --state: var(--ev-unknown);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        height: 100%;
        min-height: 156px;
        padding: 12px 8px;
        border-radius: var(--ev-radius);
        text-align: center;
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        color: var(--ev-text);
        background:
          radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 70%),
          var(--ev-surface);
        border: 1px solid color-mix(in srgb, var(--ev-line) 70%, transparent);
        box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 18%, transparent);
        transition:
          transform 0.15s ease,
          border-color 0.25s ease,
          box-shadow 0.25s ease,
          background 0.25s ease;
        outline: none;
      }
      .tile:hover {
        transform: translateY(-2px);
        background:
          radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
          var(--ev-surface-2);
      }
      .tile:active {
        transform: scale(0.98);
      }
      .tile:focus-visible {
        box-shadow: 0 0 0 2px var(--primary-color, var(--accent));
      }
      .tile.nobtn {
        cursor: default;
      }
      .name {
        display: flex;
        justify-content: center;
        gap: 0.3em;
        max-width: 100%;
        font-size: 0.76rem;
        font-weight: 600;
        line-height: 1.2;
        color: var(--ev-text-2);
      }
      .name .ty {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .name .id {
        flex: none;
        color: var(--ev-text);
      }
      .dial {
        position: relative;
        width: 76px;
        height: 76px;
        margin: 2px 0;
        flex: none;
      }
      .dial .icon {
        position: absolute;
        inset: 14px;
        color: var(--ev-unknown);
        transition: color 0.3s;
      }
      .icon svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      svg.ring {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
        overflow: visible;
      }
      .ring .track {
        stroke: color-mix(in srgb, var(--state) 14%, transparent);
      }
      .ring .prog {
        stroke: var(--state);
        stroke-dasharray: ${C};
        transition: stroke-dashoffset 1s linear;
        filter: drop-shadow(0 0 3px color-mix(in srgb, var(--state) 50%, transparent));
      }
      .ring .prog.indet {
        stroke-dasharray: ${C * 0.26} ${C};
        transform-origin: 40px 40px;
        animation: orbit 1.8s linear infinite;
        opacity: 0.8;
      }
      .status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.25;
      }
      .status .pip {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--state);
        flex: none;
      }
      .status svg {
        width: 16px;
        height: 16px;
        flex: none;
      }

      /* free */
      .free {
        --state: var(--ev-free);
      }
      .free .status {
        color: color-mix(in srgb, var(--ev-free) 85%, var(--ev-text));
      }
      .free .dial .icon {
        color: color-mix(in srgb, var(--ev-text-2) 75%, transparent);
      }
      .free .ring .track {
        stroke: color-mix(in srgb, var(--ev-text) 7%, transparent);
      }
      .free .status .pip {
        opacity: 0.8;
      }

      /* busy */
      .busy {
        --state: var(--accent);
        border-color: color-mix(in srgb, var(--accent) 35%, var(--ev-line));
      }
      .busy .dial .icon {
        color: var(--accent);
      }
      .busy .spin {
        animation: spin 3.4s linear infinite;
      }
      .busy .spin.rev {
        animation-direction: reverse;
      }
      .busy .flame {
        transform-box: fill-box;
        transform-origin: 50% 100%;
        animation: flicker 1.3s ease-in-out infinite;
      }
      .count {
        font-size: 1.28rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        line-height: 1.15;
        font-variant-numeric: tabular-nums;
      }
      .count.soon {
        font-size: 0.98rem;
        color: var(--accent);
      }
      .prog-line {
        font-size: 0.74rem;
        line-height: 1.3;
        color: var(--ev-text-2);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 100%;
        overflow-wrap: anywhere;
      }
      .until {
        font-size: 0.74rem;
        font-weight: 600;
        color: var(--accent);
        font-variant-numeric: tabular-nums;
        text-wrap: balance;
      }

      /* done */
      .done {
        --state: var(--ev-done);
        border-color: color-mix(in srgb, var(--ev-done) 60%, transparent);
        animation: pulse 2.2s ease-in-out infinite;
      }
      .done .dial .icon {
        color: var(--ev-done);
      }
      .done .status {
        color: color-mix(in srgb, var(--ev-done) 80%, var(--ev-text));
        flex-direction: column;
        gap: 2px;
      }
      .done .status svg {
        width: 22px;
        height: 22px;
      }

      /* error */
      .error {
        --state: var(--ev-error);
        border-color: color-mix(in srgb, var(--ev-error) 65%, transparent);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--ev-error) 25%, transparent);
      }
      .error .dial .icon {
        color: var(--ev-error);
      }
      .error .status {
        color: var(--ev-error);
      }
      .overlay {
        position: absolute;
        right: -4px;
        bottom: -2px;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        background: var(--ev-error);
        border: 2px solid var(--card-background-color, #fff);
      }
      .overlay svg {
        width: 14px;
        height: 14px;
      }
      .overlay.ok {
        background: var(--ev-done);
      }

      .unknown .status {
        color: var(--ev-text-2);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes orbit {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes flicker {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.12, 0.94);
        }
      }
      @keyframes pulse {
        0%,
        100% {
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--ev-done) 0%, transparent);
        }
        50% {
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--ev-done) 28%, transparent);
        }
      }
    `,
  ];

  private get clickable(): boolean {
    return !!this.machine.entity_id;
  }

  private open = () => {
    const entityId = this.machine.entity_id;
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
  };

  private onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      this.open();
    }
  };

  private a11yLabel(): string {
    const t = this.t;
    const m = this.machine;
    const parts = [this.displayName, stateLabel(t, m.state)];
    if (m.state === 'busy') {
      if (this.remaining === 0) parts.push(t('almostDone'));
      else if (this.remaining != null) parts.push(formatCountdown(this.remaining));
      if (this.finishTime) parts.push(t('finishAt', { time: this.finishTime }));
    }
    return parts.join(', ');
  }

  private dial(showRing: boolean) {
    const m = this.machine;
    const full = m.state === 'done';
    const indet = !full && this.fraction == null;
    const off = full ? 0 : C * (1 - (this.fraction ?? 0));
    return html`
      <div class="dial">
        <svg class="ring" viewBox="0 0 80 80" aria-hidden="true">
          <circle class="track" cx="40" cy="40" r="${R}" fill="none" stroke-width="5"></circle>
          ${showRing
            ? html`<circle class="prog ${indet ? 'indet' : ''}" cx="40" cy="40" r="${R}" fill="none" stroke-width="5"
                stroke-linecap="round" style="${indet ? '' : `stroke-dashoffset:${off}`}"></circle>`
            : nothing}
        </svg>
        <div class="icon">${machineIcon(m.type)}</div>
        ${m.state === 'error' ? html`<span class="overlay">${warningIcon}</span>` : nothing}
        ${m.state === 'done' ? html`<span class="overlay ok">${checkIcon}</span>` : nothing}
      </div>
    `;
  }

  private name() {
    const m = /^(.*?)\s+(\d+)$/.exec(this.displayName);
    return m
      ? html`<div class="name" title="${this.displayName}"><span class="ty">${m[1]}</span><span class="id">${m[2]}</span></div>`
      : html`<div class="name"><span class="ty">${this.displayName}</span></div>`;
  }

  private body() {
    const t = this.t;
    const m = this.machine;
    switch (m.state) {
      case 'busy': {
        const line = [m.program, m.step].filter(Boolean).join(' · ');
        const soon = this.remaining === 0;
        return html`
          ${this.dial(true)}
          <div class="count ${soon ? 'soon' : ''}">${soon ? t('almostDone') : this.remaining != null ? formatCountdown(this.remaining) : t('busy')}</div>
          ${line ? html`<div class="prog-line" title="${line}">${line}</div>` : nothing}
          ${this.finishTime && !soon ? html`<div class="until">${t('finishAt', { time: this.finishTime })}</div>` : nothing}
        `;
      }
      case 'done':
        return html`${this.dial(true)}<div class="status">${t('done')}</div>
          ${m.program ? html`<div class="prog-line">${m.program}</div>` : nothing}`;
      case 'error':
        return html`${this.dial(false)}<div class="status">${t('error')}</div>
          ${m.raw_status ? html`<div class="prog-line">${m.raw_status}</div>` : nothing}`;
      case 'free':
        return html`${this.dial(false)}<div class="status"><span class="pip"></span>${t('free')}</div>`;
      default:
        return html`${this.dial(false)}<div class="status">${t('unknown')}</div>`;
    }
  }

  render() {
    const m = this.machine;
    if (!m) return nothing;
    const click = this.clickable;
    return html`
      <div
        class="tile t-${m.type} ${m.state} ${click ? '' : 'nobtn'}"
        role="${click ? 'button' : 'group'}"
        tabindex="${click ? 0 : -1}"
        aria-label="${this.a11yLabel()}"
        @click=${this.open}
        @keydown=${this.onKey}
      >
        ${this.name()}
        ${this.body()}
      </div>
    `;
  }
}

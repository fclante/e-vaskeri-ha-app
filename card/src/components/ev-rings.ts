import { LitElement, html, css, nothing, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Machine, MachineType } from '../types';
import { type Translate, typeLabel, typeLabelLower } from '../localize';
import { groupMachines, nextFinish, formatDuration, machineName } from '../logic/machines';
import { base, reducedMotion, tokens } from './styles';
import { clockIcon, typeGlyph } from './icons';

const R = 34;
const C = 2 * Math.PI * R;

@customElement('ev-rings')
export class EvRings extends LitElement {
  @property({ attribute: false }) t!: Translate;
  @property({ attribute: false }) machines: Machine[] = [];
  @property({ type: Number }) now = Date.now();
  @property({ attribute: false }) updatedAt: number | null = null;

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      .rings {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
        gap: 8px;
        padding: 14px 10px 12px;
      }
      .ring {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .dial {
        position: relative;
        width: 84px;
        height: 84px;
      }
      svg.arc {
        width: 84px;
        height: 84px;
        transform: rotate(-90deg);
      }
      .track {
        stroke: color-mix(in srgb, var(--accent) 16%, transparent);
      }
      .fill {
        stroke: var(--accent);
        stroke-dasharray: var(--c);
        stroke-dashoffset: var(--off);
        animation: ring-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
        transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        filter: drop-shadow(0 0 4px color-mix(in srgb, var(--accent) 45%, transparent));
      }
      @keyframes ring-in {
        from {
          stroke-dashoffset: var(--c);
        }
      }
      .center {
        position: absolute;
        inset: 0;
        display: grid;
        place-content: center;
        text-align: center;
        line-height: 1;
      }
      .big {
        font-size: 1.7rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .big small {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--ev-text-2);
        letter-spacing: 0;
      }
      .zero .big {
        color: var(--ev-text-2);
      }
      .name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        font-weight: 550;
        color: var(--ev-text);
        text-align: center;
        justify-content: center;
        overflow-wrap: anywhere;
      }
      @container (max-width: 480px) {
        .name {
          font-size: 0.74rem;
        }
        .name svg {
          display: none;
        }
      }
      .name svg {
        width: 16px;
        height: 16px;
        color: var(--accent);
        flex: none;
      }
      .chips {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 12px 14px;
      }
      .chip {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 14px;
        border-radius: 999px;
        font-size: 0.84rem;
        background: color-mix(in srgb, var(--accent, var(--ev-text-2)) 13%, transparent);
        border: 1px solid color-mix(in srgb, var(--accent, var(--ev-text-2)) 28%, transparent);
        line-height: 1.3;
      }
      .chip.subtle {
        --accent: var(--ev-text-2);
        background: var(--ev-surface);
        border-color: transparent;
        color: var(--ev-text-2);
      }
      .chip svg {
        width: 18px;
        height: 18px;
        flex: none;
        color: var(--accent);
      }
      .chip b {
        font-weight: 650;
        color: var(--ev-text);
      }
    `,
  ];

  private ring(type: MachineType, free: number, total: number) {
    const frac = total > 0 ? free / total : 0;
    return html`
      <div class="ring t-${type} ${free === 0 ? 'zero' : ''}" role="img" aria-label="${typeLabel(this.t, type, true)}: ${this.t('free_of', { free, total })}">
        <div class="dial">
          ${svg`<svg class="arc" viewBox="0 0 84 84" aria-hidden="true">
            <circle class="track" cx="42" cy="42" r="${R}" fill="none" stroke-width="8"/>
            <circle class="fill" cx="42" cy="42" r="${R}" fill="none" stroke-width="8" stroke-linecap="round"
              style="--c:${C};--off:${frac > 0 ? C * (1 - frac) : C}" opacity="${frac > 0 ? 1 : 0}"/>
          </svg>`}
          <div class="center"><span class="big num">${free}<small>/${total}</small></span></div>
        </div>
        <div class="name">${typeGlyph(type)}<span>${typeLabel(this.t, type, true)}</span></div>
      </div>
    `;
  }

  private chip(text: unknown, type?: MachineType, subtle = false) {
    return html`<div class="chip ${subtle ? 'subtle' : ''} ${type ? `t-${type}` : ''}">${clockIcon}<span>${text}</span></div>`;
  }

  private nextText(name: string, seconds: number) {
    const t = this.t;
    return seconds < 30
      ? t('nextFreeNow', { name })
      : t('nextFreeChip', { name, time: formatDuration(t, seconds) });
  }

  private chips() {
    const t = this.t;
    const groups = groupMachines(this.machines);
    const out = [];
    for (const g of groups) {
      if (g.counts.free > 0 || g.counts.busy === 0) continue;
      const next = nextFinish(this.machines, this.now, this.updatedAt, g.type);
      if (!next) continue;
      out.push(
        this.chip(
          html`${t('allBusy', { types: typeLabelLower(t, g.type) })} · ${t('nextFree')}:
            <b>${this.nextText(machineName(t, next.machine), next.seconds)}</b>`,
          g.type,
        ),
      );
    }
    if (!out.length) {
      const next = nextFinish(this.machines, this.now, this.updatedAt);
      if (next) {
        out.push(
          this.chip(html`${t('nextFinish')}: <b>${this.nextText(machineName(t, next.machine), next.seconds)}</b>`, undefined, true),
        );
      }
    }
    return out.length ? html`<div class="chips">${out}</div>` : nothing;
  }

  render() {
    const groups = groupMachines(this.machines);
    if (!groups.length) return nothing;
    return html`
      <div class="panel" style="padding:0">
        <div class="rings">${groups.map((g) => this.ring(g.type, g.counts.free, g.counts.total))}</div>
        ${this.chips()}
      </div>
    `;
  }
}

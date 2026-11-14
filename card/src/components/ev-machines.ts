import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Machine } from '../types';
import { type Translate, typeLabel } from '../localize';
import { type Fmt, formatTime } from '../logic/format';
import { endMs, remainingSeconds, type ProgressTracker } from '../logic/countdown';
import { groupMachines, machineName } from '../logic/machines';
import { TILE_GAP, balancedColumns, maxColumns, tileWidth } from '../logic/layout';
import { base, reducedMotion, tokens } from './styles';
import { typeGlyph } from './icons';
import './ev-machine-tile';

@customElement('ev-machines')
export class EvMachines extends LitElement {
  @property({ attribute: false }) t!: Translate;
  @property({ attribute: false }) fmt!: Fmt;
  @property({ attribute: false }) machines: Machine[] = [];
  @property({ type: Number }) now = Date.now();
  @property({ attribute: false }) updatedAt: number | null = null;
  @property({ attribute: false }) tracker!: ProgressTracker;
  @state() private width = 0;
  private observer?: ResizeObserver;

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      .group + .group {
        margin-top: 18px;
      }
      .group-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 4px 10px;
        color: var(--ev-text-2);
      }
      .group-head svg {
        width: 16px;
        height: 16px;
        color: var(--accent);
      }
      .group-head .count {
        margin-left: auto;
        font-size: 0.78rem;
        font-variant-numeric: tabular-nums;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
        gap: ${TILE_GAP}px;
        justify-content: start;
      }
    `,
  ];

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver((entries) => {
        const w = Math.floor(entries[0]?.contentRect.width ?? 0);
        if (w > 0 && w !== this.width) this.width = w;
      });
      this.observer.observe(this);
    }
  }

  disconnectedCallback(): void {
    this.observer?.disconnect();
    super.disconnectedCallback();
  }

  private tile(machine: Machine) {
    const remaining = machine.state === 'busy' ? remainingSeconds(machine, this.now, this.updatedAt) : null;
    const end = machine.state === 'busy' ? endMs(machine, this.updatedAt) : null;
    return html`<ev-machine-tile
      .t=${this.t}
      .machine=${machine}
      .displayName=${machineName(this.t, machine)}
      .remaining=${remaining}
      .fraction=${this.tracker.fraction(machine.id, remaining)}
      .finishTime=${end != null ? formatTime(this.fmt, end) : null}
    ></ev-machine-tile>`;
  }

  render() {
    const groups = groupMachines(this.machines);
    if (!groups.length) return nothing;
    const maxCols = maxColumns(this.width);
    const tileW = tileWidth(this.width, maxCols);
    return html`${groups.map((g) => {
      const cols = balancedColumns(g.machines.length, maxCols);
      const columns = this.width > 0 ? `grid-template-columns:repeat(${cols},minmax(0,${tileW}px))` : '';
      return html`
        <section class="group t-${g.type}" aria-label="${typeLabel(this.t, g.type, true)}">
          <div class="group-head">
            ${typeGlyph(g.type)}<span class="label">${typeLabel(this.t, g.type, true)}</span>
            <span class="count">${this.t('free_of', { free: g.counts.free, total: g.counts.total })}</span>
          </div>
          <div class="grid" style="${columns}">${g.machines.map((m) => this.tile(m))}</div>
        </section>
      `;
    })}`;
  }
}

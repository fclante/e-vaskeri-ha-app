import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  AccountOverview,
  HomeAssistant,
  LovelaceCardConfig,
  MachinesOverview,
  Section,
} from './types';
import { makeTranslate, type Translate } from './localize';
import { createFormat, type Fmt } from './logic/format';
import { discoverEntities, readAccount, readMachines } from './logic/data';
import { ProgressTracker } from './logic/countdown';
import { connectionStatus, filterTypes, groupMachines, staleAgeMinutes } from './logic/machines';
import { base, reducedMotion, tokens } from './components/styles';
import { infoIcon, warningIcon } from './components/icons';
import './components/ev-header';
import './components/ev-rings';
import './components/ev-machines';
import './components/ev-balance';
import './components/ev-spend';
import './components/ev-heatmap';
import './components/ev-activity';

export const ALL_SECTIONS: Section[] = ['machines', 'balance', 'spend', 'heatmap', 'activity'];

// Shared so progress survives the card being re-created while navigating dashboards.
const sharedTracker = new ProgressTracker();

@customElement('e-vaskeri-card')
export class EVaskeriCard extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config: LovelaceCardConfig = { type: 'custom:e-vaskeri-card' };
  @state() private now = Date.now();

  private machines: MachinesOverview | null = null;
  private account: AccountOverview | null = null;
  private machinesEntity: string | null = null;
  private accountEntity: string | null = null;
  private machinesRef: unknown;
  private accountRef: unknown;
  private timer?: number;

  static getConfigElement(): HTMLElement {
    return document.createElement('e-vaskeri-card-editor');
  }

  static getStubConfig(): Partial<LovelaceCardConfig> {
    return {};
  }

  setConfig(config: LovelaceCardConfig): void {
    if (!config || typeof config !== 'object') throw new Error('Invalid configuration');
    this.config = { ...config };
    this.machinesRef = this.accountRef = undefined;
  }

  getCardSize(): number {
    const sections = this.sections();
    const machines = this.machines?.machines ?? [];
    let size = 2;
    if (sections.has('machines')) {
      size += 3 + groupMachines(machines).reduce((n, g) => n + 1 + Math.ceil(g.machines.length / 3) * 3, 0);
    }
    if (sections.has('balance')) size += 3;
    if (sections.has('spend')) size += 6;
    if (sections.has('heatmap')) size += 4;
    if (sections.has('activity')) size += 6;
    return size;
  }

  getGridOptions() {
    return { columns: 12, rows: 'auto', min_columns: 6, min_rows: 3 };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.now = Date.now();
    this.timer = window.setInterval(() => this.tick(), 1000);
  }

  disconnectedCallback(): void {
    window.clearInterval(this.timer);
    super.disconnectedCallback();
  }

  private tick(): void {
    this.now = Date.now();
    if (this.machines) sharedTracker.observe(this.machines.machines, this.now, this.machines.updatedAt);
  }

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('hass') || changed.has('config')) {
      const found = discoverEntities(this.hass, this.config);
      this.machinesEntity = found.machinesEntity;
      this.accountEntity = found.accountEntity;
      const mState = found.machinesEntity ? this.hass?.states?.[found.machinesEntity] : undefined;
      if (mState !== this.machinesRef || changed.has('config')) {
        this.machinesRef = mState;
        this.machines = readMachines(this.hass, found.machinesEntity);
        if (this.machines) sharedTracker.observe(this.machines.machines, Date.now(), this.machines.updatedAt);
      }
      const aState = found.accountEntity ? this.hass?.states?.[found.accountEntity] : undefined;
      if (aState !== this.accountRef || changed.has('config')) {
        this.accountRef = aState;
        this.account = readAccount(this.hass, found.accountEntity);
      }
    }
  }

  private sections(): Set<Section> {
    if (this.config.compact) return new Set<Section>(['machines']);
    return new Set(this.config.show ?? ALL_SECTIONS);
  }

  static styles = [
    tokens,
    base,
    reducedMotion,
    css`
      :host {
        display: block;
      }
      ha-card {
        display: block;
        overflow: hidden;
      }
      .root {
        container-type: inline-size;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .cols {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 16px;
      }
      .col {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 0;
      }
      @container (min-width: 880px) {
        .cols {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: start;
        }
        .cols.single {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @container (max-width: 380px) {
        .root {
          gap: 12px;
        }
      }
      .compact .root {
        gap: 14px;
      }
      .alert {
        display: flex;
        gap: 12px;
        padding: 12px 14px;
        border-radius: var(--ev-radius-sm);
        font-size: 0.86rem;
        line-height: 1.45;
        color: var(--ev-text);
        background: color-mix(in srgb, var(--tone, var(--ev-washer)) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--tone, var(--ev-washer)) 35%, transparent);
        border-left: 4px solid var(--tone, var(--ev-washer));
      }
      .alert svg {
        flex: none;
        width: 22px;
        height: 22px;
        color: var(--tone, var(--ev-washer));
      }
      .alert b {
        display: block;
        margin-bottom: 2px;
      }
      .alert.warn {
        --tone: var(--ev-done);
      }
      .alert.err {
        --tone: var(--ev-error);
      }
      .skeleton {
        height: 160px;
        border-radius: var(--ev-radius);
        background: linear-gradient(100deg, var(--ev-surface) 30%, var(--ev-surface-2) 50%, var(--ev-surface) 70%);
        background-size: 200% 100%;
        animation: shimmer 1.4s linear infinite;
      }
      @keyframes shimmer {
        to {
          background-position: -200% 0;
        }
      }
    `,
  ];

  private alert(kind: 'info' | 'warn' | 'err', title: string | null, body: string) {
    return html`<div class="alert ${kind}" role="${kind === 'err' ? 'alert' : 'note'}">
      ${kind === 'info' ? infoIcon : warningIcon}
      <div>${title ? html`<b>${title}</b>` : nothing}${body}</div>
    </div>`;
  }

  protected render() {
    if (!this.hass) {
      return html`<ha-card><div class="root"><div class="skeleton"></div></div></ha-card>`;
    }
    const fmt: Fmt = createFormat(this.hass, this.config.language);
    const t: Translate = makeTranslate(fmt.lang);
    const sections = this.sections();
    const ov = this.machines;
    const discovered = !!(this.machinesEntity || this.accountEntity) &&
      !!((this.machinesEntity && this.hass.states[this.machinesEntity]) || (this.accountEntity && this.hass.states[this.accountEntity]));

    if (!discovered) {
      return html`<ha-card><div class="root">
        <ev-header .t=${t} .title=${this.config.title ?? ''} status="unavailable"></ev-header>
        ${this.alert('warn', t('setupTitle'), t('setupBody'))}
      </div></ha-card>`;
    }

    const status = connectionStatus(ov, this.now);
    const machines = ov ? filterTypes(ov.machines, this.config.machine_types) : [];
    const wantAccount = sections.has('balance') || sections.has('spend') || sections.has('heatmap') || sections.has('activity');
    const account = this.account?.available ? this.account : null;
    const stats = account?.stats;

    const left: TemplateResult[] = [];
    const right: TemplateResult[] = [];
    if (sections.has('balance') && account) {
      left.push(html`<ev-balance .t=${t} .fmt=${fmt} .account=${account}></ev-balance>`);
    }
    if (sections.has('spend') && account && stats?.months.length) {
      left.push(html`<ev-spend .t=${t} .fmt=${fmt} .account=${account}></ev-spend>`);
    }
    if (sections.has('heatmap') && stats?.heatmap.length) {
      right.push(html`<ev-heatmap .t=${t} .fmt=${fmt} .matrix=${stats.heatmap}></ev-heatmap>`);
    }
    if (sections.has('activity') && account && account.recent.length) {
      right.push(html`<ev-activity .t=${t} .fmt=${fmt} .entries=${account.recent}></ev-activity>`);
    }

    return html`
      <ha-card class="${this.config.compact ? 'compact' : ''}">
        <div class="root">
          <ev-header
            .t=${t}
            .title=${this.config.title || ov?.location || ''}
            .status=${status}
            .upstream=${ov?.upstreamUpdated ?? null}
            .ageMin=${staleAgeMinutes(ov?.updatedAt ?? null, this.now)}
          ></ev-header>
          ${status === 'unavailable' && sections.has('machines')
            ? this.alert('err', null, this.machinesEntity ? t('unavailableBody') : t('noMachines'))
            : nothing}
          ${sections.has('machines') && ov?.available
            ? html`
                <ev-rings .t=${t} .machines=${machines} .now=${this.now} .updatedAt=${ov.updatedAt}></ev-rings>
                <ev-machines
                  .t=${t}
                  .fmt=${fmt}
                  .machines=${machines}
                  .now=${this.now}
                  .updatedAt=${ov.updatedAt}
                  .tracker=${sharedTracker}
                ></ev-machines>
              `
            : nothing}
          ${wantAccount && !this.accountEntity ? this.alert('info', null, t('noAccount')) : nothing}
          ${wantAccount && this.accountEntity && !account
            ? this.alert('info', null, t('unavailableBody'))
            : nothing}
          ${left.length || right.length
            ? html`<div class="cols ${left.length && right.length ? '' : 'single'}">
                ${left.length ? html`<div class="col">${left}</div>` : nothing}
                ${right.length ? html`<div class="col">${right}</div>` : nothing}
              </div>`
            : nothing}
        </div>
      </ha-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'e-vaskeri-card': EVaskeriCard;
  }
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}

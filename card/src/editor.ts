import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardConfig } from './types';
import { makeTranslate, type StringKey } from './localize';
import { resolveLang } from './logic/format';

const SECTIONS = ['machines', 'balance', 'spend', 'heatmap', 'activity'] as const;
const TYPES = ['washer', 'dryer', 'mangle'] as const;

@customElement('e-vaskeri-card-editor')
export class EVaskeriCardEditor extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private config?: LovelaceCardConfig;

  setConfig(config: LovelaceCardConfig): void {
    this.config = config;
  }

  private schema() {
    const t = makeTranslate(resolveLang(this.hass, this.config?.language));
    return [
      { name: 'title', selector: { text: {} } },
      {
        name: 'show',
        selector: {
          select: {
            multiple: true,
            mode: 'list',
            options: SECTIONS.map((value) => ({ value, label: t(`sec_${value}` as StringKey) })),
          },
        },
      },
      { name: 'compact', selector: { boolean: {} } },
      {
        name: 'machine_types',
        selector: {
          select: {
            multiple: true,
            mode: 'list',
            options: TYPES.map((value) => ({ value, label: t(`types_${value}` as StringKey) })),
          },
        },
      },
      {
        name: 'language',
        selector: {
          select: {
            mode: 'dropdown',
            options: [
              { value: 'auto', label: t('editor_auto') },
              { value: 'da', label: 'Dansk' },
              { value: 'en', label: 'English' },
            ],
          },
        },
      },
      { name: 'machines_entity', selector: { entity: { domain: 'sensor', integration: 'e_vaskeri' } } },
      { name: 'account_entity', selector: { entity: { domain: 'sensor', integration: 'e_vaskeri' } } },
    ];
  }

  private label = (schema: { name: string }): string => {
    const t = makeTranslate(resolveLang(this.hass, this.config?.language));
    return t(`editor_${schema.name}` as StringKey);
  };

  private changed = (ev: CustomEvent<{ value: Record<string, unknown> }>) => {
    ev.stopPropagation();
    const value = { ...ev.detail.value };
    for (const key of Object.keys(value)) {
      const v = value[key];
      const isDefaultList = (key === 'show' && Array.isArray(v) && v.length === SECTIONS.length) ||
        (key === 'machine_types' && Array.isArray(v) && v.length === TYPES.length);
      if (v === '' || v === undefined || v === null || v === false || isDefaultList || (key === 'language' && v === 'auto')) delete value[key];
    }
    const config = { ...value, type: this.config?.type ?? 'custom:e-vaskeri-card' } as LovelaceCardConfig;
    this.config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  };

  render() {
    if (!this.config) return nothing;
    const data = {
      show: ['machines', 'balance', 'spend', 'heatmap', 'activity'],
      machine_types: [...TYPES],
      language: 'auto',
      compact: false,
      ...this.config,
    };
    return html`<ha-form
      .hass=${this.hass}
      .data=${data}
      .schema=${this.schema()}
      .computeLabel=${this.label}
      @value-changed=${this.changed}
    ></ha-form>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'e-vaskeri-card-editor': EVaskeriCardEditor;
  }
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoverEntities, readAccount, readMachines } from '../src/logic/data';
import { ACCOUNT_ENTITY, MACHINES_ENTITY, buildHass, createModel, setMachineState } from '../dev/mock';
import '../src/index';
import type { EVaskeriCard } from '../src/e-vaskeri-card';

const NOW = Date.parse('2026-11-13T21:50:00Z');

describe('entity discovery', () => {
  it('finds both hub entities by platform and translation key', () => {
    const hass = buildHass(createModel(NOW), { now: NOW });
    expect(discoverEntities(hass)).toEqual({ machinesEntity: MACHINES_ENTITY, accountEntity: ACCOUNT_ENTITY });
  });
  it('ignores entities of other platforms', () => {
    const hass = buildHass(createModel(NOW), { now: NOW });
    hass.entities![MACHINES_ENTITY].platform = 'other';
    expect(discoverEntities(hass).machinesEntity).toBeNull();
  });
  it('prefers explicit overrides', () => {
    const hass = buildHass(createModel(NOW), { now: NOW });
    expect(discoverEntities(hass, { machines_entity: 'sensor.mine', account_entity: 'sensor.acct' })).toEqual({
      machinesEntity: 'sensor.mine',
      accountEntity: 'sensor.acct',
    });
  });
  it('returns nulls when the integration is absent', () => {
    expect(discoverEntities(buildHass(createModel(NOW), { now: NOW, missing: true }))).toEqual({
      machinesEntity: null,
      accountEntity: null,
    });
    expect(discoverEntities(undefined)).toEqual({ machinesEntity: null, accountEntity: null });
  });
});

describe('attribute parsing', () => {
  const hass = buildHass(createModel(NOW), { now: NOW });
  it('normalises the machines overview', () => {
    const ov = readMachines(hass, MACHINES_ENTITY)!;
    expect(ov.available).toBe(true);
    expect(ov.location).toBe('Example Laundry');
    expect(ov.machines).toHaveLength(12);
    expect(ov.machines.find((m) => m.id === 3)?.program).toBe('95° Normal');
    expect(ov.machines.find((m) => m.id === 3)?.entity_id).toBe('sensor.vaskemaskine_3_status');
    expect(ov.summary.by_type.washer).toEqual({ total: 8, free: 6, busy: 1 });
    expect(ov.summary.next_free?.id).toBe(10);
  });
  it('marks unavailable entities', () => {
    const off = buildHass(createModel(NOW), { now: NOW, unavailable: true });
    expect(readMachines(off, MACHINES_ENTITY)?.available).toBe(false);
    expect(readAccount(off, ACCOUNT_ENTITY)?.available).toBe(false);
  });
  it('parses the account overview', () => {
    const acc = readAccount(hass, ACCOUNT_ENTITY)!;
    expect(acc.balance).toBe(25);
    expect(acc.previousPeriod).toBe(5);
    expect(acc.lastPayment?.date).toBe('2025-01-14');
    expect(acc.stats?.months).toHaveLength(12);
    expect(acc.stats?.heatmap).toHaveLength(7);
    expect(acc.recent.length).toBeGreaterThan(5);
  });
  it('survives garbage attributes', () => {
    const bad = buildHass(createModel(NOW), { now: NOW });
    bad.states[MACHINES_ENTITY].attributes = { machines: [null, 5, { id: 'x' }, { id: 4, type: 'weird', state: 'nope' }] };
    const ov = readMachines(bad, MACHINES_ENTITY)!;
    expect(ov.machines).toHaveLength(1);
    expect(ov.machines[0]).toMatchObject({ type: 'other', state: 'unknown' });
  });
});

describe('<e-vaskeri-card>', () => {
  let card: EVaskeriCard;

  const mount = async (hass = buildHass(createModel(Date.now()), { now: Date.now() }), config = {}) => {
    card = document.createElement('e-vaskeri-card');
    card.setConfig({ type: 'custom:e-vaskeri-card', ...config });
    card.hass = hass;
    document.body.append(card);
    await card.updateComplete;
    return card;
  };
  const q = (sel: string, root: ParentNode | undefined = card.shadowRoot!) => root.querySelector(sel);

  beforeEach(() => {
    document.body.replaceChildren();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is registered for the card picker', () => {
    expect(customElements.get('e-vaskeri-card')).toBeDefined();
    expect(window.customCards?.some((c) => c.type === 'e-vaskeri-card' && c.preview)).toBe(true);
  });

  it('renders every section with the sample data', async () => {
    await mount();
    for (const tag of ['ev-header', 'ev-rings', 'ev-machines', 'ev-balance', 'ev-spend', 'ev-heatmap', 'ev-activity']) {
      expect(q(tag), tag).not.toBeNull();
    }
    const machines = q('ev-machines')!;
    await (machines as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    expect(machines.shadowRoot!.querySelectorAll('ev-machine-tile')).toHaveLength(12);
  });

  it('honours show and compact', async () => {
    await mount(undefined, { show: ['machines', 'balance'] });
    expect(q('ev-balance')).not.toBeNull();
    expect(q('ev-spend')).toBeNull();
    expect(q('ev-heatmap')).toBeNull();
    document.body.replaceChildren();
    await mount(undefined, { compact: true });
    expect(q('ev-machines')).not.toBeNull();
    expect(q('ev-balance')).toBeNull();
  });

  it('filters machine types', async () => {
    await mount(undefined, { machine_types: ['dryer'] });
    const machines = q('ev-machines') as HTMLElement & { updateComplete: Promise<boolean> };
    await machines.updateComplete;
    expect(machines.shadowRoot!.querySelectorAll('ev-machine-tile')).toHaveLength(3);
  });

  it('shows a setup message when the integration is missing', async () => {
    await mount(buildHass(createModel(Date.now()), { now: Date.now(), missing: true }));
    expect(q('.alert')?.textContent).toContain('E-Vaskeri');
    expect(q('ev-machines')).toBeNull();
  });

  it('shows an unavailable state', async () => {
    await mount(buildHass(createModel(Date.now()), { now: Date.now(), unavailable: true }));
    expect(q('.alert.err')).not.toBeNull();
    const header = q('ev-header') as HTMLElement & { status: string };
    expect(header.status).toBe('unavailable');
  });

  it('localizes by hass language and config override', async () => {
    await mount();
    let tile = (q('ev-machines')!.shadowRoot!.querySelector('ev-machine-tile') as HTMLElement).shadowRoot!;
    expect(tile.textContent).toContain('Fri');
    document.body.replaceChildren();
    await mount(undefined, { language: 'en' });
    const machines = q('ev-machines') as HTMLElement & { updateComplete: Promise<boolean> };
    await machines.updateComplete;
    tile = (machines.shadowRoot!.querySelector('ev-machine-tile') as HTMLElement & { updateComplete: Promise<boolean> }).shadowRoot!;
    expect(tile.textContent).toContain('Free');
  });

  it('ticks the countdown every second and stops at zero', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setInterval', 'clearInterval'] });
    const model = createModel(NOW);
    setMachineState(model, 1, 'busy', NOW); // 25 minutes
    await mount(buildHass(model, { now: NOW }));
    const tileOf = async (id: number) => {
      const machines = q('ev-machines') as HTMLElement & { updateComplete: Promise<boolean> };
      await machines.updateComplete;
      const tiles = [...machines.shadowRoot!.querySelectorAll('ev-machine-tile')] as (HTMLElement & { updateComplete: Promise<boolean>; machine: { id: number } })[];
      const tile = tiles.find((t) => t.machine.id === id)!;
      await tile.updateComplete;
      return tile.shadowRoot!.querySelector('.count')!.textContent!.trim();
    };
    expect(await tileOf(1)).toBe('25:00');
    vi.advanceTimersByTime(3000);
    await card.updateComplete;
    expect(await tileOf(1)).toBe('24:57');
    vi.advanceTimersByTime(30 * 60_000);
    await card.updateComplete;
    expect(await tileOf(1)).toBe('Færdig snart');
  });

  it('opens more-info for a tapped machine, via mouse and keyboard', async () => {
    await mount();
    const machines = q('ev-machines') as HTMLElement & { updateComplete: Promise<boolean> };
    await machines.updateComplete;
    const tile = machines.shadowRoot!.querySelector('ev-machine-tile') as HTMLElement & { updateComplete: Promise<boolean> };
    await tile.updateComplete;
    const seen: string[] = [];
    card.addEventListener('hass-more-info', (e) => seen.push((e as CustomEvent).detail.entityId));
    const el = tile.shadowRoot!.querySelector('.tile') as HTMLElement;
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-label')).toContain('Fri');
    el.click();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(seen).toEqual(Array(3).fill('sensor.vaskemaskine_1_status'));
  });

  it('does not make tiles without an entity interactive', async () => {
    const hass = buildHass(createModel(Date.now()), { now: Date.now() });
    (hass.states[MACHINES_ENTITY].attributes.machines as { entity_id: string | null }[]).forEach((m) => (m.entity_id = null));
    await mount(hass);
    const machines = q('ev-machines') as HTMLElement & { updateComplete: Promise<boolean> };
    await machines.updateComplete;
    const tile = machines.shadowRoot!.querySelector('ev-machine-tile') as HTMLElement & { updateComplete: Promise<boolean> };
    await tile.updateComplete;
    const seen: unknown[] = [];
    card.addEventListener('hass-more-info', (e) => seen.push(e));
    (tile.shadowRoot!.querySelector('.tile') as HTMLElement).click();
    expect(seen).toHaveLength(0);
    expect(tile.shadowRoot!.querySelector('.tile')!.getAttribute('role')).toBe('group');
  });

  it('exposes sizing helpers and a stub config', async () => {
    await mount();
    expect(card.getCardSize()).toBeGreaterThan(10);
    expect(card.getGridOptions().columns).toBe(12);
    const ctor = customElements.get('e-vaskeri-card') as unknown as { getConfigElement(): HTMLElement; getStubConfig(): object };
    expect(ctor.getConfigElement().tagName.toLowerCase()).toBe('e-vaskeri-card-editor');
    expect(ctor.getStubConfig()).toEqual({});
  });
});

describe('<e-vaskeri-card-editor>', () => {
  it('renders an ha-form with the documented schema and emits config-changed', async () => {
    const editor = document.createElement('e-vaskeri-card-editor') as HTMLElement & {
      setConfig(c: object): void;
      hass: unknown;
      updateComplete: Promise<boolean>;
    };
    editor.hass = buildHass(createModel(NOW), { now: NOW });
    editor.setConfig({ type: 'custom:e-vaskeri-card', title: 'Kælder' });
    document.body.append(editor);
    await editor.updateComplete;
    const form = editor.shadowRoot!.querySelector('ha-form') as HTMLElement & { schema: { name: string }[]; data: Record<string, unknown> };
    expect(form.schema.map((s) => s.name)).toEqual([
      'title',
      'show',
      'compact',
      'machine_types',
      'language',
      'machines_entity',
      'account_entity',
    ]);
    expect(form.data.title).toBe('Kælder');
    const events: { config: Record<string, unknown> }[] = [];
    editor.addEventListener('config-changed', (e) => events.push((e as CustomEvent).detail));
    form.dispatchEvent(
      new CustomEvent('value-changed', { detail: { value: { title: 'Kælder', compact: true, language: 'auto', show: ['machines', 'balance', 'spend', 'heatmap', 'activity'] } } }),
    );
    expect(events[0].config).toEqual({ type: 'custom:e-vaskeri-card', title: 'Kælder', compact: true });
  });
});

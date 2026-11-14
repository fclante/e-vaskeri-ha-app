import type { HomeAssistant, LovelaceCardConfig, MachineState } from '../src/types';
import { buildHass, createModel, setMachineState, type MockOptions } from './mock';

const params = new URLSearchParams(location.search);

class HaCardStub extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host { display:block; background: var(--ha-card-background, var(--card-background-color, #fff));
        border-radius: var(--ha-card-border-radius, 12px); box-shadow: var(--ha-card-box-shadow, none);
        border: 1px solid var(--ha-card-border-color, var(--divider-color, #e0e0e0)); color: var(--primary-text-color); overflow:hidden }
    </style><slot></slot>`;
  }
}
if (!customElements.get('ha-card')) customElements.define('ha-card', HaCardStub);

// Time travel: the card only reads Date.now(), so shifting it simulates time passing.
const realNow = Date.now.bind(Date);
let offsetMs = 0;
Date.now = () => realNow() + offsetMs;

if (params.has('bundle')) {
  const url = '/__bundle/e-vaskeri-card.js';
  await import(/* @vite-ignore */ url);
} else {
  await import('../src/index');
}

const stage = document.getElementById('stage')!;
const panel = document.getElementById('panel')!;
const frame = document.getElementById('frame')!;
const mount = document.getElementById('mount')!;
const log = document.getElementById('log')!;

const model = createModel(Date.now());
const opts: MockOptions & { poll: boolean } = {
  now: Date.now(),
  language: params.get('lang') ?? 'da',
  poll: params.get('poll') !== '0',
  dataAgeSec: 0,
};
let theme = params.get('theme') === 'dark' ? 'dark' : 'light';
let compact = params.get('compact') === '1';
let cardLang = params.get('cardlang') ?? '';
let shown = new Set(['machines', 'balance', 'spend', 'heatmap', 'activity']);
if (params.has('show')) shown = new Set(params.get('show')!.split(','));
let width = Number(params.get('width') ?? 720);
let lastPoll = Date.now();

for (const [key, value] of params) {
  const m = /^m(\d+)$/.exec(key);
  if (m) setMachineState(model, Number(m[1]), value as MachineState, Date.now());
}

const card = document.createElement('e-vaskeri-card') as HTMLElement & {
  hass: HomeAssistant;
  setConfig(c: LovelaceCardConfig): void;
};
mount.append(card);
card.addEventListener('hass-more-info', (ev) => {
  log.textContent = `hass-more-info → ${JSON.stringify((ev as CustomEvent).detail)}`;
});

function config(): LovelaceCardConfig {
  const c: LovelaceCardConfig = { type: 'custom:e-vaskeri-card' };
  if (compact) c.compact = true;
  if (shown.size < 5) c.show = [...shown] as LovelaceCardConfig['show'];
  if (cardLang) c.language = cardLang;
  return c;
}

function push() {
  opts.now = Date.now();
  stage.className = `stage ${theme}${params.get('panel') === '0' ? ' nopanel' : ''}`;
  frame.style.width = `${width}px`;
  card.setConfig(config());
  card.hass = buildHass(model, { ...opts, dataAgeSec: opts.dataAgeSec });
}

function poll() {
  lastPoll = Date.now();
  opts.dataAgeSec = 0;
  push();
}

setInterval(() => {
  if (opts.poll && !opts.unavailable && !opts.missing) poll();
}, 20_000);

// --- controls -----------------------------------------------------------------
const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}) =>
  Object.assign(document.createElement(tag), props) as T;

function button(text: string, onClick: () => void) {
  const b = el<HTMLButtonElement>('button', { textContent: text });
  b.onclick = onClick;
  return b;
}
function check(label: string, value: boolean, on: (v: boolean) => void) {
  const input = el<HTMLInputElement>('input', { type: 'checkbox', checked: value });
  input.onchange = () => on(input.checked);
  const l = el('label');
  l.append(label, input);
  return l;
}
function select(label: string, options: string[], value: string, on: (v: string) => void) {
  const s = el<HTMLSelectElement>('select');
  for (const o of options) s.append(Object.assign(document.createElement('option'), { value: o, textContent: o || 'auto', selected: o === value }));
  s.onchange = () => on(s.value);
  const l = el('label');
  l.append(label, s);
  return l;
}
function section(title: string) {
  panel.append(el('h3', { textContent: title }));
}

function buildPanel() {
  panel.replaceChildren(el('h1', { textContent: 'E-Vaskeri card · harness' }));
  section('Appearance');
  panel.append(
    check('Dark theme', theme === 'dark', (v) => ((theme = v ? 'dark' : 'light'), push())),
    select('HA language', ['da', 'en'], opts.language!, (v) => ((opts.language = v), push())),
    select('Card language', ['', 'da', 'en'], cardLang, (v) => ((cardLang = v), push())),
    check('Compact', compact, (v) => ((compact = v), push())),
  );
  const slider = el<HTMLInputElement>('input', { type: 'range', min: '260', max: '1200', value: String(width) });
  slider.oninput = () => ((width = Number(slider.value)), (frame.style.width = `${width}px`), (widthLabel.textContent = `${width}px`));
  const widthLabel = el('span', { textContent: `${width}px` });
  const wl = el('label');
  wl.append('Width', widthLabel);
  panel.append(wl, slider);

  section('Sections');
  for (const s of ['machines', 'balance', 'spend', 'heatmap', 'activity']) {
    panel.append(check(s, shown.has(s), (v) => ((v ? shown.add(s) : shown.delete(s)), push())));
  }

  section('Time & data');
  const row = el('div', { className: 'row' });
  for (const min of [1, 5, 20]) {
    row.append(button(`+${min} min`, () => ((offsetMs += min * 60_000), (opts.dataAgeSec = (Date.now() - lastPoll) / 1000), push())));
  }
  row.append(button('Poll now', poll), button('Reset time', () => ((offsetMs = 0), poll())));
  panel.append(
    row,
    check('Auto-poll (20 s)', opts.poll, (v) => (opts.poll = v)),
    check('Entities unavailable', !!opts.unavailable, (v) => ((opts.unavailable = v), push())),
    check('Integration missing', !!opts.missing, (v) => ((opts.missing = v), push())),
    button('Make data 5 min old', () => ((opts.poll = false), (opts.dataAgeSec = 300), push())),
  );

  section('Machines');
  for (const m of model.machines) {
    panel.append(
      select(m.name, ['free', 'busy', 'done', 'error', 'unknown'], m.state, (v) => (setMachineState(model, m.id, v as MachineState, Date.now()), poll())),
    );
  }
}

buildPanel();
push();

import type { HomeAssistant, Lang } from '../types';

export interface Fmt {
  lang: Lang;
  locale: string;
  numberLocale: string | undefined;
  grouping: boolean;
  timeZone: string | undefined;
  hour12: boolean;
}

const MINUS = '\u2212';

export function resolveLang(hass: HomeAssistant | undefined, override?: string): Lang {
  const raw = (override && override !== 'auto' ? override : hass?.locale?.language ?? hass?.language ?? 'en').toLowerCase();
  return raw.startsWith('da') ? 'da' : 'en';
}

export function createFormat(hass: HomeAssistant | undefined, override?: string): Fmt {
  const hasOverride = !!override && override !== 'auto';
  const lang = resolveLang(hass, override);
  const locale = hasOverride ? override! : hass?.locale?.language ?? hass?.language ?? 'en';
  const numberFormat = hasOverride ? 'language' : hass?.locale?.number_format ?? 'language';
  let numberLocale: string | undefined = locale;
  let grouping = true;
  switch (numberFormat) {
    case 'comma_decimal':
      numberLocale = 'en-US';
      break;
    case 'decimal_comma':
      numberLocale = 'de';
      break;
    case 'space_comma':
      numberLocale = 'fr';
      break;
    case 'none':
      grouping = false;
      break;
    case 'system':
      numberLocale = undefined;
      break;
  }
  const timeZone = hass?.locale?.time_zone === 'server' ? hass.config?.time_zone : undefined;
  return { lang, locale, numberLocale, grouping, timeZone, hour12: hass?.locale?.time_format === '12' };
}

export function formatNumber(fmt: Fmt, value: number, digits = 2): string {
  return new Intl.NumberFormat(fmt.numberLocale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: fmt.grouping,
  }).format(Math.abs(value));
}

export type SignMode = 'auto' | 'always' | 'never';

/** "−116,40 kr". Negative zero and rounding-to-zero never show a sign. */
export function formatMoney(fmt: Fmt, value: number, sign: SignMode = 'auto', digits = 2): string {
  const rounded = Math.round(Math.abs(value) * 10 ** digits) / 10 ** digits;
  const body = `${formatNumber(fmt, rounded, digits)}\u00a0kr`;
  if (sign === 'never' || rounded === 0) return body;
  if (value < 0) return `${MINUS}${body}`;
  return sign === 'always' ? `+${body}` : body;
}

export function formatTime(fmt: Fmt, when: number | Date): string {
  const date = typeof when === 'number' ? new Date(when) : when;
  const parts = new Intl.DateTimeFormat(fmt.hour12 ? 'en-US' : 'en-GB', {
    hour: fmt.hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12: fmt.hour12,
    timeZone: fmt.timeZone,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  const time = `${hour}:${get('minute')}`;
  return fmt.hour12 ? `${time} ${get('dayPeriod')}`.trim() : time;
}

function parseIsoDate(date: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

const stripDot = (s: string) => s.replace(/\.$/, '');

/** "6. nov" / "6 Nov" from "2026-11-06" */
export function formatShortDate(fmt: Fmt, date: string): string {
  const d = parseIsoDate(date);
  if (!d) return date;
  return stripDot(
    new Intl.DateTimeFormat(fmt.locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d),
  );
}

/** Short month name from "2026-11" */
export function formatMonthShort(fmt: Fmt, month: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(month);
  if (!m) return month;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  return stripDot(new Intl.DateTimeFormat(fmt.locale, { month: 'short', timeZone: 'UTC' }).format(d));
}

export function formatMonthLong(fmt: Fmt, month: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(month);
  if (!m) return month;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  return new Intl.DateTimeFormat(fmt.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

/** Weekday names, Monday first. */
export function weekdayNames(fmt: Fmt, style: 'short' | 'long' = 'short'): string[] {
  const formatter = new Intl.DateTimeFormat(fmt.locale, { weekday: style, timeZone: 'UTC' });
  // 2024-01-01 was a Monday
  return Array.from({ length: 7 }, (_, i) => stripDot(formatter.format(new Date(Date.UTC(2024, 0, 1 + i)))));
}

export function formatPercent(fmt: Fmt, fraction: number): string {
  return new Intl.NumberFormat(fmt.numberLocale, { style: 'percent', maximumFractionDigits: 0 }).format(fraction);
}

/** Repairs UTF-8 text that was mis-decoded as Latin-1 ("95Â° Normal" -> "95° Normal"). */
export function fixMojibake(text: string): string {
  if (!/[\u00c2\u00c3]/.test(text)) return text;
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code > 255) return text;
    bytes[i] = code;
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return text;
  }
}

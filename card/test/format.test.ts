import { describe, expect, it } from 'vitest';
import {
  createFormat,
  fixMojibake,
  formatMoney,
  formatMonthShort,
  formatShortDate,
  formatTime,
  resolveLang,
  weekdayNames,
} from '../src/logic/format';
import { formatCountdown } from '../src/logic/countdown';
import type { HomeAssistant } from '../src/types';

const hass = (locale: Partial<NonNullable<HomeAssistant['locale']>> = {}): HomeAssistant => ({
  states: {},
  locale: { language: 'da', ...locale },
  config: { time_zone: 'Europe/Copenhagen' },
});

describe('language', () => {
  it('uses the HA language, falling back to English', () => {
    expect(resolveLang(hass({ language: 'da' }))).toBe('da');
    expect(resolveLang(hass({ language: 'sv' }))).toBe('en');
    expect(resolveLang(undefined)).toBe('en');
  });
  it('lets the config override win', () => {
    expect(resolveLang(hass({ language: 'da' }), 'en')).toBe('en');
    expect(resolveLang(hass({ language: 'en' }), 'da')).toBe('da');
    expect(resolveLang(hass({ language: 'da' }), 'auto')).toBe('da');
  });
});

describe('money formatting', () => {
  const da = createFormat(hass());
  const en = createFormat(hass({ language: 'en' }));
  it('formats Danish amounts with a real minus sign', () => {
    expect(formatMoney(da, -116.4)).toBe('\u2212116,40\u00a0kr');
    expect(formatMoney(da, 109.8, 'never')).toBe('109,80\u00a0kr');
  });
  it('formats English amounts', () => {
    expect(formatMoney(en, -116.4)).toBe('\u2212116.40\u00a0kr');
    expect(formatMoney(en, 3220.52, 'never', 0)).toBe('3,221\u00a0kr');
  });
  it('supports explicit plus and never shows a sign for zero', () => {
    expect(formatMoney(da, 109.8, 'always')).toBe('+109,80\u00a0kr');
    expect(formatMoney(da, -0.001)).toBe('0,00\u00a0kr');
  });
  it('honours the HA number format setting', () => {
    const fmt = createFormat(hass({ language: 'da', number_format: 'comma_decimal' }));
    expect(formatMoney(fmt, 1234.5, 'never')).toBe('1,234.50\u00a0kr');
  });
});

describe('time and dates', () => {
  it('formats the finish clock in the server time zone, 24h', () => {
    const fmt = createFormat(hass({ time_zone: 'server' }));
    expect(formatTime(fmt, Date.parse('2026-11-13T21:49:00Z'))).toBe('22:49');
    expect(formatTime(fmt, Date.parse('2026-07-13T21:49:00Z'))).toBe('23:49');
  });
  it('supports 12 hour clocks', () => {
    const fmt = createFormat(hass({ language: 'en', time_zone: 'server', time_format: '12' }));
    expect(formatTime(fmt, Date.parse('2026-11-13T21:49:00Z'))).toMatch(/^10:49 PM$/i);
  });
  it('formats short dates and months in the card language', () => {
    expect(formatShortDate(createFormat(hass()), '2026-11-06')).toBe('6. nov');
    expect(formatShortDate(createFormat(hass({ language: 'en' })), '2026-11-06')).toMatch(/6 Nov|Nov 6/);
    expect(formatMonthShort(createFormat(hass()), '2026-03')).toBe('mar');
  });
  it('lists weekdays starting on Monday', () => {
    expect(weekdayNames(createFormat(hass({ language: 'en' })), 'long')[0]).toBe('Monday');
    expect(weekdayNames(createFormat(hass()), 'long')[5]).toBe('lørdag');
  });
});

describe('formatCountdown', () => {
  it('uses mm:ss under an hour', () => {
    expect(formatCountdown(1901)).toBe('31:41');
    expect(formatCountdown(65)).toBe('01:05');
    expect(formatCountdown(0)).toBe('00:00');
  });
  it('uses h:mm:ss from one hour', () => {
    expect(formatCountdown(3600)).toBe('1:00:00');
    expect(formatCountdown(3725)).toBe('1:02:05');
  });
  it('never goes negative', () => {
    expect(formatCountdown(-12)).toBe('00:00');
  });
});

describe('fixMojibake', () => {
  it('repairs UTF-8 decoded as Latin-1', () => {
    expect(fixMojibake('95Â° Normal')).toBe('95° Normal');
    expect(fixMojibake('Program 15, ExtraTÃ¸rt, 70Â°C')).toBe('Program 15, ExtraTørt, 70°C');
  });
  it('leaves clean text alone', () => {
    expect(fixMojibake('Tørretumbler 10')).toBe('Tørretumbler 10');
    expect(fixMojibake('Ã')).toBe('Ã');
  });
});

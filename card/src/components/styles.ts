import { css } from 'lit';

/** Design tokens. Declared on the host so every child component inherits them. */
export const tokens = css`
  :host {
    --ev-washer: #3b8cff;
    --ev-dryer: #ff8a3d;
    --ev-mangle: #9a7cf0;
    --ev-other: #8a94a6;
    --ev-free: #2fb67c;
    --ev-done: #f5a524;
    --ev-error: #e5484d;
    --ev-unknown: var(--disabled-text-color, #9aa0a6);
    --ev-text: var(--primary-text-color, #212121);
    --ev-text-2: var(--secondary-text-color, #727272);
    --ev-line: var(--divider-color, rgba(127, 127, 127, 0.25));
    --ev-surface: color-mix(in srgb, var(--ev-text) 4%, transparent);
    --ev-surface-2: color-mix(in srgb, var(--ev-text) 7%, transparent);
    --ev-radius: 18px;
    --ev-radius-sm: 12px;
  }
`;

export const base = css`
  :host {
    display: block;
    color: var(--ev-text);
    font-family: var(--paper-font-body1_-_font-family, var(--primary-font-family, inherit));
  }
  * {
    box-sizing: border-box;
  }
  svg {
    display: block;
  }
  .panel {
    background: var(--ev-surface);
    border: 1px solid color-mix(in srgb, var(--ev-line) 60%, transparent);
    border-radius: var(--ev-radius);
    padding: 16px;
    min-width: 0;
  }
  .label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ev-text-2);
  }
  .panel-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  .sub {
    font-size: 0.78rem;
    color: var(--ev-text-2);
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .t-washer {
    --accent: var(--ev-washer);
  }
  .t-dryer {
    --accent: var(--ev-dryer);
  }
  .t-mangle {
    --accent: var(--ev-mangle);
  }
  .t-other {
    --accent: var(--ev-other);
  }
`;

export const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      animation-delay: 0s !important;
      transition-duration: 0.001ms !important;
    }
  }
`;

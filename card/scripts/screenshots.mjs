// Renders the built bundle inside the dev harness and saves README screenshots.
// Usage: npm run build && npm run screenshots   (needs `npx playwright install chromium`)
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, '../docs/screenshots');
await mkdir(outDir, { recursive: true });

const shots = [
  { name: 'card-light-wide', query: 'theme=light&width=960' },
  { name: 'card-dark-wide', query: 'theme=dark&width=960' },
  { name: 'card-light-narrow', query: 'theme=light&width=400' },
  { name: 'card-dark-narrow', query: 'theme=dark&width=400' },
  { name: 'card-compact-dark', query: 'theme=dark&width=520&compact=1' },
  { name: 'card-english-light', query: 'theme=light&width=520&lang=en&m5=error' },
];

const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: true } });
await server.listen();
const browser = await chromium.launch();
try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: 1100, height: 900 },
      deviceScaleFactor: 1.5,
      locale: 'da-DK',
      timezoneId: 'Europe/Copenhagen',
    });
    page.on('pageerror', (e) => console.error('page error:', e.message));
    page.on('console', (m) => m.type() === 'error' && console.error('console error:', m.text()));
    await page.goto(`http://localhost:5199/dev/index.html?bundle=1&panel=0&poll=0&${shot.query}`);
    await page.waitForSelector('e-vaskeri-card');
    await page.waitForTimeout(2200);
    await page.locator('#mount').screenshot({ path: resolve(outDir, `${shot.name}.png`) });
    console.log('saved', shot.name);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}

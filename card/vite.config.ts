import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import { createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const outDir = resolve(__dirname, '../custom_components/e_vaskeri/www');
const bundle = resolve(outDir, 'e-vaskeri-card.js');

// Lets the dev harness load the *built* bundle (`/dev/index.html?bundle=1`).
const serveBuiltBundle = (): Plugin => ({
  name: 'serve-built-bundle',
  configureServer(server) {
    server.middlewares.use('/__bundle/e-vaskeri-card.js', (_req, res) => {
      if (!existsSync(bundle)) {
        res.statusCode = 404;
        res.end('Run `npm run build` first');
        return;
      }
      res.setHeader('Content-Type', 'text/javascript');
      createReadStream(bundle).pipe(res);
    });
  },
});

export default defineConfig({
  plugins: [serveBuiltBundle()],
  define: { 'process.env.NODE_ENV': '"production"' },
  server: { fs: { allow: [resolve(__dirname, '..')] } },
  build: {
    outDir,
    emptyOutDir: false,
    target: 'es2022',
    minify: 'esbuild',
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'e-vaskeri-card.js',
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
});

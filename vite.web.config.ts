import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

// Marketing + changelog website. Built separately from the userscript
// (see vite.config.ts) via `bun run build:web`, which also prerenders
// each route to static HTML (SSG) — see scripts/build-web.ts.
export default defineConfig({
  root: 'web',
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    // Shares dist/ with the userscript build, so never wipe it here — the
    // userscript build runs first and owns the clean.
    outDir: '../dist',
    emptyOutDir: false,
  },
})

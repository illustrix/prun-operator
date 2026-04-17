import { readFileSync } from 'node:fs'
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import monkey, { cdn } from 'vite-plugin-monkey'
import pkg from './package.json' with { type: 'json' }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    {
      name: 'html-version',
      generateBundle() {
        const html = readFileSync('index.html', 'utf-8').replace(
          /%APP_VERSION%/g,
          pkg.version,
        )
        this.emitFile({ type: 'asset', fileName: 'index.html', source: html })
      },
    },
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'PrUn Operator',
        namespace: 'https://explorer.auroras.xyz/',
        match: ['https://apex.prosperousuniverse.com/'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=prosperousuniverse.com',
        grant: 'none',
        updateURL: 'https://prop.auroras.xyz/prun-operator.user.js',
        downloadURL: 'https://prop.auroras.xyz/prun-operator.user.js',
      },
      build: {
        externalGlobals: {
          rxjs: cdn.unpkg('rxjs', 'dist/bundles/rxjs.umd.min.js'),
          preact: cdn.unpkg('preact', 'dist/preact.min.js'),
        },
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        minify: true,
      },
    },
  },
})

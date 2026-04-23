import { readFileSync } from 'node:fs'
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import monkey, { cdn } from 'vite-plugin-monkey'
import pkg from './package.json' with { type: 'json' }

// Identity follows Cloudflare's ENVIRONMENT var — `staging` produces a
// Testing userscript that Tampermonkey treats as a separate install;
// anything else (or unset) produces the stable one.
const isTesting = process.env.ENVIRONMENT === 'staging'

const STABLE_URL = 'https://prop.auroras.xyz/prun-operator.user.js'
const TESTING_URL = 'https://prop-testing.auroras.xyz/prun-operator.user.js'
const UPDATE_URL = isTesting ? TESTING_URL : STABLE_URL

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
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
        name: isTesting ? 'PrUn Operator (Testing)' : 'PrUn Operator',
        namespace: isTesting
          ? 'https://prop-testing.auroras.xyz/'
          : 'https://explorer.auroras.xyz/',
        match: ['https://apex.prosperousuniverse.com/'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=prosperousuniverse.com',
        grant: 'none',
        updateURL: UPDATE_URL,
        downloadURL: UPDATE_URL,
      },
      build: {
        externalGlobals: {
          rxjs: cdn.unpkg('rxjs', 'dist/bundles/rxjs.umd.min.js'),
        },
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        minify: mode === 'production',
      },
    },
  },
}))

import { defineConfig } from 'vite'
import monkey, { cdn } from 'vite-plugin-monkey'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
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

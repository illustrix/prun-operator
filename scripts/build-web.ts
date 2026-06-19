import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { build } from 'vite'

// SSG pipeline: build the client bundle, build an SSR bundle of the same
// app, then render each route to a static HTML file using the client
// build's index.html as the template. Two-pass build keeps it free of any
// third-party SSG dependency.

const root = resolve(import.meta.dirname, '..')
const configFile = resolve(root, 'vite.web.config.ts')
const dist = resolve(root, 'dist')
const ssrDir = resolve(dist, '.ssr')

// path → output file (relative to dist) + <title>.
const routes = [
  { path: '/', out: 'index.html', title: 'PrUn Operator' },
  {
    path: '/changelog',
    out: 'changelog/index.html',
    title: 'Changelog · PrUn Operator',
  },
]

async function run() {
  // 1. Client build → dist/index.html (template) + hashed assets.
  await build({ configFile })

  // 2. SSR build of the server entry → dist/.ssr/entry-server.js.
  await build({
    configFile,
    build: {
      ssr: resolve(root, 'web/entry-server.tsx'),
      outDir: ssrDir,
      emptyOutDir: true,
    },
  })

  // 3. Prerender every route, reusing the client template.
  const template = readFileSync(resolve(dist, 'index.html'), 'utf-8')
  const { render } = (await import(resolve(ssrDir, 'entry-server.js'))) as {
    render: (url: string) => string
  }

  for (const route of routes) {
    const html = template
      .replace('<!--app-html-->', render(route.path))
      .replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
    const outPath = resolve(dist, route.out)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, html)
    console.log(`prerendered ${route.path} → dist/${route.out}`)
  }

  // 4. Drop the SSR temp output; only the static HTML ships.
  rmSync(ssrDir, { recursive: true, force: true })
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})

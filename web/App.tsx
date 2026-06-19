import { Layout } from './components/Layout'
import { Changelog } from './pages/Changelog'
import { Home } from './pages/Home'

// Routes prerendered by scripts/build-web.ts. Navigation uses plain
// anchors (full page loads) since every route is a static page.
export const routes = ['/', '/changelog'] as const

export function App({ url }: { url: string }) {
  const path = url.replace(/\/+$/, '') || '/'
  const page = path === '/changelog' ? <Changelog /> : <Home />
  return <Layout path={path}>{page}</Layout>
}

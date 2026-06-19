import { renderToString } from 'react-dom/server'
import { App } from './App'

// Called by scripts/build-web.ts for each route during prerender.
export function render(url: string): string {
  return renderToString(<App url={url} />)
}

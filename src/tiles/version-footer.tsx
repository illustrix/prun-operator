import { createRoot } from 'react-dom/client'

// Show the PrUn Operator version in the game's frame footer
// (`[class*="Frame__foot"]`). The footer renders once for the app shell,
// but it can re-mount, so this is idempotent and re-runs on every scan.

const MARKER_ATTR = 'data-prun-operator-indicator'

const VersionLabel = () => {
  return (
    <a
      href="https://prop.auroras.xyz"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#5dc9ff',
        marginRight: 8,
        whiteSpace: 'nowrap',
        fontSize: 11,
        fontFamily: `'Droid Sans', sans-serif`,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      PrUn Operator {__APP_VERSION__}
      {__IS_DEV__ && ` (built ${new Date(__BUILD_TIME__).toLocaleString()})`}
    </a>
  )
}

export const ensureVersionLabel = () => {
  const foot = document.querySelector('[class*="Frame__foot"]')
  if (!foot) return
  if (foot.querySelector(`[${MARKER_ATTR}]`)) return

  const mount = document.createElement('div')
  mount.setAttribute(MARKER_ATTR, 'true')
  const span = foot.querySelector('span')
  foot.insertBefore(mount, span ? span.nextSibling : null)

  createRoot(mount).render(<VersionLabel />)
}

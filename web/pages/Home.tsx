const STABLE_URL = 'https://prop.auroras.xyz/prun-operator.user.js'
const TESTING_URL = 'https://prop-testing.auroras.xyz/prun-operator.user.js'
const TAMPERMONKEY = 'https://www.tampermonkey.net/'
const VIOLENTMONKEY = 'https://violentmonkey.github.io/'

const FEATURES = [
  {
    icon: '✎',
    title: 'Contract Draft Auto-Fill',
    body: 'Paste a JSON config and auto-populate template, currency, commodities, prices, and location in one click.',
  },
  {
    icon: '⚡',
    title: 'Contract Auto-Fulfill',
    body: 'Automatically clicks all available "fulfill" buttons on a contract tile.',
  },
  {
    icon: '⛽',
    title: 'Ship Auto-Refuel',
    body: 'Automatically refuels ships by filling the required amounts of fuel and propellant with a single click.',
  },
  {
    icon: '📋',
    title: 'Copy Sell Contract',
    body: "Export a warehouse's outputs (or only the items marked in Refined PrUn) to the clipboard as a ready-to-paste contract draft config.",
  },
  {
    icon: '🔥',
    title: 'Burn Auto Provisioning',
    body: "Reads a BURN tile's consumption table, computes the quantities needed for a chosen number of days (optionally netting current inventory), and exports the shopping list as an XIT ACT supply cart or as a BUY contract draft config.",
  },
  {
    icon: '🔁',
    title: 'Auto XIT ACT',
    body: 'Adds the missing XIT ACT auto button so you can buy commodities in bulk fully automatically.',
  },
  {
    icon: '🔍',
    title: 'Tile-Aware',
    body: 'Automatically detects and enhances relevant tiles as they appear, with no manual setup required.',
  },
]

const ExtLink = ({ href, children }: { href: string; children: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener"
    className="text-blue-500 hover:underline"
  >
    {children}
  </a>
)

export function Home() {
  return (
    <div className="space-y-14">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">
          PrUn <span className="text-blue-500">Operator</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          An automation tool for Prosperous Universe. Auto-fill contract drafts,
          auto-fulfill contracts, and more.
        </p>
        <span className="mt-4 inline-block rounded-full border border-[#1e3a5f] bg-[#0d1b2a] px-3 py-1 text-xs text-blue-400">
          latest updated: {__APP_VERSION__}
        </span>
      </section>

      <section className="text-center">
        <a
          href={STABLE_URL}
          target="_blank"
          rel="noopener"
          className="inline-block rounded-lg bg-blue-600 px-9 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          Install Userscript
        </a>
        <p className="mt-3 text-sm text-slate-500">
          Requires a userscript manager like{' '}
          <ExtLink href={TAMPERMONKEY}>Tampermonkey</ExtLink> or{' '}
          <ExtLink href={VIOLENTMONKEY}>Violentmonkey</ExtLink>.
        </p>
      </section>

      <section>
        <h2 className="mb-4 border-b border-[#1a2332] pb-2 text-lg font-semibold text-slate-100">
          Features
        </h2>
        <ul className="divide-y divide-[#111a27]">
          {FEATURES.map(feature => (
            <li key={feature.title} className="flex gap-3 py-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-[#111a27] text-sm">
                {feature.icon}
              </div>
              <p className="leading-relaxed">
                <strong className="text-slate-100">{feature.title}</strong> —{' '}
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 border-b border-[#1a2332] pb-2 text-lg font-semibold text-slate-100">
          Getting Started
        </h2>
        <ol className="list-inside list-decimal space-y-3 leading-relaxed marker:text-blue-400">
          <li>
            Install <ExtLink href={TAMPERMONKEY}>Tampermonkey</ExtLink> or{' '}
            <ExtLink href={VIOLENTMONKEY}>Violentmonkey</ExtLink> in your
            browser.
          </li>
          <li>
            Click the{' '}
            <strong className="text-slate-100">Install Userscript</strong>{' '}
            button above. The userscript manager will prompt you to confirm.
            <p className="mt-1.5 text-sm text-slate-500">
              If the install prompt doesn't appear, right-click the button and
              copy the link. Then open your userscript manager's dashboard,
              click "Create a new script", paste the copied URL's content into
              the editor, and save.
            </p>
          </li>
          <li>
            Open{' '}
            <ExtLink href="https://apex.prosperousuniverse.com/">
              Prosperous Universe
            </ExtLink>
            . Enhanced controls appear automatically on supported tiles.
          </li>
        </ol>
      </section>

      <section className="rounded-md border border-dashed border-[#2a3548] bg-[#0f1722] p-5">
        <h2 className="mb-2.5 text-base font-semibold text-slate-400">
          Testing Build
        </h2>
        <p className="mb-3 text-sm leading-relaxed text-slate-500">
          Prefer living on the edge? The testing build ships new features first
          — before they reach the stable channel. It may contain bugs,
          half-finished work, or changes that get rolled back. Use at your own
          risk, and please report anything that looks off.
        </p>
        <a
          href={TESTING_URL}
          target="_blank"
          rel="noopener"
          className="inline-block rounded-md border border-[#2a3548] bg-[#1a2332] px-3.5 py-1.5 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200"
        >
          Install testing build
        </a>
      </section>
    </div>
  )
}

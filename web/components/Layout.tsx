import type { ReactNode } from 'react'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/changelog', label: 'Changelog' },
]

export function Layout({
  path,
  children,
}: {
  path: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0e17] text-slate-300">
      <header className="border-b border-[#1a2332] bg-gradient-to-b from-[#101828] to-[#0a0e17]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="PrUn Operator" className="h-9 w-9" />
            <span className="text-lg font-bold text-slate-100">
              PrUn <span className="text-blue-500">Operator</span>
            </span>
          </a>
          <nav className="flex items-center gap-1">
            {NAV.map(item => {
              const active =
                item.href === '/' ? path === '/' : path.startsWith(item.href)
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'bg-[#1a2332] text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-[#111a27] px-6 py-6 text-center text-xs text-slate-600">
        Built by{' '}
        <a
          className="text-slate-500 hover:text-slate-300"
          href="https://explorer.auroras.xyz/"
        >
          Auroras Explorer
        </a>{' '}
        ·{' '}
        <a
          className="text-slate-500 hover:text-slate-300"
          href="https://github.com/illustrix/prun-operator"
          target="_blank"
          rel="noopener"
        >
          Source on GitHub
        </a>{' '}
        · Use at your own risk
      </footer>
    </div>
  )
}

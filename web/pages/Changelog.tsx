import { releases } from '../changelog'

const SECTION_COLOR: Record<string, string> = {
  Added: 'text-emerald-400',
  Changed: 'text-blue-400',
  Fixed: 'text-amber-400',
  Removed: 'text-rose-400',
}

export function Changelog() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-100">
        Changelog
      </h1>
      <p className="mt-2 text-slate-400">
        All notable changes to PrUn Operator. Date-based versioning
        (YYYY-MM-DD).
      </p>

      <div className="mt-10 space-y-10">
        {releases.map(release => (
          <section key={release.version}>
            <h2 className="border-b border-[#1a2332] pb-2 font-mono text-xl font-semibold text-blue-500">
              {release.version}
            </h2>
            <div className="mt-4 space-y-5">
              {release.sections.map(section => (
                <div key={section.title}>
                  <h3
                    className={`text-sm font-semibold uppercase tracking-wide ${
                      SECTION_COLOR[section.title] ?? 'text-slate-400'
                    }`}
                  >
                    {section.title}
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1.5 leading-relaxed text-slate-300 marker:text-slate-600">
                    {section.items.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

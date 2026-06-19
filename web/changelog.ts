import raw from '../CHANGELOG.md?raw'

export interface ChangelogSection {
  title: string
  items: string[]
}

export interface ChangelogRelease {
  version: string
  sections: ChangelogSection[]
}

// Parse the Keep-a-Changelog formatted CHANGELOG.md into structured
// releases: `## [version]` → release, `### Title` → section, `- item`.
export function parseChangelog(md: string): ChangelogRelease[] {
  const releases: ChangelogRelease[] = []
  let release: ChangelogRelease | null = null
  let section: ChangelogSection | null = null

  for (const line of md.split('\n')) {
    const version = line.match(/^##\s+\[([^\]]+)\]/)
    if (version?.[1]) {
      release = { version: version[1], sections: [] }
      releases.push(release)
      section = null
      continue
    }
    const heading = line.match(/^###\s+(.+)/)
    if (heading?.[1] && release) {
      section = { title: heading[1].trim(), items: [] }
      release.sections.push(section)
      continue
    }
    const item = line.match(/^[-*]\s+(.+)/)
    if (item?.[1] && section) {
      section.items.push(item[1].trim())
    }
  }
  return releases
}

export const releases = parseChangelog(raw)

# Changelog

All notable changes to PrUn Operator are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses date-based versioning (`YYYY-MM-DD`).

## [2026-05-29]

### Added
- SNG Auto Send Contract: send supply and submit contracts for every base that needs them in one click, skipping bases with a matching contract already in progress.
- Overall progress bar in the loading overlay, shown while Auto Send Contract runs.

## [2026-05-24]

### Added
- Support setting a contract deadline (time limit) when drafting contracts.
- SNG dry run via Command-click — preview a supply flow without submitting.
- SNG supply minimum batch for trickle materials.

## [2026-05-20]

### Fixed
- Wait for the matching location result before clicking, avoiding mis-clicks while search results settle.

### Changed
- Renamed the Wrangler config to `prun-operator`.

## [2026-05-10]

### Added
- SNG auto-submit excludes, configurable globally and per-base.

## [2026-05-08]

### Added
- SNG draft auto-rename.

### Changed
- Normalize addresses in settings.

## [2026-05-05]

### Added
- BRA "Copy XIT" for repair materials.
- Confirmation modal and roadmap.

### Changed
- Warn before running Auto Fulfill.

## [2026-04-27]

### Fixed
- `normalizeAddress` regex correctness.

### Changed
- Tidied up SNG flows.

## [2026-04-26]

### Added
- SNG auto-submit and bulk auto-fulfill.
- Burn-auto material picker.

## [2026-04-23]

### Added
- SNG dashboard.
- SNG auto-supply end-to-end flow, with existing-contract awareness.
- Settings import.
- Burn auto-balance mode.
- Toast notifications and a draggable modal.
- Testing-build section on the landing page.
- Staging deploy channel.

### Changed
- Migrated styling to CSS Modules.
- Refactored the tool attachment system; introduced a `Tile` wrapper that lazy-attaches the tool container, plus a new `SngAutoTool`.

## [2026-04-22]

### Added
- "Auto XIT ACT" entry on the landing page.

## [2026-04-21]

### Fixed
- Match tile commands case-insensitively.

## [2026-04-20]

### Added
- Apache 2.0 `LICENSE`.
- `CONTRIBUTING.md` and a contributing guide in the README.

## [2026-04-19]

### Added
- BurnAuto modal with supply-order export.

### Fixed
- Improved address parsing case-sensitivity and tool-attachment safety.
- Updated the tile selector to use `TileFrame__frame`; refined the BurnAuto layout.

## [2026-04-17]

### Added
- Version string injected into the landing page.
- Integrated Preact.

## [2026-04-15]

### Added
- Support copying a sell contract.

## [2026-04-08]

### Fixed
- Tile command matching.

## [2026-04-06]

### Added
- Automatic ship refueling.
- Cloudflare Wrangler integration.

### Changed
- Refactored to a modern build system with TypeScript.

## [2026-03-30]

### Added
- Cloudflare Workers configuration.
- Publish page.
- Moved the project into a subdirectory.

## [2026-03-29]

### Added
- Initial release.

# Contributing

Thanks for your interest in improving prun-operator!

## Prerequisites

- [Bun](https://bun.sh/)
- [Violentmonkey](https://violentmonkey.github.io/) (recommended over Tampermonkey — it auto-reloads the userscript when the dev server rebuilds)

## Setup

```sh
bun install
bun dev
```

`bun dev` starts Vite with [`vite-plugin-monkey`](https://github.com/lisonge/vite-plugin-monkey). On first run, open the printed URL to install the dev userscript into Violentmonkey. After that, edits to `src/` rebuild automatically and the script reloads in the browser on your next navigation/refresh of `https://apex.prosperousuniverse.com/`.

## Project layout

```
src/
  main.ts       # entry — wires up the MutationObserver
  tiles/        # per-tile enhancements (one module per tile type)
  components/   # Preact UI used inside injected tiles
  tools/        # cross-tile features (e.g. copy sell contract)
  utils/        # DOM helpers, React-safe input simulation, etc.
```

See `CLAUDE.md` for architecture notes — tile matching, React-controlled input simulation, and CSS class substring selectors.

## Build

```sh
bun run build
```

Outputs the userscript to `dist/prun-operator.user.js`.

## Code style

Biome handles formatting and linting:

```sh
bunx biome check --write .
```

## Pull requests

- Keep PRs focused — one feature or fix per PR.
- Run `bunx biome check --write .` and `bun run build` before submitting.
- If you're adding support for a new tile type, follow the pattern in `src/tiles/` and register the handler in `src/tiles/index.ts`.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](./LICENSE).

# prun-operator

A Tampermonkey/Violentmonkey userscript for [Prosperous Universe](https://apex.prosperousuniverse.com/).

See the [project page](https://prop.auroras.xyz/) for installation instructions.

## Features

- **Contract Draft Auto-Fill** — Paste a JSON config and auto-populate template, currency, commodities, prices, location, and recipient in one click.
- **Contract Auto-Fulfill** — Automatically clicks all available "fulfill" buttons on a contract tile.
- **Ship Auto-Refuel** — Automatically refuels ships by filling the required amounts of fuel and propellant with a single click.
- **Copy Sell Contract** — Export a warehouse's outputs (or only items marked in Refined PrUn) to the clipboard as a ready-to-paste contract draft config.
- **Burn Auto Provisioning** — Reads a BURN tile's consumption table, computes the quantities needed (fixed days or auto-balanced policy), lets you pick which materials to include, and exports the shopping list as an XIT ACT supply cart or a BUY contract draft.
- **Auto XIT ACT** — Adds a missing auto button to XIT ACT tiles so you can buy commodities in bulk fully automatically.
- **SNG Auto** — Aggregates connected SNG bases (from open XIT BURN tiles) into a single panel showing supply/output days, flagging bases that need supply or submission. One-click auto-supply (BUY contract) and auto-submit (SELL contract) per base, plus bulk Auto Fulfill across all bases. Per-base currency/recipient and per-ticker pricing in settings.
- **Tile-Aware** — Automatically detects and enhances relevant tiles as they appear, with no manual setup required.

## Roadmap

- [ ] Auto-buy repairing materials.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[Apache License 2.0](./LICENSE)

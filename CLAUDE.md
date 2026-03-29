# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PrUn Operator is a Tampermonkey userscript that automates tasks in [Prosperous Universe](https://apex.prosperousuniverse.com/) (PrUn), a browser-based space economy game. It enhances the game's tile-based UI by injecting controls for auto-filling contract drafts and auto-fulfilling contracts.

## Architecture

The entire script lives in `prun-operator.user.js` — a single IIFE with no build step or dependencies.

### Key patterns

- **Tile processing via MutationObserver**: A `MutationObserver` on `document.body` calls `scanTiles()` on every DOM mutation. It finds elements matching `[class*="Tile__tile"]`, processes each once (tracked by `data-prun-operator` attribute), and enhances matching tiles.
- **Tile identification**: Tiles are identified by their title text (`TileFrame__title`) or command (`TileFrame__cmd`). New tile types are handled by adding branches in `processTile()`.
- **Simulated input**: The game uses React, so native `value` setters must be used to trigger framework reactivity (`simulateInput`, `simulateSelect`). Direct `.value =` assignment won't work.
- **CSS class matching**: PrUn uses hashed CSS class names (e.g., `Tile__tile___abc123`). All selectors use `[class*="ClassName__part"]` substring matching.
- **Sequential automation with sleep**: Multi-step flows (like `autoSetContract`) use `await sleep(ms)` between steps to let the game UI update.

### Core utilities

| Function | Purpose |
|---|---|
| `simulateInput` / `simulateSelect` | Set values on React-controlled inputs |
| `getButtonWithText` / `getElementWithText` | Query elements by text content |
| `waitForElement` | Poll for an element with timeout |
| `sleep` | Promise-based delay |

## Development

No build tools. Edit `prun-operator.user.js` directly and reload in Tampermonkey. The `tmp/` directory contains scratch data files.

## Target site

- URL: `https://apex.prosperousuniverse.com/`
- The game is a React SPA with hashed CSS class names — never rely on exact class strings, always use substring selectors.

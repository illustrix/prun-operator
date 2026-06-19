#!/usr/bin/env bash
# Build the userscript AND the website for the wrangler env matching the
# current git branch. `main` → production, everything else → staging.
# `ENVIRONMENT` is exported so vite.config.ts can flip the userscript
# identity. Both builds output into dist/.
set -euo pipefail

branch="${CF_PAGES_BRANCH:-${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}}"

if [ "$branch" = "main" ]; then
  env="production"
else
  env="staging"
fi

export ENVIRONMENT="$env"
echo "branch: $branch → ENVIRONMENT=$env"

# Userscript build runs first: it cleans dist/ and emits the .user.js.
bun run build
# Website build runs second with emptyOutDir disabled, adding the static
# (SSG) site alongside the userscript in dist/.
bun run build:web

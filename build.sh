#!/usr/bin/env bash
# Build the userscript for the wrangler env matching the current git
# branch. `main` → production, everything else → staging. `ENVIRONMENT`
# is exported so vite.config.ts can flip the userscript identity.
set -euo pipefail

branch="${CF_PAGES_BRANCH:-${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}}"

if [ "$branch" = "main" ]; then
  env="production"
else
  env="staging"
fi

export ENVIRONMENT="$env"
echo "branch: $branch → ENVIRONMENT=$env"

exec bun run build

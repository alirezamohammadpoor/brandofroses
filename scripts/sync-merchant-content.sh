#!/usr/bin/env bash
# Sync merchant-managed content (menus, section settings, page layouts) from a
# source Shopify theme to a target theme, without affecting git state.
#
# Why: staging + production stay in sync via GitHub Integration, but the `dev`
# theme (and any ad-hoc themes) drift. Run this when you want `dev` to reflect
# whatever the client has configured on production or staging.
#
# Usage:
#   scripts/sync-merchant-content.sh              # prod -> dev (default)
#   scripts/sync-merchant-content.sh staging dev  # explicit source / target
#
# Requires `shopify.theme.toml` entries for source and target env names.

set -euo pipefail

SOURCE_ENV="${1:-production}"
TARGET_ENV="${2:-dev}"

# Files treated as merchant content. Keep in sync with `.shopifyignore`.
FILES=(
  "config/settings_data.json"
  "templates/*.json"
  "templates/**/*.json"
)

echo "=> Source: $SOURCE_ENV"
echo "=> Target: $TARGET_ENV"
echo

if [[ -n "$(git status --porcelain config/settings_data.json templates/ 2>/dev/null || true)" ]]; then
  echo "Refusing to run: config/settings_data.json or templates/ have uncommitted changes."
  echo "Stash or commit them first — this script overwrites local merchant files during the sync."
  exit 1
fi

echo "=> Pulling merchant content from '$SOURCE_ENV'..."
ONLY_ARGS=()
for f in "${FILES[@]}"; do ONLY_ARGS+=(--only "$f"); done

shopify theme pull -e "$SOURCE_ENV" "${ONLY_ARGS[@]}"

echo
echo "=> Pushing merchant content to '$TARGET_ENV'..."
shopify theme push -e "$TARGET_ENV" --nodelete "${ONLY_ARGS[@]}"

echo
echo "=> Restoring local files to their committed state..."
git checkout -- config/settings_data.json templates/

echo
echo "Done. '$TARGET_ENV' now mirrors '$SOURCE_ENV' merchant content."

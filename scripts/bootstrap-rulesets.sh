#!/usr/bin/env bash
# Bootstrap branch protection rulesets on a GitHub repo from JSON definitions.
#
# Reads every .json file in .github/rulesets/ and POSTs it to the target
# repository's /rulesets endpoint via gh api. Idempotent: if a ruleset with
# the same name already exists, it PUTs (updates) instead.
#
# Usage:
#   scripts/bootstrap-rulesets.sh <owner>/<repo>
#
# Example:
#   scripts/bootstrap-rulesets.sh acme/brand-of-roses
#
# Requirements:
# - `gh` CLI authenticated with a user that has admin rights on the target repo
# - `jq` available on PATH

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $(basename "$0") <owner>/<repo>" >&2
  exit 2
fi

readonly TARGET="$1"
readonly RULESETS_DIR="$(dirname "$0")/../.github/rulesets"

if [[ ! -d "$RULESETS_DIR" ]]; then
  echo "no rulesets directory at $RULESETS_DIR" >&2
  exit 1
fi

# List existing rulesets once so we can detect updates vs creates.
# Coerce to an array even if the endpoint returns an error object (e.g. empty
# repo, or a plan that doesn't support rulesets — in which case a later POST
# surfaces the real error message with exit).
existing_raw="$(gh api "repos/${TARGET}/rulesets" 2>/dev/null || echo "[]")"
existing_json="$(printf '%s' "$existing_raw" | jq 'if type == "array" then . else [] end')"

shopt -s nullglob
for file in "$RULESETS_DIR"/*.json; do
  name="$(jq -r '.name' "$file")"

  existing_id="$(printf '%s' "$existing_json" | jq -r --arg n "$name" '.[] | select(.name == $n) | .id' | head -1)"

  if [[ -n "$existing_id" ]]; then
    echo "→ updating ruleset '$name' (id=$existing_id) on $TARGET"
    gh api -X PUT "repos/${TARGET}/rulesets/${existing_id}" --input "$file" >/dev/null
  else
    echo "→ creating ruleset '$name' on $TARGET"
    gh api -X POST "repos/${TARGET}/rulesets" --input "$file" >/dev/null
  fi
done

echo "done."

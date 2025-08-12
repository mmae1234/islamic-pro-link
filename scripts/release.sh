#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/release.sh v1.4.2 "Your release title" "Your release notes"
# Requires a clean git working tree and push permissions.

VERSION=${1:-}
TITLE=${2:-$1}
NOTES=${3:-}

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 vX.Y.Z [title] [notes]" >&2
  exit 1
fi

if ! git diff --quiet; then
  echo "Working tree not clean. Commit or stash changes first." >&2
  exit 1
fi

echo "Tagging $VERSION..."

git tag -a "$VERSION" -m "$TITLE"${NOTES:+ -m "$NOTES"}

echo "Pushing tag..."

git push origin "$VERSION"

echo "Done. Optionally create a GitHub Release using the CHANGELOG entry."

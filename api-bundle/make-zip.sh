#!/usr/bin/env sh
# Builds tiny-api.zip for the front end course: the API source, Dockerfile,
# compose file and a usage README. Students only need Docker to run it.
#
#   pnpm dock:zip        (or: sh api-bundle/make-zip.sh, from tiny-back/)
set -eu

out="$(pwd)/tiny-api.zip"
tmp="$(mktemp -d)"
dir="$tmp/tiny-api"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$dir"
cp -r src package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json \
  nest-cli.json Dockerfile .dockerignore "$dir/"
cp docker-compose.api.yaml "$dir/docker-compose.yaml"
cp api-bundle/README.md "$dir/README.md"

# Tests aren't needed to run the API.
find "$dir/src" -name '*.spec.ts' -delete
rm -rf "$dir/src/test"

rm -f "$out"
(cd "$tmp" && zip -rq "$out" tiny-api)
echo "Created $out"

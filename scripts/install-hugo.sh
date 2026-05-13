#!/usr/bin/env bash
set -euo pipefail

HUGO_VERSION="${HUGO_VERSION:-0.148.1}"
ARCH="Linux-64bit"
URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_${ARCH}.tar.gz"
TMP_DIR=$(mktemp -d)
trap "rm -rf \"$TMP_DIR\"" EXIT

curl -L "$URL" | tar -xz -C "$TMP_DIR" hugo
mkdir -p node_modules/.bin
mv "$TMP_DIR/hugo" node_modules/.bin/hugo
chmod +x node_modules/.bin/hugo

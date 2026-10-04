#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_VERSION="v24.21.0"
NODE_DIR="$ROOT_DIR/.tools/node-$NODE_VERSION"

if command -v node >/dev/null 2>&1; then
  exec "$@"
fi

if [[ ! -x "$NODE_DIR/bin/node" ]]; then
  mkdir -p "$NODE_DIR"
  ARCHIVE="$(mktemp -t accesspath-node.XXXXXX.tar.gz)"
  curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-darwin-arm64.tar.gz" -o "$ARCHIVE"
  tar -xzf "$ARCHIVE" -C "$NODE_DIR" --strip-components=1
  rm -f "$ARCHIVE"
fi

PATH="$NODE_DIR/bin:$PATH" exec "$@"

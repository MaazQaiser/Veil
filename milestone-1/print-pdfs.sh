#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
HTML="$ROOT/html"
PDF="$ROOT/pdf"
mkdir -p "$PDF"

if [[ ! -x "$CHROME" ]]; then
  echo "Google Chrome not found at $CHROME" >&2
  exit 1
fi

print_one() {
  local id="$1"
  local src="$HTML/${id}.html"
  local dest="$PDF/${id}.pdf"
  echo "Printing $id ..."
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-pdf-header-footer \
    --virtual-time-budget=15000 \
    --run-all-compositor-stages-before-draw \
    --print-to-pdf="$dest" \
    "file://${src}"
}

print_one "00-owner-brief"
print_one "01-framing"
print_one "02-foundation"
print_one "03-doors-and-locks"
print_one "04-utilities"
print_one "05-punch-list"
print_one "06-blueprint"

ls -lh "$PDF"

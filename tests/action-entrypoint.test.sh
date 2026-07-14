#!/bin/sh
set -eu

WORKDIR=$(pwd)
cd "$WORKDIR"

export INPUT_FAIL-ON=partial
export INPUT_INPUT-PATH=tests/fixtures/e2e/simple-item.yml
export INPUT_OUTPUT-DIR=dist/action-test-out
export INPUT_OUTPUT-NAME=test-output
export INPUT_REPORT-FORMAT=markdown
export GITHUB_OUTPUT="$WORKDIR/dist/action-test-output.txt"

mkdir -p "$WORKDIR/dist/action-test-out"

sh action/entrypoint.sh

if [ ! -f "$GITHUB_OUTPUT" ]; then
  echo "GITHUB_OUTPUT was not written" >&2
  exit 1
fi

if ! grep -q '^partial-count=' "$GITHUB_OUTPUT"; then
  echo "expected partial-count output" >&2
  cat "$GITHUB_OUTPUT" >&2
  exit 1
fi

echo "entrypoint env handling test passed"

#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CLI_PATH="$PROJECT_ROOT/dist/src/cli/index.js"

INPUT_PATH="${1:-./input}"
OUTPUT_DIR="${2:-./output}"
OUTPUT_NAME="${3:-output}"
REPORT_FORMAT="${4:-markdown}"
FAIL_ON="${5:-NONE}"

mkdir -p "$OUTPUT_DIR"
RESULT=$(node "$CLI_PATH" --input "$INPUT_PATH" --output-dir "$OUTPUT_DIR" --output-name "$OUTPUT_NAME" --report-format "$REPORT_FORMAT" --fail-on "$FAIL_ON")

echo "$RESULT" 1>&2

node - "$RESULT" <<'NODE'
const fs = require('fs');
const output = JSON.parse(process.argv[2]);
const lines = [
  `mcpack-path=${output.outputPath}`,
  `report-path=${output.reportPath}`,
  `full-count=${output.counts.FULL ?? 0}`,
  `partial-count=${output.counts.PARTIAL ?? 0}`,
  `manual-required-count=${output.counts.MANUAL_REQUIRED ?? 0}`,
  `impossible-count=${output.counts.IMPOSSIBLE ?? 0}`
];
fs.writeFileSync(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n');
NODE

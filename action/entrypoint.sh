#!/bin/sh
set -eu

INPUT_PATH="${1:-./input}"
OUTPUT_DIR="${2:-./output}"
OUTPUT_NAME="${3:-output}"
REPORT_FORMAT="${4:-markdown}"
FAIL_ON="${5:-NONE}"

INPUT_PATH="${INPUT_PATH:-./input}"
OUTPUT_DIR="${OUTPUT_DIR:-./output}"
OUTPUT_NAME="${OUTPUT_NAME:-output}"
REPORT_FORMAT="${REPORT_FORMAT:-markdown}"
FAIL_ON="${FAIL_ON:-NONE}"

mkdir -p "$OUTPUT_DIR"
RESULT=$(node /app/dist/src/cli/index.js --input "$INPUT_PATH" --output-dir "$OUTPUT_DIR" --output-name "$OUTPUT_NAME" --report-format "$REPORT_FORMAT" --fail-on "$FAIL_ON")

echo "$RESULT" 1>&2

node <<'NODE' "$RESULT"
const fs = require('fs');
const output = JSON.parse(process.argv[1]);
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

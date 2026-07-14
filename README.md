# ItemsAdder to Bedrock Action

This repository provides a GitHub Action and standalone CLI for converting ItemsAdder configuration files into a Bedrock resource and behavior package. The converter is intended to run inside a CI workflow, producing a `.mcpack` artifact and a compatibility report entirely within the repository workspace.

## What it does

The tool reads ItemsAdder YAML configuration, builds an internal intermediate representation, performs conversion logic for items and blocks, and writes results into a Bedrock-compatible package. The implementation is split into independent pipeline stages so parsing, transformation, and packaging can be tested separately.

## Compatibility categories

Each asset is assigned one of four compatibility statuses:

- `FULL` — asset is automatically convertible with no meaningful loss.
- `PARTIAL` — asset is convertible but may lose fidelity.
- `MANUAL_REQUIRED` — asset can be converted structurally but requires manual follow-up work.
- `IMPOSSIBLE` — asset has no valid Bedrock equivalent.

The compatibility report is generated from the intermediate representation and is intended to make limitations explicit rather than hiding them.

## GitHub Action usage

```yaml
name: Convert ItemsAdder config
on:
  workflow_dispatch:

jobs:
  convert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.
        with:
          input-path: ./tests/fixtures/parser/simple-item.yml
          output-dir: ./out
          output-name: demo
          report-format: json
          fail-on: NONE
      - uses: actions/upload-artifact@v4
        with:
          name: bedrock-output
          path: ./out
```

## Inputs

| Input | Required | Description |
| --- | --- | --- |
| `input-path` | Yes | Path to a YAML input file or directory to convert. |
| `output-dir` | No | Output directory for generated files. |
| `output-name` | No | Base filename for generated artifact and report. |
| `report-format` | No | Format for the generated compatibility report (`json`). |
| `fail-on` | No | Fail the step if any asset meets or exceeds the specified severity. |

## Outputs

| Output | Description |
| --- | --- |
| `mcpack-path` | Path to the generated `.mcpack` archive. |
| `report-path` | Path to the generated compatibility report. |
| `full-count` | Number of assets classified as `FULL`. |
| `partial-count` | Number of assets classified as `PARTIAL`. |
| `manual-required-count` | Number of assets classified as `MANUAL_REQUIRED`. |
| `impossible-count` | Number of assets classified as `IMPOSSIBLE`. |

## fail-on behavior

The CLI supports a `fail-on` threshold to fail the workflow when asset severity is too high.

- `NONE` — never fail based on compatibility.
- `PARTIAL` — fail if any asset is `PARTIAL` or worse.
- `MANUAL_REQUIRED` — fail if any asset is `MANUAL_REQUIRED` or worse.
- `IMPOSSIBLE` — fail if any asset is `IMPOSSIBLE`.

The CLI uses exit code `2` for validation failures, `3` when the `fail-on` threshold is exceeded, and `1` for internal errors.

## Known limitations

This repository implements the conversion pipeline as a foundation. It does not currently provide full production-grade conversion for all ItemsAdder features.

Known gaps include:

- no complete Java-to-Bedrock geometry conversion for arbitrary Blockbench models
- no full UV remapping for Bedrock texture atlases
- no full Bedrock behavior pack component mapping for complex custom items and blocks
- no translation of plugin-specific interaction logic such as custom click handlers or complex redstone behavior

The report captures limitations explicitly rather than dropping unsupported assets silently.

## Local development

```bash
npm install
npm test
npm run build
node dist/src/cli/index.js --input tests/fixtures/parser/simple-item.yml --output-dir dist/out --output-name demo --report-format json --fail-on NONE
```

## Docker Compose

A local test mode is available in `docker-compose.yml`.

```bash
docker compose run --rm converter
```

## License

This repository is licensed under the MIT License.

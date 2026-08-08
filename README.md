# ItemsAdder to Bedrock Action

[![CI](https://github.com/haugg/itemsadder-to-bedrock-action/actions/workflows/ci.yml/badge.svg)](https://github.com/haugg/itemsadder-to-bedrock-action/actions/workflows/ci.yml)

Converts ItemsAdder YAML configuration into a Bedrock-compatible `.mcpack` artifact with a compatibility report. Runs as a GitHub Action inside any repository workflow.

## How it works

The pipeline parses ItemsAdder YAML files, builds an intermediate representation, performs geometry and texture transforms, and packages everything into a Bedrock resource pack and behavior pack. Each asset receives a compatibility classification so you know exactly what needs manual attention.

---

## Quick start: use the Action in your own repository

### 1. Create your repository

Create a new GitHub repository (or use an existing one) that will hold your ItemsAdder YAML configuration. The structure can look like this:

```
my-server-pack/
├── input/
│   ├── items.yml
│   ├── blocks.yml
│   └── sounds.yml          ← all .yml files in input/ are processed
└── .github/
    └── workflows/
        └── convert.yml     ← you create this file (see step 2)
```

Your YAML files follow the standard ItemsAdder format:

```yaml
namespace: my_pack

items:
  ruby_sword:
    display_name: "Ruby Sword"
    material: diamond_sword
    custom_model_data: 1001
    model:
      path: assets/my_pack/models/ruby_sword.json
      texture: assets/my_pack/textures/ruby_sword.png

blocks:
  glowing_stone:
    display_name: "Glowing Stone"
    material: stone
    model:
      path: assets/my_pack/models/glowing_stone.json
      texture: assets/my_pack/textures/glowing_stone.png
```

### 2. Create the workflow file

Create `.github/workflows/convert.yml` in your repository:

```yaml
name: Convert to Bedrock

on:
  push:
    branches: [main]
    paths:
      - 'input/**'          # only run when your YAML files change
  workflow_dispatch:        # also allows manual runs from the Actions tab

jobs:
  convert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: haugg/itemsadder-to-bedrock-action@v1
        with:
          input-path: ./input          # folder with your ItemsAdder .yml files
          output-dir: ./out            # where .mcpack and report are written
          output-name: my-pack         # base name for the generated files
          report-format: markdown      # or json
          fail-on: manual_required     # fail the job if anything needs manual work

      - uses: actions/upload-artifact@v4
        with:
          name: bedrock-pack
          path: ./out                  # download the .mcpack from the Actions run
```

### 3. Push and run

```bash
git add .github/workflows/convert.yml input/
git commit -m "add conversion workflow"
git push
```

GitHub will automatically run the conversion on every push to `main` that touches the `input/` folder. You can also trigger it manually from **Actions → Convert to Bedrock → Run workflow**.

### 4. Download the result

After the workflow completes:

1. Open your repository on GitHub.
2. Click **Actions** → select the latest **Convert to Bedrock** run.
3. Scroll to **Artifacts** at the bottom and download **bedrock-pack**.
4. The `.zip` contains `my-pack.mcpack` and `my-pack.report.md`.

Import `my-pack.mcpack` directly into Minecraft Bedrock via the file manager or the game's import dialog.

### 5. Read the compatibility report

Every run produces a compatibility report alongside the `.mcpack`. Open `my-pack.report.md` to see which assets converted cleanly and which need manual follow-up:

```
# Compatibility Report

Generated at: 2026-08-09T12:00:00.000Z

## Assets

- **item** ruby_sword — FULL: No limitations detected
- **block** glowing_stone — MANUAL_REQUIRED: Custom geometry requires manual Bedrock model authoring
```

---

## Input format reference

The converter accepts any number of `.yml` files in the input path. All files are merged into a single namespace. Asset IDs must be unique across all files.

```yaml
namespace: my_pack          # required, used in pack UUIDs and manifest names

items:
  <item_id>:
    display_name: "..."     # optional display name
    material: <java_id>     # Java Edition material, e.g. diamond_sword
    custom_model_data: 1    # optional, the Java CMD value
    model:
      path: assets/...      # path to the .json model file (relative to this yml)
      texture: assets/...   # path to the .png texture (relative to this yml)
      rotation: [0, 0, 0]   # optional X/Y/Z rotation in degrees
      parts:                # optional list of geometry cubes
        - name: blade
          origin: [0, 0, 0]
          size: [2, 16, 2]

blocks:
  <block_id>:
    display_name: "..."
    material: <java_id>
    model:
      path: assets/...
      texture: assets/...
      rotation: [0, 45, 0]
      parts:
        - name: core
          origin: [2, 2, 2]
          size: [12, 12, 12]
```

---

## Action reference

### Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `input-path` | Yes | `./input` | Path to a YAML file or directory to convert. |
| `output-dir` | No | `./output` | Directory for generated output files. |
| `output-name` | No | `output` | Base filename for the `.mcpack` and report. |
| `report-format` | No | `markdown` | Report format: `markdown` or `json`. |
| `fail-on` | No | `manual_required` | Fail threshold: `none`, `partial`, `manual_required`, or `impossible`. |

### Outputs

| Output | Description |
| --- | --- |
| `mcpack-path` | Absolute path to the generated `.mcpack` archive. |
| `report-path` | Absolute path to the generated compatibility report. |
| `full-count` | Number of assets classified as `FULL`. |
| `partial-count` | Number of assets classified as `PARTIAL`. |
| `manual-required-count` | Number of assets classified as `MANUAL_REQUIRED`. |
| `impossible-count` | Number of assets classified as `IMPOSSIBLE`. |

You can use the outputs in later steps:

```yaml
      - uses: haugg/itemsadder-to-bedrock-action@v1
        id: convert
        with:
          input-path: ./input
          output-dir: ./out
          output-name: my-pack

      - run: echo "mcpack is at ${{ steps.convert.outputs.mcpack-path }}"
```

### fail-on levels

| Value | When the job fails |
| --- | --- |
| `none` | Never fails based on compatibility. |
| `partial` | Fails if any asset is `PARTIAL` or worse. |
| `manual_required` | Fails if any asset is `MANUAL_REQUIRED` or worse. |
| `impossible` | Fails only if any asset is `IMPOSSIBLE`. |

Exit codes: `1` internal error · `2` validation failure · `3` fail-on threshold exceeded.

---

## Compatibility levels

| Status | Meaning |
| --- | --- |
| `FULL` | Automatically converted with no loss. |
| `PARTIAL` | Converted but may lose fidelity. |
| `MANUAL_REQUIRED` | Structural conversion done; manual Bedrock authoring needed. |
| `IMPOSSIBLE` | No valid Bedrock equivalent exists. |

---

## Local development

```bash
git clone https://github.com/haugg/itemsadder-to-bedrock-action.git
cd itemsadder-to-bedrock-action
npm ci
npm test
```

Run the CLI directly against your own files:

```bash
npm run build
node dist/src/cli/index.js \
  --input path/to/your/input \
  --output-dir dist/out \
  --output-name my-pack \
  --report-format markdown \
  --fail-on none
```

## Docker

```bash
docker compose run --rm converter
```

---

## Known limitations

- No complete Java-to-Bedrock geometry conversion for arbitrary Blockbench models.
- No full UV remapping for Bedrock texture atlases.
- No full Bedrock behavior pack component mapping for complex items and blocks.
- No translation of plugin-specific interaction logic such as custom click handlers.

## License

MIT

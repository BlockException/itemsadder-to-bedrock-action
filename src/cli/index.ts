#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseItemsAdderConfig } from '../parser/index.js';
import { validateInputPath } from '../validation/index.js';
import { transformGeometry } from '../geometry/index.js';
import { buildTextureAtlas } from '../textures/index.js';
import { assemblePacks } from '../assembler/index.js';
import { buildCompatibilityReport } from '../report/index.js';
import { buildPackage } from '../packaging/index.js';
import type { ConversionRun } from '../ir/types.js';
import type { CliOptions, FailOnLevel } from './types.js';

export function normalizeFailOn(value: string | undefined): FailOnLevel {
  if (!value) return 'NONE';

  const normalized = value.trim().toLowerCase().replace(/-/g, '_');
  const mapping: Record<string, FailOnLevel> = {
    none: 'NONE',
    never: 'NONE',
    partial: 'PARTIAL',
    manual_required: 'MANUAL_REQUIRED',
    manualrequired: 'MANUAL_REQUIRED',
    impossible: 'IMPOSSIBLE'
  };

  return mapping[normalized] ?? 'NONE';
}

export function parseArgs(argv: string[]): CliOptions {
  const options: Partial<CliOptions> = {};
  for (let i = 2; i + 1 < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    switch (key) {
      case '--input':
        options.input = value;
        break;
      case '--output-dir':
        options.outputDir = value;
        break;
      case '--output-name':
        options.outputName = value;
        break;
      case '--report-format':
        options.reportFormat = value as CliOptions['reportFormat'];
        break;
      case '--fail-on':
        options.failOn = normalizeFailOn(value);
        break;
      default:
        break;
    }
  }

  return {
    input: options.input ?? 'tests/fixtures/parser/simple-item.yml',
    outputDir: options.outputDir ?? 'dist/out',
    outputName: options.outputName ?? 'output',
    reportFormat: options.reportFormat ?? 'markdown',
    failOn: options.failOn ?? 'NONE'
  };
}

export function buildCounts(report: { status: string }[]) {
  return report.reduce((counts, asset) => {
    const status = asset.status as 'FULL' | 'PARTIAL' | 'MANUAL_REQUIRED' | 'IMPOSSIBLE';
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

export function shouldFailOn(report: { status: string }[], level: FailOnLevel): boolean {
  if (level === 'NONE') return false;
  const order = ['FULL', 'PARTIAL', 'MANUAL_REQUIRED', 'IMPOSSIBLE'] as const;
  const threshold = order.indexOf(level as typeof order[number]);
  return report.some((asset) => order.indexOf(asset.status as typeof order[number]) >= threshold);
}

async function main() {
  const options = parseArgs(process.argv);
  const absoluteInput = resolve(options.input);
  const validation = validateInputPath(absoluteInput);
  if (!validation.ok) {
    console.error(`Validation failed: ${validation.reason}`);
    process.exit(2);
  }

  const { ir } = parseItemsAdderConfig(absoluteInput);
  const geometry = transformGeometry(ir.items, ir.blocks);
  const atlas = buildTextureAtlas(ir.items, ir.blocks);
  const assembled = assemblePacks(ir);
  const compatibilityReport = buildCompatibilityReport(ir);
  const run: ConversionRun = {
    inputManifest: {
      hash: 'placeholder',
      size: 0,
      files: [options.input]
    },
    ir,
    compatibilityReport,
    outputArtifact: { version: '0.1.0' }
  };

  const result = await buildPackage(run, resolve(options.outputDir), options.outputName, options.reportFormat);
  run.outputArtifact = {
    version: '0.1.0',
    mcpackPath: result.outputPath,
    reportPath: result.reportPath
  };

  const output = {
    outputPath: result.outputPath,
    reportPath: run.outputArtifact.reportPath,
    counts: buildCounts(compatibilityReport.assets)
  };

  if (shouldFailOn(compatibilityReport.assets, options.failOn)) {
    console.error(JSON.stringify(output, null, 2));
    process.exit(3);
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

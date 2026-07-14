import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import type { ConversionRun } from '../ir/types.js';

export interface PackagingResult {
  outputPath: string;
  reportPath: string;
}

function stableUuid(source: string): string {
  const hash = createHash('sha1').update(source).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function renderReport(report: unknown, format: 'json' | 'markdown'): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }
  const data = report as any;
  const lines = ['# Compatibility Report', '', `Generated at: ${data.generatedAt}`];
  lines.push('', '## Assets', '');
  for (const asset of data.assets ?? []) {
    lines.push(`- **${asset.assetType}** ${asset.assetId} — ${asset.status}: ${asset.reason}`);
  }
  return lines.join('\n');
}

export async function buildPackage(run: ConversionRun, outputDir: string, outputName: string, reportFormat: 'json' | 'markdown'): Promise<PackagingResult> {
  mkdirSync(outputDir, { recursive: true });
  const reportPath = join(outputDir, `${outputName}.report.${reportFormat === 'json' ? 'json' : 'md'}`);
  writeFileSync(reportPath, renderReport(run.compatibilityReport, reportFormat));

  const resourcePackId = stableUuid(`${run.ir.namespace}:resource`);
  const behaviorPackId = stableUuid(`${run.ir.namespace}:behavior`);
  const resourceManifest = {
    format_version: 2,
    header: {
      name: `${run.ir.namespace} resource pack`,
      description: 'Generated Bedrock resource pack',
      uuid: resourcePackId,
      version: [1, 0, 0]
    }
  };
  const behaviorManifest = {
    format_version: 2,
    header: {
      name: `${run.ir.namespace} behavior pack`,
      description: 'Generated Bedrock behavior pack',
      uuid: behaviorPackId,
      version: [1, 0, 0]
    },
    modules: [
      {
        type: 'data',
        uuid: behaviorPackId,
        version: [1, 0, 0]
      }
    ],
    dependencies: [
      {
        uuid: resourcePackId,
        version: [1, 0, 0]
      }
    ]
  };

  const itemTextures = run.ir.items.map((item) => ({ id: item.id, texture: item.texturePath ?? 'missing' }));
  const blockTextures = run.ir.blocks.map((block) => ({ id: block.id, texture: block.texturePath ?? 'missing' }));

  const resourcePackData = {
    textures: {
      item_texture: itemTextures.reduce((acc, entry) => {
        acc[entry.id] = entry.texture;
        return acc;
      }, {} as Record<string, string>),
      terrain_texture: blockTextures.reduce((acc, entry) => {
        acc[entry.id] = entry.texture;
        return acc;
      }, {} as Record<string, string>)
    }
  };

  const behaviorPackData = {
    items: run.ir.items.map((item) => ({ id: item.id, icon: item.texturePath ?? 'missing', display_name: item.displayName ?? item.id })),
    blocks: run.ir.blocks.map((block) => ({ id: block.id, icon: block.texturePath ?? 'missing', display_name: block.displayName ?? block.id }))
  };

  const zip = new JSZip();
  zip.file('resource_pack/manifest.json', JSON.stringify(resourceManifest, null, 2));
  zip.file('behavior_pack/manifest.json', JSON.stringify(behaviorManifest, null, 2));
  zip.file('resource_pack/textures/item_texture.json', JSON.stringify(resourcePackData.textures.item_texture, null, 2));
  zip.file('resource_pack/textures/terrain_texture.json', JSON.stringify(resourcePackData.textures.terrain_texture, null, 2));

  behaviorPackData.items.forEach((item) => {
    zip.file(`behavior_pack/items/${item.id}.json`, JSON.stringify(item, null, 2));
  });
  behaviorPackData.blocks.forEach((block) => {
    zip.file(`behavior_pack/blocks/${block.id}.json`, JSON.stringify(block, null, 2));
  });

  zip.file(`${outputName}.report.${reportFormat === 'json' ? 'json' : 'md'}`, renderReport(run.compatibilityReport, reportFormat));

  const outputPath = join(outputDir, `${outputName}.mcpack`);
  const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  writeFileSync(outputPath, content);
  return { outputPath, reportPath };
}

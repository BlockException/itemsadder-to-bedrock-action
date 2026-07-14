import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import JSZip from 'jszip';
import { parseItemsAdderConfig } from '../../src/parser/index.js';
import { validateInputPath } from '../../src/validation/index.js';
import { transformGeometry } from '../../src/geometry/index.js';
import { buildTextureAtlas } from '../../src/textures/index.js';
import { assemblePacks } from '../../src/assembler/index.js';
import { buildCompatibilityReport } from '../../src/report/index.js';
import { buildPackage } from '../../src/packaging/index.js';
import type { ConversionRun } from '../../src/ir/types.js';

const fixtures = [
  'tests/fixtures/e2e/simple-item.yml',
  'tests/fixtures/e2e/custom-model-item.yml',
  'tests/fixtures/e2e/custom-block.yml'
];

test('end-to-end conversion generates valid mcpack with manifests and resource/behavior pack structure', async () => {
  const outDir = resolve('dist/e2e-out');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  for (const fixture of fixtures) {
    const inputPath = resolve(fixture);
    assert.ok(validateInputPath(inputPath).ok, `fixture ${fixture} should be valid`);

    const { ir } = parseItemsAdderConfig(inputPath);
    const geometry = transformGeometry(ir.items, ir.blocks);
    const atlas = buildTextureAtlas(ir.items, ir.blocks);
    const assembled = assemblePacks(ir);
    const compatibilityReport = buildCompatibilityReport(ir);

    const outputName = basename(fixture, '.yml');
    const result = await buildPackage(
      {
        inputManifest: { hash: outputName, size: 0, files: [fixture] },
        ir,
        compatibilityReport,
        outputArtifact: { version: '0.1.0' }
      },
      outDir,
      outputName,
      'markdown'
    );

    assert.ok(existsSync(result.outputPath), `mcpack file should exist for ${fixture}`);
    assert.ok(existsSync(result.reportPath), `report should exist for ${fixture}`);

    const zipContent = readFileSync(result.outputPath);
    const zip = await JSZip.loadAsync(zipContent);

    const resourceManifestFile = zip.file('resource_pack/manifest.json');
    const behaviorManifestFile = zip.file('behavior_pack/manifest.json');
    assert.ok(resourceManifestFile, 'resource pack manifest is missing');
    assert.ok(behaviorManifestFile, 'behavior pack manifest is missing');

    const resourceManifest = JSON.parse(await resourceManifestFile.async('text'));
    const behaviorManifest = JSON.parse(await behaviorManifestFile.async('text'));
    assert.match(resourceManifest.header.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.match(behaviorManifest.header.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.equal(behaviorManifest.dependencies?.[0]?.uuid, resourceManifest.header.uuid);
    assert.equal(behaviorManifest.modules?.[0]?.uuid, behaviorManifest.header.uuid);

    const itemTextureJson = zip.file('resource_pack/textures/item_texture.json');
    const terrainTextureJson = zip.file('resource_pack/textures/terrain_texture.json');
    assert.ok(itemTextureJson, 'item texture mapping is missing');
    assert.ok(terrainTextureJson, 'terrain texture mapping is missing');

    const itemTexture = JSON.parse(await itemTextureJson.async('text')) as Record<string, string>;
    const terrainTexture = JSON.parse(await terrainTextureJson.async('text')) as Record<string, string>;

    for (const item of ir.items) {
      const itemFile = zip.file(`behavior_pack/items/${item.id}.json`);
      assert.ok(itemFile, `behavior pack item file missing for ${item.id}`);
      const itemData = JSON.parse(await itemFile.async('text')) as { icon: string; display_name: string };
      assert.equal(itemData.icon, item.texturePath ?? 'missing');
      assert.equal(itemTexture[item.id], item.texturePath ?? 'missing');
      assert.equal(itemData.display_name, item.displayName ?? item.id);
    }

    for (const block of ir.blocks) {
      const blockFile = zip.file(`behavior_pack/blocks/${block.id}.json`);
      assert.ok(blockFile, `behavior pack block file missing for ${block.id}`);
      const blockData = JSON.parse(await blockFile.async('text')) as { icon: string; display_name: string };
      assert.equal(blockData.icon, block.texturePath ?? 'missing');
      assert.equal(terrainTexture[block.id], block.texturePath ?? 'missing');
      assert.equal(blockData.display_name, block.displayName ?? block.id);
    }

    assert.equal(geometry.itemGeometries.length, ir.items.length, 'item geometry count mismatch');
    assert.equal(geometry.blockGeometries.length, ir.blocks.length, 'block geometry count mismatch');

    assert.ok(atlas.length > 0, 'texture atlas should contain entries');
    const expectedAtlasSize = new Set(
      [...ir.items.map((item) => item.texturePath), ...ir.blocks.map((block) => block.texturePath)]
        .filter(Boolean)
    ).size;
    assert.equal(atlas.length, expectedAtlasSize);

    for (const entry of atlas) {
      assert.ok(existsSync(entry.sourcePath), `texture file should exist: ${entry.sourcePath}`);
      assert.match(entry.hash, /^[0-9a-f]{12}$/);
    }

    const multipartItem = ir.items.find((item) => item.modelParts?.length && item.customModelData === 42);
    if (multipartItem) {
      const itemGeometry = geometry.itemGeometries.find((entry) => entry.id === multipartItem.id);
      assert.ok(itemGeometry, `geometry missing for ${multipartItem.id}`);
      assert.equal(itemGeometry.bones[0].cubes.length, multipartItem.modelParts?.length);
      assert.deepEqual(itemGeometry.bones[0].rotation, multipartItem.modelRotation ?? [0, 0, 0]);
    }
  }

  rmSync(outDir, { recursive: true, force: true });
});

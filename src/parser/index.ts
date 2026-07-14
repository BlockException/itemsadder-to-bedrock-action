import { dirname, resolve, join, extname } from 'node:path';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import type { IntermediateRepresentation, ItemIR, BlockIR, SoundIR, ModelPart } from '../ir/types.js';

export interface ParseResult {
  ir: IntermediateRepresentation;
}

function collectYamlFiles(inputPath: string): string[] {
  const stats = statSync(inputPath);
  if (stats.isFile()) {
    return [inputPath];
  }

  const files: string[] = [];
  const entries = readdirSync(inputPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(inputPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectYamlFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (ext === '.yml' || ext === '.yaml') {
        files.push(fullPath);
      }
    }
  }
  return files.sort();
}

function resolveAssetPath(basePath: string, value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  return value.startsWith('/') ? value : resolve(dirname(basePath), value);
}

function parseRotation(value: unknown): [number, number, number] | undefined {
  if (!Array.isArray(value) || value.length !== 3) return undefined;
  const parsed = value.map((entry) => Number(entry));
  return parsed.some((n) => Number.isNaN(n)) ? undefined : [parsed[0], parsed[1], parsed[2]] as [number, number, number];
}

function parseModelParts(value: unknown): ModelPart[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const parts = value
    .map((entry) => (typeof entry === 'object' && entry !== null ? entry as Record<string, unknown> : undefined))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((part) => {
      const name = typeof part.name === 'string' ? part.name : undefined;
      const origin = parseRotation(part.origin);
      const size = parseRotation(part.size);
      return name && origin && size ? { name, origin, size } : undefined;
    })
    .filter((part): part is ModelPart => Boolean(part));
  return parts.length > 0 ? parts : undefined;
}

export function parseItemsAdderConfig(inputPath: string): ParseResult {
  const files = collectYamlFiles(inputPath);

  if (files.length === 0) {
    throw new Error(`No YAML configuration files found under: ${inputPath}`);
  }

  let namespace: string | undefined;
  const itemEntries: ItemIR[] = [];
  const blockEntries: BlockIR[] = [];
  const soundEntries: SoundIR[] = [];
  const seenIds = new Map<string, string>();

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const data = (parse(content) ?? {}) as Record<string, unknown>;

    if (typeof data.namespace === 'string' && data.namespace.trim() !== '') {
      namespace = data.namespace;
    }

    const items = Array.isArray((data as any).items) ? [] : ((data as any).items ?? {});
    const blocks = Array.isArray((data as any).blocks) ? [] : ((data as any).blocks ?? {});
    const sounds = Array.isArray((data as any).sounds) ? [] : ((data as any).sounds ?? {});

    const assertUnique = (id: string, kind: string) => {
      const key = `${kind}:${id}`;
      const existingFile = seenIds.get(key);
      if (existingFile) {
        throw new Error(
          `Duplicate ${kind} id "${id}" found in both "${existingFile}" and "${file}". ` +
          `Asset ids must be unique across all configuration files.`
        );
      }
      seenIds.set(key, file);
    };

    for (const [id, value] of Object.entries(items as Record<string, any>)) {
      assertUnique(id, 'item');
      const config = (value ?? {}) as Record<string, unknown>;
      const model = (config.model ?? {}) as Record<string, unknown>;
      itemEntries.push({
        id,
        displayName: typeof config.display_name === 'string' ? config.display_name : undefined,
        material: typeof config.material === 'string' ? config.material : 'unknown',
        customModelData: typeof config.custom_model_data === 'number' ? config.custom_model_data : undefined,
        modelPath: typeof model.path === 'string' ? model.path : undefined,
        texturePath: typeof model.texture === 'string' ? model.texture : undefined,
        resolvedModelPath: resolveAssetPath(file, model.path),
        resolvedTexturePath: resolveAssetPath(file, model.texture),
        modelRotation: parseRotation(model.rotation),
        modelParts: parseModelParts(model.parts),
        compatibility: 'FULL',
        notes: []
      });
    }

    for (const [id, value] of Object.entries(blocks as Record<string, any>)) {
      assertUnique(id, 'block');
      const config = (value ?? {}) as Record<string, unknown>;
      const model = (config.model ?? {}) as Record<string, unknown>;
      blockEntries.push({
        id,
        displayName: typeof config.display_name === 'string' ? config.display_name : undefined,
        material: typeof config.material === 'string' ? config.material : 'unknown',
        modelPath: typeof model.path === 'string' ? model.path : undefined,
        texturePath: typeof model.texture === 'string' ? model.texture : undefined,
        resolvedModelPath: resolveAssetPath(file, model.path),
        resolvedTexturePath: resolveAssetPath(file, model.texture),
        modelRotation: parseRotation(model.rotation),
        modelParts: parseModelParts(model.parts),
        compatibility: 'FULL',
        notes: []
      });
    }

    for (const [id, value] of Object.entries(sounds as Record<string, any>)) {
      assertUnique(id, 'sound');
      const config = (value ?? {}) as Record<string, unknown>;
      const variants = Array.isArray(config.variants)
        ? config.variants.map((entry) => String(entry))
        : [];
      soundEntries.push({
        id,
        category: typeof config.category === 'string' ? config.category : undefined,
        variants,
        compatibility: 'FULL',
        notes: []
      });
    }
  }

  const ir: IntermediateRepresentation = {
    namespace: namespace ?? 'default',
    items: itemEntries,
    blocks: blockEntries,
    sounds: soundEntries,
    metadata: {
      source: 'itemsadder',
      version: '1.0.0'
    }
  };

  return { ir };
}

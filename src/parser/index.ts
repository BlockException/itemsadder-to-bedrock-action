import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import type { IntermediateRepresentation, ItemIR, BlockIR, SoundIR, ModelPart } from '../ir/types.js';

export interface ParseResult {
  ir: IntermediateRepresentation;
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
  const content = readFileSync(inputPath, 'utf8');
  const data = parse(content) as Record<string, unknown>;

  const namespace = String((data.namespace as string | undefined) ?? 'default');
  const items = Array.isArray((data as any).items) ? [] : ((data as any).items ?? {});
  const blocks = Array.isArray((data as any).blocks) ? [] : ((data as any).blocks ?? {});
  const sounds = Array.isArray((data as any).sounds) ? [] : ((data as any).sounds ?? {});

  const itemEntries: ItemIR[] = Object.entries(items as Record<string, any>).map(([id, value]) => {
    const config = (value ?? {}) as Record<string, unknown>;
    const model = (config.model ?? {}) as Record<string, unknown>;
    return {
      id,
      displayName: typeof config.display_name === 'string' ? config.display_name : undefined,
      material: typeof config.material === 'string' ? config.material : 'unknown',
      customModelData: typeof config.custom_model_data === 'number' ? config.custom_model_data : undefined,
      modelPath: typeof model.path === 'string' ? model.path : undefined,
      texturePath: typeof model.texture === 'string' ? model.texture : undefined,
      resolvedModelPath: resolveAssetPath(inputPath, model.path),
      resolvedTexturePath: resolveAssetPath(inputPath, model.texture),
      modelRotation: parseRotation(model.rotation),
      modelParts: parseModelParts(model.parts),
      compatibility: 'FULL',
      notes: []
    };
  });

  const blockEntries: BlockIR[] = Object.entries(blocks as Record<string, any>).map(([id, value]) => {
    const config = (value ?? {}) as Record<string, unknown>;
    const model = (config.model ?? {}) as Record<string, unknown>;
    return {
      id,
      displayName: typeof config.display_name === 'string' ? config.display_name : undefined,
      material: typeof config.material === 'string' ? config.material : 'unknown',
      modelPath: typeof model.path === 'string' ? model.path : undefined,
      texturePath: typeof model.texture === 'string' ? model.texture : undefined,
      resolvedModelPath: resolveAssetPath(inputPath, model.path),
      resolvedTexturePath: resolveAssetPath(inputPath, model.texture),
      modelRotation: parseRotation(model.rotation),
      modelParts: parseModelParts(model.parts),
      compatibility: 'FULL',
      notes: []
    };
  });

  const soundEntries: SoundIR[] = Object.entries(sounds as Record<string, any>).map(([id, value]) => {
    const config = (value ?? {}) as Record<string, unknown>;
    const variants = Array.isArray(config.variants)
      ? config.variants.map((entry) => String(entry))
      : [];
    return {
      id,
      category: typeof config.category === 'string' ? config.category : undefined,
      variants,
      compatibility: 'FULL',
      notes: []
    };
  });

  const ir: IntermediateRepresentation = {
    namespace,
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

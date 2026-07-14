import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import type { ItemIR, BlockIR } from '../ir/types.js';

export interface AtlasEntry {
  key: string;
  sourcePath: string;
  hash: string;
}

export function buildTextureAtlas(items: ItemIR[], blocks: BlockIR[]): AtlasEntry[] {
  const entries: AtlasEntry[] = [];
  const seen = new Set<string>();

  const allTextures = [...items.map((item) => item.resolvedTexturePath), ...blocks.map((block) => block.resolvedTexturePath)].filter(Boolean) as string[];
  for (const texturePath of allTextures) {
    if (!existsSync(texturePath)) {
      throw new Error(`Texture file not found: ${texturePath}`);
    }

    const imageBytes = readFileSync(texturePath);
    const hash = createHash('sha256').update(imageBytes).digest('hex').slice(0, 12);
    if (seen.has(hash)) continue;
    seen.add(hash);

    entries.push({ key: `tex_${hash}`, sourcePath: texturePath, hash });
  }

  return entries;
}

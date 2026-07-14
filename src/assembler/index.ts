import type { IntermediateRepresentation } from '../ir/types.js';

export interface ResourcePackData {
  items: Array<{ id: string; texture: string }>;
  blocks: Array<{ id: string; texture: string }>;
}

export interface BehaviorPackData {
  items: Array<{ id: string; material: string }>;
  blocks: Array<{ id: string; material: string }>;
}

export interface AssemblerResult {
  resourcePack: ResourcePackData;
  behaviorPack: BehaviorPackData;
}

export function assemblePacks(ir: IntermediateRepresentation): AssemblerResult {
  const resourcePack: ResourcePackData = {
    items: ir.items.map((item) => ({ id: item.id, texture: item.texturePath ?? 'missing.png' })),
    blocks: ir.blocks.map((block) => ({ id: block.id, texture: block.texturePath ?? 'missing.png' }))
  };

  const behaviorPack: BehaviorPackData = {
    items: ir.items.map((item) => ({ id: item.id, material: item.material })),
    blocks: ir.blocks.map((block) => ({ id: block.id, material: block.material }))
  };

  return { resourcePack, behaviorPack };
}

import type { ItemIR, BlockIR, ModelPart } from '../ir/types.js';

interface CubeGeometry {
  origin: [number, number, number];
  size: [number, number, number];
}

interface BoneGeometry {
  name: string;
  pivot: [number, number, number];
  rotation: [number, number, number];
  cubes: CubeGeometry[];
}

interface ModelGeometry {
  id: string;
  bones: BoneGeometry[];
}

export interface GeometryTransformResult {
  itemGeometries: ModelGeometry[];
  blockGeometries: ModelGeometry[];
}

function buildModelGeometry(id: string, rotation: [number, number, number] | undefined, parts: ModelPart[] | undefined): ModelGeometry {
  const cubes = (parts?.map((part) => ({
    origin: part.origin,
    size: part.size
  })) ?? [{
    origin: [0, 0, 0] as [number, number, number],
    size: [16, 16, 16] as [number, number, number]
  }]) as CubeGeometry[];

  return {
    id,
    bones: [{
      name: `${id}_bone`,
      pivot: [0, 0, 0] as [number, number, number],
      rotation: rotation ?? [0, 0, 0] as [number, number, number],
      cubes
    }]
  };
}

export function transformGeometry(items: ItemIR[], blocks: BlockIR[]): GeometryTransformResult {
  const itemGeometries = items.map((item) => buildModelGeometry(item.id, item.modelRotation, item.modelParts));
  const blockGeometries = blocks.map((block) => buildModelGeometry(block.id, block.modelRotation, block.modelParts));
  return { itemGeometries, blockGeometries };
}

export type CompatibilityStatus = 'FULL' | 'PARTIAL' | 'MANUAL_REQUIRED' | 'IMPOSSIBLE';

export interface ModelPart {
  name: string;
  origin: [number, number, number];
  size: [number, number, number];
}

export interface ConversionRun {
  inputManifest: {
    hash: string;
    size: number;
    files: string[];
  };
  ir: IntermediateRepresentation;
  compatibilityReport: CompatibilityReport;
  outputArtifact?: {
    mcpackPath?: string;
    reportPath?: string;
    version: string;
  };
}

export interface IntermediateRepresentation {
  namespace: string;
  items: ItemIR[];
  blocks: BlockIR[];
  sounds: SoundIR[];
  metadata: {
    source: 'itemsadder';
    version: string;
  };
}

export interface ItemIR {
  id: string;
  displayName?: string;
  material: string;
  customModelData?: number;
  modelPath?: string;
  texturePath?: string;
  resolvedModelPath?: string;
  resolvedTexturePath?: string;
  modelRotation?: [number, number, number];
  modelParts?: ModelPart[];
  compatibility: CompatibilityStatus;
  notes: string[];
}

export interface BlockIR {
  id: string;
  displayName?: string;
  material: string;
  modelPath?: string;
  texturePath?: string;
  resolvedModelPath?: string;
  resolvedTexturePath?: string;
  modelRotation?: [number, number, number];
  modelParts?: ModelPart[];
  compatibility: CompatibilityStatus;
  notes: string[];
}

export interface SoundIR {
  id: string;
  category?: string;
  variants: string[];
  compatibility: CompatibilityStatus;
  notes: string[];
}

export interface CompatibilityReport {
  generatedAt: string;
  converterVersion: string;
  compatibilityMappingVersion: string;
  assets: AssetCompatibilityResult[];
}

export interface AssetCompatibilityResult {
  assetType: 'item' | 'block' | 'sound';
  assetId: string;
  status: CompatibilityStatus;
  reason: string;
  source: string;
}

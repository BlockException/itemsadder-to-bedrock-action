import type { CompatibilityReport, IntermediateRepresentation } from '../ir/types.js';

export function buildCompatibilityReport(ir: IntermediateRepresentation): CompatibilityReport {
  const assets = [
    ...ir.items.map((item) => ({
      assetType: 'item' as const,
      assetId: item.id,
      status: item.compatibility,
      reason: item.notes.length > 0 ? item.notes.join('; ') : 'No limitations detected',
      source: 'parser'
    })),
    ...ir.blocks.map((block) => ({
      assetType: 'block' as const,
      assetId: block.id,
      status: block.compatibility,
      reason: block.notes.length > 0 ? block.notes.join('; ') : 'No limitations detected',
      source: 'parser'
    }))
  ];

  return {
    generatedAt: new Date().toISOString(),
    converterVersion: '0.1.0',
    compatibilityMappingVersion: '0.1.0',
    assets
  };
}

export type FailOnLevel = 'NONE' | 'PARTIAL' | 'MANUAL_REQUIRED' | 'IMPOSSIBLE';

export interface CliOptions {
  input: string;
  outputDir: string;
  outputName: string;
  reportFormat: 'json' | 'markdown';
  failOn: FailOnLevel;
}

import { accessSync, statSync } from 'node:fs';
import { extname } from 'node:path';

export interface ValidationResult {
  inputPath: string;
  isDirectory: boolean;
  isFile: boolean;
  ok: boolean;
  reason?: string;
}

export function validateInputPath(inputPath: string): ValidationResult {
  try {
    accessSync(inputPath);
  } catch {
    return { inputPath, isDirectory: false, isFile: false, ok: false, reason: 'Input path does not exist' };
  }

  const stats = statSync(inputPath);
  const isDirectory = stats.isDirectory();
  const isFile = stats.isFile();

  if (!isDirectory && !isFile) {
    return { inputPath, isDirectory, isFile, ok: false, reason: 'Input path is neither a file nor a directory' };
  }

  if (isFile && extname(inputPath).toLowerCase() !== '.yml' && extname(inputPath).toLowerCase() !== '.yaml') {
    return { inputPath, isDirectory, isFile, ok: false, reason: 'Input file must be a YAML configuration file' };
  }

  return { inputPath, isDirectory, isFile, ok: true };
}

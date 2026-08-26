export interface ProjectManifestEntry {
  readonly id: string;
  readonly name: string;
  readonly company: string;
  readonly description: string;
  readonly logoPath: string;
  readonly imageFolder: string;
  readonly images: readonly string[];
  readonly fallbackImage?: string | null;
}

export interface ProjectImageEntry {
  readonly projectId: string;
  readonly publicPath: string;
}

export class ProjectManifestError extends Error {
  readonly issues: readonly string[];
}

export const projectManifest: readonly ProjectManifestEntry[];

export function validateProjectManifest(
  manifest: unknown
): readonly ProjectManifestEntry[];

export function listProjectImageEntries(
  manifest: unknown,
  options?: { includeFallbacks?: boolean }
): ProjectImageEntry[];

export function projectImagePath(
  project: ProjectManifestEntry,
  image: string
): string;

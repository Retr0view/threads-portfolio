import { projectManifest } from "./project-image-manifest";

export interface WorkGroup {
  id: string;
  name: string;
  company: string;
  description: string;
  logoPath: string;
  imageFolder: string;
  images: string[];
  placeholderImage?: string;
}

export const workGroups: WorkGroup[] = projectManifest.map((project) => ({
  id: project.id,
  name: project.name,
  company: project.company,
  description: project.description,
  logoPath: project.logoPath,
  imageFolder: project.imageFolder,
  images: [...project.images],
  placeholderImage: project.fallbackImage ?? undefined,
}));

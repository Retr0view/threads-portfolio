import blurData from "./image-blur-data.json"
import {
  projectImagePath,
  projectManifest,
  type DescriptionPart,
} from "./project-image-manifest"

export interface GalleryImage {
  readonly id: string
  readonly src: string
  readonly blurDataURL: string | null
}

export interface PortfolioProjectView {
  readonly id: string
  readonly name: string
  readonly company: string
  readonly description: readonly DescriptionPart[]
  readonly logoSrc: string
  readonly gallery: readonly [GalleryImage, ...GalleryImage[]]
}

const blurDataByPath: Readonly<Record<string, string>> = blurData

function toGallery(project: (typeof projectManifest)[number]): [GalleryImage, ...GalleryImage[]] {
  const paths = project.images.length > 0
    ? project.images.map((image) => projectImagePath(project, image))
    : Array.from({ length: 3 }, () => project.fallbackImage!)

  return paths.map((src, index) => ({
    id: `${project.id}-${index + 1}`,
    src,
    blurDataURL: blurDataByPath[src] ?? null,
  })) as [GalleryImage, ...GalleryImage[]]
}

export const portfolioProjects: readonly PortfolioProjectView[] = projectManifest.map(
  (project) => ({
    id: project.id,
    name: project.name,
    company: project.company,
    description: project.description,
    logoSrc: project.logoPath,
    gallery: toGallery(project),
  })
)

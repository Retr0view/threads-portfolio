import rawProjectManifest from "./project-image-manifest.json"

export type DescriptionPart =
  | Readonly<{ type: "text"; text: string }>
  | Readonly<{ type: "link"; text: string; href: string }>

export interface ProjectManifestEntry {
  readonly id: string
  readonly name: string
  readonly company: string
  readonly description: readonly DescriptionPart[]
  readonly logoPath: string
  readonly imageFolder: string
  readonly images: readonly string[]
  readonly fallbackImage?: string | null
}

export interface ProjectImageEntry {
  readonly projectId: string
  readonly publicPath: string
}

const PROJECT_FIELDS = new Set([
  "id",
  "name",
  "company",
  "description",
  "logoPath",
  "imageFolder",
  "images",
  "fallbackImage",
])

export class ProjectManifestError extends Error {
  readonly issues: readonly string[]

  constructor(issues: readonly string[]) {
    super(
      `Project manifest validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`
    )
    this.name = "ProjectManifestError"
    this.issues = issues
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function projectLabel(project: Record<string, unknown>, index: number) {
  return typeof project.id === "string" && project.id.trim()
    ? `[${project.id}]`
    : `[project ${index + 1}]`
}

function validateRequiredString(
  project: Record<string, unknown>,
  field: string,
  label: string,
  issues: string[]
) {
  const value = project[field]
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${label} ${field} must be a non-empty string`)
    return false
  }
  return true
}

function decodedPath(value: string, label: string, issues: string[]) {
  try {
    return decodeURIComponent(value)
  } catch {
    issues.push(`${label} contains malformed URL encoding: ${value}`)
    return value
  }
}

function validatePublicPath(
  value: unknown,
  expectedRoot: string,
  label: string,
  issues: string[]
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${label} must be a non-empty public path`)
    return false
  }

  let valid = true
  if (!value.startsWith(`${expectedRoot}/`)) {
    issues.push(`${label} must start with ${expectedRoot}/: ${value}`)
    valid = false
  }

  if (
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("\0")
  ) {
    issues.push(`${label} contains invalid path characters: ${value}`)
    valid = false
  }

  const decoded = decodedPath(value, label, issues)
  if (
    decoded
      .split("/")
      .some(
        (segment, index) =>
          index > 0 && (segment === "" || segment === "." || segment === "..")
      )
  ) {
    issues.push(`${label} contains an empty or traversal segment: ${value}`)
    valid = false
  }

  if (decoded !== value && /%2f|%5c/i.test(value)) {
    issues.push(`${label} contains an encoded path separator: ${value}`)
    valid = false
  }

  return valid
}

function validateImageName(value: unknown, label: string, issues: string[]) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${label} must be a non-empty filename`)
    return false
  }

  const decoded = decodedPath(value, label, issues)
  if (
    value !== value.trim() ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("\0") ||
    decoded === "." ||
    decoded === ".." ||
    decoded.includes("/") ||
    decoded.includes("\\")
  ) {
    issues.push(
      `${label} must be a filename without traversal or path separators: ${value}`
    )
    return false
  }
  return true
}

function validateDescription(value: unknown, label: string, issues: string[]) {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(`${label} description must be a non-empty array`)
    return false
  }

  value.forEach((part, index) => {
    const partLabel = `${label} description[${index}]`
    if (!isPlainObject(part)) {
      issues.push(`${partLabel} must be an object`)
      return
    }

    const type = part.type
    const allowedFields = type === "link" ? new Set(["type", "text", "href"]) : new Set(["type", "text"])
    for (const field of Object.keys(part)) {
      if (!allowedFields.has(field)) issues.push(`${partLabel} contains unknown field: ${field}`)
    }

    if (type !== "text" && type !== "link") {
      issues.push(`${partLabel} type must be text or link`)
    }
    if (typeof part.text !== "string" || part.text.length === 0) {
      issues.push(`${partLabel} text must be a non-empty string`)
    }
    if (type === "link") {
      if (typeof part.href !== "string" || !/^https:\/\//.test(part.href)) {
        issues.push(`${partLabel} href must be an https URL`)
      } else {
        try {
          new URL(part.href)
        } catch {
          issues.push(`${partLabel} href must be a valid URL`)
        }
      }
    }
  })

  return true
}

export function projectImagePath(
  project: Pick<ProjectManifestEntry, "imageFolder">,
  image: string
) {
  return `${project.imageFolder}/${image}`
}

export function validateProjectManifest(manifest: unknown): readonly ProjectManifestEntry[] {
  const issues: string[] = []
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new ProjectManifestError(["manifest must be a non-empty array"])
  }

  const ids = new Map<string, number>()
  const names = new Map<string, number>()
  const imagePaths = new Map<string, string>()

  manifest.forEach((project, index) => {
    if (!isPlainObject(project)) {
      issues.push(`[project ${index + 1}] must be an object`)
      return
    }

    const label = projectLabel(project, index)
    for (const field of Object.keys(project)) {
      if (!PROJECT_FIELDS.has(field)) issues.push(`${label} contains unknown field: ${field}`)
    }

    const hasId = validateRequiredString(project, "id", label, issues)
    const hasName = validateRequiredString(project, "name", label, issues)
    validateRequiredString(project, "company", label, issues)
    validateDescription(project.description, label, issues)

    if (hasId && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id as string)) {
      issues.push(`${label} id must be a lowercase kebab-case identifier: ${String(project.id)}`)
    }
    if (hasId) {
      const id = project.id as string
      if (ids.has(id)) issues.push(`${label} duplicates id from project ${ids.get(id)! + 1}: ${id}`)
      else ids.set(id, index)
    }
    if (hasName) {
      const name = project.name as string
      const normalizedName = name.trim().toLocaleLowerCase("en")
      if (names.has(normalizedName)) {
        issues.push(`${label} duplicates name from project ${names.get(normalizedName)! + 1}: ${name}`)
      } else names.set(normalizedName, index)
    }

    validatePublicPath(project.logoPath, "/logos", `${label} logoPath`, issues)
    const hasImageFolder = validatePublicPath(
      project.imageFolder,
      "/images",
      `${label} imageFolder`,
      issues
    )

    if (!Array.isArray(project.images)) {
      issues.push(`${label} images must be an array`)
    } else {
      const projectImages = new Set<string>()
      project.images.forEach((image, imageIndex) => {
        if (!validateImageName(image, `${label} images[${imageIndex}]`, issues)) return
        const filename = image as string
        if (projectImages.has(filename)) issues.push(`${label} duplicates image filename: ${filename}`)
        else projectImages.add(filename)

        if (hasImageFolder) {
          const publicPath = `${String(project.imageFolder)}/${filename}`
          if (imagePaths.has(publicPath)) {
            issues.push(`${label} duplicates image path from ${imagePaths.get(publicPath)}: ${publicPath}`)
          } else imagePaths.set(publicPath, label)
        }
      })
    }

    const hasFallback = project.fallbackImage !== null && project.fallbackImage !== undefined
    if (hasFallback) {
      validatePublicPath(project.fallbackImage, "/images", `${label} fallbackImage`, issues)
    }
    if (Array.isArray(project.images) && project.images.length === 0 && !hasFallback) {
      issues.push(`${label} must define fallbackImage when images is empty`)
    }
  })

  if (issues.length > 0) throw new ProjectManifestError(issues)
  return manifest as ProjectManifestEntry[]
}

export function listProjectImageEntries(
  manifest: unknown,
  options: { includeFallbacks?: boolean } = {}
): ProjectImageEntry[] {
  const projects = validateProjectManifest(manifest)
  const entries: ProjectImageEntry[] = []
  for (const project of projects) {
    for (const image of project.images) {
      entries.push({ projectId: project.id, publicPath: projectImagePath(project, image) })
    }
    if (options.includeFallbacks && project.fallbackImage) {
      entries.push({ projectId: project.id, publicPath: project.fallbackImage })
    }
  }
  return entries
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}

export const projectManifest = deepFreeze(validateProjectManifest(rawProjectManifest))

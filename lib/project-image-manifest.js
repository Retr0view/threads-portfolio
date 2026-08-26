/* eslint-disable @typescript-eslint/no-require-imports */

const rawProjectManifest = require("./project-image-manifest.json");

const PROJECT_FIELDS = new Set([
  "id",
  "name",
  "company",
  "description",
  "logoPath",
  "imageFolder",
  "images",
  "fallbackImage",
]);

class ProjectManifestError extends Error {
  constructor(issues) {
    super(
      `Project manifest validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`
    );
    this.name = "ProjectManifestError";
    this.issues = issues;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function projectLabel(project, index) {
  return typeof project?.id === "string" && project.id.trim()
    ? `[${project.id}]`
    : `[project ${index + 1}]`;
}

function validateRequiredString(project, field, label, issues) {
  const value = project[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${label} ${field} must be a non-empty string`);
    return false;
  }

  return true;
}

function decodedPath(value, label, issues) {
  try {
    return decodeURIComponent(value);
  } catch {
    issues.push(`${label} contains malformed URL encoding: ${value}`);
    return value;
  }
}

function validatePublicPath(value, expectedRoot, label, issues) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${label} must be a non-empty public path`);
    return false;
  }

  let valid = true;
  if (!value.startsWith(`${expectedRoot}/`)) {
    issues.push(`${label} must start with ${expectedRoot}/: ${value}`);
    valid = false;
  }

  if (
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#") ||
    value.includes("\0")
  ) {
    issues.push(`${label} contains invalid path characters: ${value}`);
    valid = false;
  }

  const decoded = decodedPath(value, label, issues);
  const segments = decoded.split("/");
  if (
    segments.some(
      (segment, index) =>
        index > 0 && (segment === "" || segment === "." || segment === "..")
    )
  ) {
    issues.push(`${label} contains an empty or traversal segment: ${value}`);
    valid = false;
  }

  if (decoded !== value && /%2f|%5c/i.test(value)) {
    issues.push(`${label} contains an encoded path separator: ${value}`);
    valid = false;
  }

  return valid;
}

function validateImageName(value, label, issues) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${label} must be a non-empty filename`);
    return false;
  }

  const decoded = decodedPath(value, label, issues);
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
    );
    return false;
  }

  return true;
}

function projectImagePath(project, image) {
  return `${project.imageFolder}/${image}`;
}

function validateProjectManifest(manifest) {
  const issues = [];
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new ProjectManifestError(["manifest must be a non-empty array"]);
  }

  const ids = new Map();
  const names = new Map();
  const imagePaths = new Map();

  manifest.forEach((project, index) => {
    if (!isPlainObject(project)) {
      issues.push(`[project ${index + 1}] must be an object`);
      return;
    }

    const label = projectLabel(project, index);
    for (const field of Object.keys(project)) {
      if (!PROJECT_FIELDS.has(field)) {
        issues.push(`${label} contains unknown field: ${field}`);
      }
    }

    const hasId = validateRequiredString(project, "id", label, issues);
    const hasName = validateRequiredString(project, "name", label, issues);
    validateRequiredString(project, "company", label, issues);
    validateRequiredString(project, "description", label, issues);

    if (hasId && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id)) {
      issues.push(
        `${label} id must be a lowercase kebab-case identifier: ${project.id}`
      );
    }

    if (hasId) {
      if (ids.has(project.id)) {
        issues.push(
          `${label} duplicates id from project ${ids.get(project.id) + 1}: ${project.id}`
        );
      } else {
        ids.set(project.id, index);
      }
    }

    if (hasName) {
      const normalizedName = project.name.trim().toLocaleLowerCase("en");
      if (names.has(normalizedName)) {
        issues.push(
          `${label} duplicates name from project ${names.get(normalizedName) + 1}: ${project.name}`
        );
      } else {
        names.set(normalizedName, index);
      }
    }

    validatePublicPath(project.logoPath, "/logos", `${label} logoPath`, issues);
    const hasImageFolder = validatePublicPath(
      project.imageFolder,
      "/images",
      `${label} imageFolder`,
      issues
    );

    if (!Array.isArray(project.images)) {
      issues.push(`${label} images must be an array`);
    } else {
      const projectImages = new Set();
      project.images.forEach((image, imageIndex) => {
        if (
          !validateImageName(image, `${label} images[${imageIndex}]`, issues)
        ) {
          return;
        }

        if (projectImages.has(image)) {
          issues.push(`${label} duplicates image filename: ${image}`);
        } else {
          projectImages.add(image);
        }

        if (hasImageFolder) {
          const publicPath = projectImagePath(project, image);
          if (imagePaths.has(publicPath)) {
            issues.push(
              `${label} duplicates image path from ${imagePaths.get(publicPath)}: ${publicPath}`
            );
          } else {
            imagePaths.set(publicPath, label);
          }
        }
      });
    }

    const hasFallback =
      project.fallbackImage !== null && project.fallbackImage !== undefined;
    if (hasFallback) {
      validatePublicPath(
        project.fallbackImage,
        "/images",
        `${label} fallbackImage`,
        issues
      );
    }

    if (
      Array.isArray(project.images) &&
      project.images.length === 0 &&
      !hasFallback
    ) {
      issues.push(`${label} must define fallbackImage when images is empty`);
    }
  });

  if (issues.length > 0) {
    throw new ProjectManifestError(issues);
  }

  return manifest;
}

function listProjectImageEntries(manifest, options = {}) {
  validateProjectManifest(manifest);
  const includeFallbacks = options.includeFallbacks === true;
  const entries = [];

  for (const project of manifest) {
    for (const image of project.images) {
      entries.push({
        projectId: project.id,
        publicPath: projectImagePath(project, image),
      });
    }

    if (includeFallbacks && project.fallbackImage) {
      entries.push({
        projectId: project.id,
        publicPath: project.fallbackImage,
      });
    }
  }

  return entries;
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

const projectManifest = deepFreeze(validateProjectManifest(rawProjectManifest));

module.exports = {
  ProjectManifestError,
  listProjectImageEntries,
  projectImagePath,
  projectManifest,
  validateProjectManifest,
};

import fs from "node:fs";
import path from "node:path";
import {
  listProjectImageEntries,
  validateProjectManifest,
} from "../lib/project-image-manifest";

export class ProjectContentError extends Error {
  constructor(issues) {
    super(
      `Project content validation failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`
    );
    this.name = "ProjectContentError";
    this.issues = issues;
  }
}

export function publicPathToFile(publicDir, publicPath) {
  const root = path.resolve(publicDir);
  const resolved = path.resolve(root, `.${publicPath}`);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Public path escapes the public directory: ${publicPath}`);
  }
  return resolved;
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function validateProjectAssets({ manifest, publicDir }) {
  validateProjectManifest(manifest);
  const issues = [];

  for (const project of manifest) {
    const assets = [
      { kind: "logo", publicPath: project.logoPath },
      ...project.images.map((image) => ({
        kind: "image",
        publicPath: `${project.imageFolder}/${image}`,
      })),
    ];

    if (project.fallbackImage) {
      assets.push({ kind: "fallback", publicPath: project.fallbackImage });
    }

    for (const asset of assets) {
      const filePath = publicPathToFile(publicDir, asset.publicPath);
      if (!isFile(filePath)) {
        issues.push(
          `[${project.id}] missing ${asset.kind}: ${asset.publicPath}`
        );
      }
    }
  }

  if (issues.length > 0) {
    throw new ProjectContentError(issues);
  }

  return manifest;
}

export function uniqueBlurEntries(manifest) {
  const entriesByPath = new Map();
  for (const entry of listProjectImageEntries(manifest, {
    includeFallbacks: true,
  })) {
    if (!entriesByPath.has(entry.publicPath)) {
      entriesByPath.set(entry.publicPath, entry);
    }
  }
  return [...entriesByPath.values()];
}

export function expectedBlurKeys(manifest) {
  const keys = new Map();
  for (const entry of uniqueBlurEntries(manifest)) {
    keys.set(entry.publicPath, entry);
  }
  return keys;
}

export function validateBlurCoverage({ manifest, blurData }) {
  validateProjectManifest(manifest);
  const issues = [];
  const expected = expectedBlurKeys(manifest);

  if (
    blurData === null ||
    typeof blurData !== "object" ||
    Array.isArray(blurData)
  ) {
    throw new ProjectContentError(["[manifest] blur data must be an object"]);
  }

  for (const [key, entry] of expected) {
    const value = blurData[key];
    if (typeof value !== "string" || !value.startsWith("data:image/")) {
      issues.push(
        `[${entry.projectId}] missing generated blur key for ${entry.publicPath}: ${key}`
      );
    }
  }

  for (const key of Object.keys(blurData)) {
    if (!expected.has(key)) {
      issues.push(`[manifest] unexpected generated blur key: ${key}`);
    }
  }

  if (issues.length > 0) {
    throw new ProjectContentError(issues);
  }

  return blurData;
}

export function validateProjectContent({ manifest, publicDir, blurData }) {
  validateProjectAssets({ manifest, publicDir });
  validateBlurCoverage({ manifest, blurData });

  return {
    projectCount: manifest.length,
    imageCount: uniqueBlurEntries(manifest).length,
    blurKeyCount: Object.keys(blurData).length,
  };
}

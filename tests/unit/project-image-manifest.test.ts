import path from "node:path";
import productionBlurData from "@/lib/image-blur-data.json";
import {
  listProjectImageEntries,
  projectManifest,
  type ProjectManifestEntry,
  validateProjectManifest,
} from "@/lib/project-image-manifest";
import {
  validateBlurCoverage,
  validateProjectContent,
} from "@/scripts/project-content-validation";
import expectedProjectImagePaths from "@/tests/fixtures/expected-project-image-paths.json";
import fixtureBlurData from "@/tests/fixtures/project-content/image-blur-data.json";
import fixtureManifest from "@/tests/fixtures/project-content/manifest.json";
import { describe, expect, it } from "vitest";

type MutableProject = {
  -readonly [Key in keyof Omit<
    ProjectManifestEntry,
    "images" | "fallbackImage"
  >]: ProjectManifestEntry[Key];
} & {
  images: string[];
  fallbackImage?: string | null;
};

const fixturePublicDir = path.resolve(
  process.cwd(),
  "tests/fixtures/project-content/public"
);

function freshFixture(): MutableProject[] {
  return structuredClone(fixtureManifest) as MutableProject[];
}

describe("project image manifest schema", () => {
  it("accepts the valid fixture", () => {
    expect(() => validateProjectManifest(freshFixture())).not.toThrow();
  });

  it("rejects duplicate IDs and names", () => {
    const project = freshFixture()[0];
    const manifest = [project, { ...structuredClone(project) }];

    expect(() => validateProjectManifest(manifest)).toThrow(/duplicates id/);
    expect(() => validateProjectManifest(manifest)).toThrow(/duplicates name/);
  });

  it("rejects empty project names", () => {
    const manifest = freshFixture();
    manifest[0].name = "  ";

    expect(() => validateProjectManifest(manifest)).toThrow(
      /\[alpha\] name must be a non-empty string/
    );
  });

  const invalidPaths: Array<[string, Partial<MutableProject>]> = [
    ["filesystem path", { logoPath: "/Users/example/logo.png" }],
    ["folder traversal", { imageFolder: "/images/../logos" }],
    ["filename traversal", { images: ["../one.jpg"] }],
    ["Windows path", { fallbackImage: "C:\\images\\fallback.jpg" }],
  ];

  it.each(invalidPaths)("rejects %s", (_label, replacement) => {
    const manifest = freshFixture();
    Object.assign(manifest[0], replacement);

    expect(() => validateProjectManifest(manifest)).toThrow(
      /path|traversal|separator|start/
    );
  });

  it("allows an empty image array only when a valid fallback exists", () => {
    const withoutFallback = freshFixture();
    withoutFallback[0].images = [];

    expect(() => validateProjectManifest(withoutFallback)).toThrow(
      /\[alpha\] must define fallbackImage/
    );

    const withFallback = freshFixture();
    withFallback[0].images = [];
    withFallback[0].fallbackImage = "/images/Alpha/fallback.jpg";

    expect(() => validateProjectManifest(withFallback)).not.toThrow();
  });
});

describe("project content validation", () => {
  it("validates the repository content and complete generated blur map", () => {
    expect(
      validateProjectContent({
        manifest: projectManifest,
        publicDir: path.resolve(process.cwd(), "public"),
        blurData: productionBlurData,
      })
    ).toEqual({ projectCount: 4, imageCount: 11, blurKeyCount: 22 });
  });

  it("proves parity with the expected ordered 11 image paths", () => {
    const paths = listProjectImageEntries(projectManifest).map(
      (entry) => entry.publicPath
    );

    expect(paths).toEqual(expectedProjectImagePaths);
  });

  it("reports a missing logo with its project and public path", () => {
    const manifest = freshFixture();
    manifest[0].logoPath = "/logos/missing.png";

    expect(() =>
      validateProjectContent({
        manifest,
        publicDir: fixturePublicDir,
        blurData: fixtureBlurData,
      })
    ).toThrow(/\[alpha\] missing logo: \/logos\/missing\.png/);
  });

  it("reports a missing image with its project and public path", () => {
    const manifest = freshFixture();
    manifest[0].images = ["missing.jpg"];

    expect(() =>
      validateProjectContent({
        manifest,
        publicDir: fixturePublicDir,
        blurData: fixtureBlurData,
      })
    ).toThrow(/\[alpha\] missing image: \/images\/Alpha\/missing\.jpg/);
  });

  it("validates a real fallback asset and its blur coverage", () => {
    const manifest = freshFixture();
    manifest[0].images = [];
    manifest[0].fallbackImage = "/images/Alpha/fallback.jpg";
    const blurData = {
      "/images/Alpha/fallback.jpg": "data:image/jpeg;base64,fixture",
      "images/Alpha/fallback.jpg": "data:image/jpeg;base64,fixture",
    };

    expect(
      validateProjectContent({
        manifest,
        publicDir: fixturePublicDir,
        blurData,
      })
    ).toEqual({ projectCount: 1, imageCount: 1, blurKeyCount: 2 });
  });

  it("fails when blur coverage is missing or stale", () => {
    const manifest = freshFixture();

    expect(() => validateBlurCoverage({ manifest, blurData: {} })).toThrow(
      /\[alpha\] missing generated blur key for \/images\/Alpha\/one\.jpg/
    );

    expect(() =>
      validateBlurCoverage({
        manifest,
        blurData: {
          ...fixtureBlurData,
          "/images/stale.jpg": "data:image/jpeg;base64,stale",
        },
      })
    ).toThrow(
      /\[manifest\] unexpected generated blur key: \/images\/stale\.jpg/
    );
  });
});

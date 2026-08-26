const path = require("path");
const blurData = require("../lib/image-blur-data.json");
const { projectManifest } = require("../lib/project-image-manifest");
const { validateProjectContent } = require("./project-content-validation");

function main() {
  const result = validateProjectContent({
    manifest: projectManifest,
    publicDir: path.join(__dirname, "..", "public"),
    blurData,
  });

  console.log(
    `✓ Project content valid: ${result.projectCount} projects, ${result.imageCount} images, ${result.blurKeyCount} blur keys`
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

import path from "node:path";
import { fileURLToPath } from "node:url";
import blurData from "../lib/image-blur-data.json";
import { projectManifest } from "../lib/project-image-manifest";
import { validateProjectContent } from "./project-content-validation";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

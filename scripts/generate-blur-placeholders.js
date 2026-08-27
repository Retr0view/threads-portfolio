import { getPlaiceholder } from "plaiceholder";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projectManifest } from "../lib/project-image-manifest";
import {
  publicPathToFile,
  uniqueBlurEntries,
  validateBlurCoverage,
  validateProjectAssets,
} from "./project-content-validation";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function writeFileIfChanged(outputPath, content) {
  const currentContent = fs.existsSync(outputPath)
    ? fs.readFileSync(outputPath, "utf8")
    : null;

  if (currentContent === content) {
    return false;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);
  return true;
}

async function generateBlurPlaceholders() {
  const blurDataMap = {};
  const publicDir = path.join(__dirname, "..", "public");

  validateProjectAssets({ manifest: projectManifest, publicDir });

  console.log("Generating blur placeholders...");

  for (const entry of uniqueBlurEntries(projectManifest)) {
    const imagePath = publicPathToFile(publicDir, entry.publicPath);

    try {
      const { base64 } = await getPlaiceholder(imagePath, { size: 10 });
      blurDataMap[entry.publicPath] = base64;
      console.log(`✓ Generated blur for: ${entry.publicPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `[${entry.projectId}] failed generating blur for ${entry.publicPath}: ${message}`
      );
    }
  }

  validateBlurCoverage({ manifest: projectManifest, blurData: blurDataMap });

  // Write to output file
  const outputPath = path.join(__dirname, "..", "lib", "image-blur-data.json");
  const changed = writeFileIfChanged(
    outputPath,
    `${JSON.stringify(blurDataMap, null, 2)}\n`
  );
  console.log(
    `\n✓ Blur placeholders generated: ${uniqueBlurEntries(projectManifest).length} images`
  );
  console.log(
    `${changed ? "✓ Output written to" : "✓ Output already current at"}: ${outputPath}`
  );
}

generateBlurPlaceholders().catch((error) => {
  console.error("Error generating blur placeholders:", error);
  process.exit(1);
});

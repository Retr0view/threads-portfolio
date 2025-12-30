const { getPlaiceholder } = require('plaiceholder');
const fs = require('fs');
const path = require('path');

// Work groups data - matches lib/work-groups.ts structure
const workGroups = [
  {
    imageFolder: "/images/Neutron Rebrand",
    images: [
      "neutron brand 1.jpg",
      "neutron brand 2.jpg",
      "neutron brand 3.jpg",
    ],
  },
  {
    imageFolder: "/images/Neutron UI",
    images: [
      "neutron app 1.jpg",
      "neutron app 2.jpg",
      "neutron app 3.jpg",
    ],
  },
  {
    imageFolder: "/images/Structured",
    images: [
      "structured brand 1.jpg",
      "structured brand 2.jpg",
      "structured brand 3.jpg",
    ],
  },
  {
    imageFolder: "/images/Highlight",
    images: [
      "Highlight casestudy 1.jpg",
      "Highlight casestudy 2.jpg",
    ],
  },
];

async function generateBlurPlaceholders() {
  const blurDataMap = {};
  const publicDir = path.join(__dirname, '..', 'public');
  
  console.log('Generating blur placeholders...');
  
  for (const workGroup of workGroups) {
    for (const image of workGroup.images) {
      // Construct full image path
      const imagePath = path.join(publicDir, workGroup.imageFolder.replace('/images/', 'images/'), image);
      
      // Create key with leading slash (matches how images are used in the app)
      const key = `${workGroup.imageFolder}/${image}`;
      const keyWithoutSlash = key.substring(1); // Also store without leading slash for lookup flexibility
      
      try {
        // Check if image exists
        if (!fs.existsSync(imagePath)) {
          console.warn(`⚠️  Image not found: ${imagePath}`);
          continue;
        }
        
        // Generate blur placeholder
        const { base64 } = await getPlaiceholder(imagePath, { size: 10 });
        
        // Store with both path formats for flexible lookup
        blurDataMap[key] = base64;
        blurDataMap[keyWithoutSlash] = base64;
        
        console.log(`✓ Generated blur for: ${key}`);
      } catch (error) {
        console.error(`✗ Error processing ${imagePath}:`, error.message);
      }
    }
  }
  
  // Write to output file
  const outputPath = path.join(__dirname, '..', 'lib', 'image-blur-data.json');
  const outputDir = path.dirname(outputPath);
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(blurDataMap, null, 2));
  console.log(`\n✓ Blur placeholders generated: ${Object.keys(blurDataMap).length / 2} images`);
  console.log(`✓ Output written to: ${outputPath}`);
}

generateBlurPlaceholders().catch((error) => {
  console.error('Error generating blur placeholders:', error);
  process.exit(1);
});



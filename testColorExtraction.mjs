// testColorExtraction.mjs - Test color extraction without API calls
// Use this to verify node-vibrant is working before running the full generator

import { promises as fs } from "fs";
import path from "path";

// Dynamic import for node-vibrant v4
let Vibrant;

async function initVibrant() {
  const vibrantModule = await import("node-vibrant/node");
  Vibrant = vibrantModule.default || vibrantModule.Vibrant || vibrantModule;
  return Vibrant;
}

const CONFIG = {
  inputDir: "./input_dir",
  testLimit: 5, // Only test first 5 images
};

function hexToRgba(hex, alpha = 1) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(128, 128, 128, ${alpha})`;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
    result[3],
    16
  )}, ${alpha})`;
}

async function testImage(imagePath, vibrantInstance) {
  const filename = path.basename(imagePath);
  console.log(`\n📸 Testing: ${filename}`);

  try {
    // Extract palette
    const palette = await vibrantInstance.from(imagePath).getPalette();

    // Display results
    console.log(`\n  🎨 Color Palette:`);
    console.log(`     Vibrant:      ${palette.Vibrant?.hex || "N/A"}`);
    console.log(`     Dark Vibrant: ${palette.DarkVibrant?.hex || "N/A"}`);
    console.log(`     Light Vibrant:${palette.LightVibrant?.hex || "N/A"}`);
    console.log(`     Muted:        ${palette.Muted?.hex || "N/A"}`);
    console.log(`     Dark Muted:   ${palette.DarkMuted?.hex || "N/A"}`);
    console.log(`     Light Muted:  ${palette.LightMuted?.hex || "N/A"}`);

    // Preview gradient that would be generated
    const vibrant = palette.Vibrant?.hex || "#808080";
    const darkVibrant = palette.DarkVibrant?.hex || "#404040";
    const lightVibrant = palette.LightVibrant?.hex || "#c0c0c0";

    const vibrantRgba = hexToRgba(vibrant, 0.4);
    const darkVibrantRgba = hexToRgba(darkVibrant, 0.5);
    const lightVibrantRgba = hexToRgba(lightVibrant, 0.3);

    console.log(`\n  🌈 Generated Gradient Preview:`);
    console.log(
      `     radial-gradient(circle at 20% 30%, ${vibrantRgba} 0%, transparent 50%),`
    );
    console.log(
      `     radial-gradient(circle at 80% 70%, ${darkVibrantRgba} 0%, transparent 40%),`
    );
    console.log(
      `     radial-gradient(circle at 60% 10%, ${lightVibrantRgba} 0%, transparent 45%)`
    );

    console.log(`\n  ✅ Success!`);
    return true;
  } catch (error) {
    console.error(`\n  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🧪 COLOR EXTRACTION TEST                          ║
║   Tests node-vibrant without using Gemini API            ║
╚═══════════════════════════════════════════════════════════╝
`);

  // Check input directory
  try {
    await fs.access(CONFIG.inputDir);
    console.log(`✅ Found input directory: ${CONFIG.inputDir}`);
  } catch (error) {
    console.error(`❌ ERROR: Input directory "${CONFIG.inputDir}" does not exist!`);
    console.log(`\n💡 Create it with: mkdir ${CONFIG.inputDir}`);
    console.log(`   Then add some test images\n`);
    process.exit(1);
  }

  // Initialize Vibrant
  console.log(`\n🎨 Initializing node-vibrant...`);
  let vibrantInstance;
  try {
    vibrantInstance = await initVibrant();
    console.log(`✅ node-vibrant loaded successfully`);
  } catch (error) {
    console.error(`❌ ERROR: Could not load node-vibrant:`, error.message);
    console.log(`\n💡 Install it with: npm install node-vibrant\n`);
    process.exit(1);
  }

  // Get image files
  const files = await fs.readdir(CONFIG.inputDir);
  const imageFiles = files
    .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .slice(0, CONFIG.testLimit);

  if (imageFiles.length === 0) {
    console.error(`\n❌ ERROR: No image files found in ${CONFIG.inputDir}!`);
    console.log(`\n💡 Supported formats: .jpg, .jpeg, .png, .gif, .webp\n`);
    process.exit(1);
  }

  console.log(`\n📊 Testing ${imageFiles.length} images (limit: ${CONFIG.testLimit})`);
  console.log(`\n${"=".repeat(60)}\n`);

  let successCount = 0;

  // Test each image
  for (const file of imageFiles) {
    const imagePath = path.join(CONFIG.inputDir, file);
    const success = await testImage(imagePath, vibrantInstance);
    if (success) successCount++;
    console.log(`\n${"-".repeat(60)}`);
  }

  console.log(`
${"=".repeat(60)}

🎉 Test Complete!

📊 Results: ${successCount}/${imageFiles.length} images processed successfully

${
  successCount === imageFiles.length
    ? `
✅ All tests passed! node-vibrant is working perfectly.

🚀 Next steps:
   1. Create a .env file with your Gemini API key
   2. Run the full generator: npm run generate
   3. Watch your cards come to life!
`
    : `
⚠️  Some images failed to process.

💡 Possible causes:
   - Corrupted image files
   - Unsupported color format
   - File permissions issues

Try with different images or check the errors above.
`
}
${"=".repeat(60)}
`);
}

main().catch((error) => {
  console.error(`\n❌ FATAL ERROR:`, error);
  console.error(error.stack);
  process.exit(1);
});

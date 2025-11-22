// unifiedCardGenerator.mjs - UPDATED VERSION
// Unified Move + Flavor Text Generation based on image analysis
// For processing EXISTING images

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let Vibrant;
async function initVibrant() {
  const vibrantModule = await import("node-vibrant/node");
  Vibrant = vibrantModule.default || vibrantModule.Vibrant || vibrantModule;
  return Vibrant;
}

const CONFIG = {
  inputDir: "./input_dir",
  outputDir: "./generated-cards",
  baseUrl: "https://howlonghasitben.github.io/surf-works",
  externalUrl: "https://howlonghasitben.github.io/surf-works",
  imageBasePath: "/images/card-images",
  artist: "SURF FINANCE STUDIOS",
  collection: "Waves Collection",
  geminiModel: "gemini-2.0-flash-exp",
  delayMs: 4000,
  maxImages: 300,
  defaultStats: {
    level: "1",
    attack: "3",
    defense: "3",
    hp: "5",
    manaCost: "2",
    terrain: "?",
  },
};

// ==================== COLOR UTILITIES ====================

function hexToRgba(hex, alpha = 1) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(128, 128, 128, ${alpha})`;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(
    result[2],
    16
  )}, ${parseInt(result[3], 16)}, ${alpha})`;
}

function getBestTextColor(hexColor) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
  if (!result) return "#ffffff";
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

function formatThemeName(themeName) {
  return themeName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// ==================== MOVE + FLAVOR TEXT GENERATION ====================

async function generateMoveAndFlavorText(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

    const { text } = await generateText({
      model: google(CONFIG.geminiModel),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: base64Image, mimeType },
            {
              type: "text",
              text: `You are creating content for a fantasy trading card game. Study this creature image carefully.

Your task is to create TWO things that work together:

1. **ONE SIGNATURE MOVE** - A unique ability or attack this creature would use based on what you see
   - Must be 2-5 words
   - Should be evocative and memorable
   - Should relate directly to the creature's visual appearance
   - Examples: "Tidal Devastation", "Shadow Consumption", "Prismatic Burst", "Bone Shatter"

2. **FLAVOR TEXT** - A dramatic 1-2 sentence description that:
   - References or hints at the signature move
   - Describes the impact/effect of witnessing this move
   - Uses vivid, atmospheric language
   - Makes the reader FEEL something (dread, awe, terror, wonder)
   - NEVER uses quotation marks
   - NEVER mentions character names or made-up proper nouns
   - NEVER describes the image literally

EXCELLENT EXAMPLES:

Move: "Void Collapse"
Flavor: "Where its presence lingers, light itself forgets how to exist. Those who witness the collapse speak only in whispers, if they speak at all."

Move: "Crimson Requiem" 
Flavor: "The final notes echo through battlefields long after the last warrior falls. Some say the song never truly ends."

Move: "Fracture Reality"
Flavor: "In the space between heartbeats, the world splits into a thousand reflections, each more wrong than the last."

Move: "Eternal Hunger"
Flavor: "It doesn't devour flesh or bone—it consumes the very concept of satiation, leaving only endless want."

BAD EXAMPLES (avoid these):

Move: "Big Attack"
Flavor: "This powerful creature dominates the battlefield with its strength."

Move: "Fire Breath" 
Flavor: "The dragon breathes fire and burns everything."

Now, respond in this EXACT format:
MOVE: [Your 2-5 word signature move]
FLAVOR: [Your 1-2 sentence flavor text]`,
            },
          ],
        },
      ],
    });

    // Parse the response
    const lines = text.trim().split('\n');
    let moveName = null;
    let flavorText = null;

    for (const line of lines) {
      if (line.startsWith('MOVE:')) {
        moveName = line.replace('MOVE:', '').trim().replace(/^["']|["']$/g, '');
      } else if (line.startsWith('FLAVOR:')) {
        flavorText = line.replace('FLAVOR:', '').trim().replace(/^["']|["']$/g, '');
      }
    }

    if (!moveName || !flavorText) {
      console.log(`  ⚠️  Failed to parse response, using defaults`);
      return {
        move: "Signature Move",
        flavorText: "A legendary ability that echoes through time."
      };
    }

    return {
      move: moveName,
      flavorText: flavorText
    };
  } catch (error) {
    console.error(`  ❌ Error generating move and flavor text:`, error.message);
    return null;
  }
}

// ==================== THEME GENERATION ====================

function generateCardTheme(palette, imageName) {
  const colors = {
    vibrant: palette.Vibrant?.hex || "#808080",
    darkVibrant: palette.DarkVibrant?.hex || "#404040",
    lightVibrant: palette.LightVibrant?.hex || "#c0c0c0",
    muted: palette.Muted?.hex || "#808080",
    darkMuted: palette.DarkMuted?.hex || "#404040",
    lightMuted: palette.LightMuted?.hex || "#c0c0c0",
  };

  const vibrantRgba = hexToRgba(colors.vibrant, 0.4);
  const darkVibrantRgba = hexToRgba(colors.darkVibrant, 0.5);
  const lightVibrantRgba = hexToRgba(colors.lightVibrant, 0.3);
  const mutedRgba = hexToRgba(colors.muted, 0.4);

  return {
    name: imageName,
    colors: colors,
    theme: {
      background: `radial-gradient(circle at 20% 30%, ${vibrantRgba} 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${darkVibrantRgba} 0%, transparent 40%), radial-gradient(circle at 60% 10%, ${lightVibrantRgba} 0%, transparent 45%), linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant}, ${colors.muted})`,
      header: {
        background: `radial-gradient(circle at 25% 50%, ${vibrantRgba} 0%, transparent 60%), radial-gradient(circle at 75% 50%, ${mutedRgba} 0%, transparent 60%), linear-gradient(135deg, ${colors.vibrant}, ${colors.muted}, ${colors.lightVibrant}, ${colors.vibrant}, ${colors.darkVibrant})`,
        color: getBestTextColor(colors.vibrant),
        textShadow: `2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px ${hexToRgba(
          colors.vibrant,
          0.6
        )}`,
        boxShadow: `0 min(0.5vw, 4px) min(1.8vw, 15px) ${hexToRgba(
          colors.vibrant,
          0.4
        )}, inset 0 min(0.25vw, 2px) 0 ${hexToRgba(colors.lightVibrant, 0.3)}`,
      },
      imageArea: {
        background: `radial-gradient(circle at 30% 20%, ${vibrantRgba} 0%, transparent 45%), radial-gradient(circle at 70% 80%, ${darkVibrantRgba} 0%, transparent 50%), linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant}, ${colors.muted})`,
        border: `min(0.25vw, 2px) solid ${colors.vibrant}`,
        boxShadow: `inset 0 min(0.5vw, 4px) min(1vw, 8px) rgba(0, 0, 0, 0.6), 0 0 min(2vw, 15px) ${hexToRgba(
          colors.vibrant,
          0.3
        )}`,
      },
      typeSection: {
        background: `radial-gradient(circle at 30% 60%, ${vibrantRgba} 0%, transparent 55%), radial-gradient(circle at 70% 60%, ${mutedRgba} 0%, transparent 55%), linear-gradient(135deg, ${colors.vibrant}, ${colors.muted}, ${colors.lightVibrant}, ${colors.vibrant}, ${colors.darkVibrant})`,
        color: getBestTextColor(colors.vibrant),
        textShadow: `2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px ${hexToRgba(
          colors.vibrant,
          0.6
        )}`,
      },
      flavorText: {
        background: `radial-gradient(circle at 40% 30%, ${vibrantRgba} 0%, transparent 50%), radial-gradient(circle at 60% 70%, ${mutedRgba} 0%, transparent 50%), linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant})`,
        color: colors.lightMuted,
        accentColor: colors.vibrant,
        border: `min(0.25vw, 2px) solid ${colors.vibrant}`,
      },
      bottomSection: {
        background: `linear-gradient(135deg, ${colors.darkVibrant}, ${colors.darkMuted})`,
      },
      stat: {
        background: hexToRgba(colors.darkVibrant, 0.8),
        border: `min(0.25vw, 2px) solid ${colors.vibrant}`,
        color: colors.lightVibrant,
        boxShadow: `0 0 min(1vw, 8px) ${hexToRgba(colors.vibrant, 0.5)}`,
      },
      rarity: {
        background: `linear-gradient(135deg, ${colors.vibrant}, ${colors.muted})`,
        color: getBestTextColor(colors.vibrant),
        border: `min(0.25vw, 2px) solid ${colors.darkVibrant}`,
        boxShadow: `0 0 min(1.2vw, 10px) ${hexToRgba(colors.vibrant, 0.6)}`,
      },
    },
  };
}

// ==================== CARD DATA GENERATION ====================

function generateCardData(imageName, imageExt, theme, moveData) {
  const themeKey = imageName
    .split(/[-_\s]/)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
  const displayName = imageName
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    id: imageName.toLowerCase().replace(/[^a-z0-9]/g, ""),
    name: displayName,
    subtitle: `⟨${moveData.move}⟩`,
    level: CONFIG.defaultStats.level,
    theme: themeKey,
    manaCost: [
      {
        type: "hp",
        value: CONFIG.defaultStats.hp,
        color: "radial-gradient(circle, #dc143c, #8b0000)",
        textColor: "#ffffff",
      },
      {
        type: "mana",
        value: CONFIG.defaultStats.manaCost,
        color: "radial-gradient(circle, #4169e1, #0000cd)",
        textColor: "#ffffff",
      },
      {
        type: "terrain",
        value: CONFIG.defaultStats.terrain,
        color: "radial-gradient(circle, #32cd32, #228b22)",
        textColor: "#ffffff",
      },
    ],
    image: `${CONFIG.imageBasePath}/${imageName}${imageExt}`,
    type: "Creature — Generated",
    stats: {
      attack: CONFIG.defaultStats.attack,
      defense: CONFIG.defaultStats.defense,
    },
    flavorText: moveData.flavorText,
    artist: CONFIG.artist,
    rarity: "1/1",
  };
}

// ==================== METADATA GENERATION ====================

function generateMetadata(cardData, is1of1 = true) {
  const rarity = is1of1 ? "1/1" : "Common";
  const showRarity = is1of1;

  const metadata = {
    name: `${cardData.name} ${cardData.subtitle}`.trim(),
    description: `${is1of1 ? "1/1 Legendary" : "Common"} Card from the ${
      CONFIG.collection
    }. ${cardData.flavorText}`,
    image: `${CONFIG.baseUrl}${cardData.image}`,
    animation_url: `${CONFIG.baseUrl}/card.html?id=${cardData.id}&showRarity=${showRarity}`,
    external_url: CONFIG.externalUrl,
    attributes: [
      { trait_type: "Rarity", value: rarity },
      { trait_type: "Level", value: cardData.level },
    ],
  };

  if (cardData.stats) {
    metadata.attributes.push(
      { trait_type: "Attack", value: cardData.stats.attack },
      { trait_type: "Defense", value: cardData.stats.defense }
    );
  }

  metadata.attributes.push(
    { trait_type: "Theme", value: formatThemeName(cardData.theme) },
    { trait_type: "Type", value: cardData.type },
    { trait_type: "Artist", value: cardData.artist },
    { trait_type: "Collection", value: CONFIG.collection }
  );

  if (cardData.manaCost && cardData.manaCost.length === 3) {
    metadata.attributes.push(
      { trait_type: "Health Points", value: cardData.manaCost[0].value },
      { trait_type: "Mana Cost", value: cardData.manaCost[1].value },
      { trait_type: "Terrain", value: cardData.manaCost[2].value }
    );
  }

  return metadata;
}

// ==================== IMAGE PROCESSING ====================

async function processImage(imagePath, vibrantInstance) {
  const filename = path.basename(imagePath);
  const imageName = path.parse(filename).name;
  const imageExt = path.extname(filename);

  console.log(`\n📸 Processing: ${filename}`);

  try {
    console.log(`  🎨 Extracting color palette...`);
    const palette = await vibrantInstance.from(imagePath).getPalette();

    console.log(`  ✍️  Analyzing image and generating move + flavor text...`);
    const moveData = await generateMoveAndFlavorText(imagePath);

    if (!moveData) {
      console.log(`  ⚠️  Using default move and flavor text`);
      moveData = {
        move: "Signature Move",
        flavorText: "A legendary ability that echoes through time."
      };
    } else {
      console.log(`  🎯 Move: "${moveData.move}"`);
      console.log(`  ✅ Flavor: "${moveData.flavorText}"`);
    }

    console.log(`  🎭 Creating theme object...`);
    const theme = generateCardTheme(palette, imageName);

    console.log(`  🃏 Creating card data...`);
    const cardData = generateCardData(imageName, imageExt, theme, moveData);

    console.log(`  📝 Creating metadata files...`);
    const metadata1of1 = generateMetadata(cardData, true);
    const metadataCommon = generateMetadata(cardData, false);

    console.log(`  ✅ Complete!`);

    return {
      success: true,
      imageName,
      theme,
      cardData,
      moveData,
      metadata1of1,
      metadataCommon,
    };
  } catch (error) {
    console.error(`  ❌ Error processing ${filename}:`, error.message);
    return null;
  }
}

// ==================== FILE OUTPUT ====================

async function saveThemeFile(themes) {
  const themeObject = {};
  themes.forEach((t) => {
    const key = t.name
      .split(/[-_\s]/)
      .map((word, i) =>
        i === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join("");
    themeObject[key] = t.theme;
  });

  const content = `// Auto-generated themes from unifiedCardGenerator.mjs\nexport const GENERATED_THEMES = ${JSON.stringify(
    themeObject,
    null,
    2
  )};\n`;
  await fs.writeFile(
    path.join(CONFIG.outputDir, "generatedThemes.js"),
    content
  );
  console.log(`✅ Saved: ${CONFIG.outputDir}/generatedThemes.js`);
}

async function saveCardDataFile(cardDataArray) {
  const content = `// Auto-generated card data from unifiedCardGenerator.mjs\nexport const GENERATED_CARDS = ${JSON.stringify(
    cardDataArray,
    null,
    2
  )};\n`;
  await fs.writeFile(
    path.join(CONFIG.outputDir, "generatedCardData.js"),
    content
  );
  console.log(`✅ Saved: ${CONFIG.outputDir}/generatedCardData.js`);
}

async function saveMetadataFiles(results) {
  const metadataDir = path.join(CONFIG.outputDir, "metadata");
  await fs.mkdir(metadataDir, { recursive: true });

  for (const result of results) {
    const { cardData, metadata1of1, metadataCommon } = result;
    await fs.writeFile(
      path.join(metadataDir, `${cardData.id}-1of1.json`),
      JSON.stringify(metadata1of1, null, 2)
    );
    await fs.writeFile(
      path.join(metadataDir, `${cardData.id}-common.json`),
      JSON.stringify(metadataCommon, null, 2)
    );
  }

  console.log(
    `✅ Saved: ${results.length * 2} metadata files in ${metadataDir}/`
  );
}

async function saveFlavorTextFile(results) {
  const flavorTextMap = {};
  const movesMap = {};
  results.forEach((r) => {
    flavorTextMap[path.basename(r.cardData.image)] = r.cardData.flavorText;
    movesMap[path.basename(r.cardData.image)] = r.moveData.move;
  });

  await fs.writeFile(
    path.join(CONFIG.outputDir, "flavorTexts.json"),
    JSON.stringify(flavorTextMap, null, 2)
  );
  await fs.writeFile(
    path.join(CONFIG.outputDir, "signatureMoves.json"),
    JSON.stringify(movesMap, null, 2)
  );
  console.log(`✅ Saved: ${CONFIG.outputDir}/flavorTexts.json & signatureMoves.json`);
}

// ==================== MAIN PROCESS ====================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║       🎴 UNIFIED CARD GENERATOR - UPDATED 🎴             ║
║   Move + Flavor Text Generated Together From Image!     ║
╚═══════════════════════════════════════════════════════════╝
`);

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error(
      `❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY not found in .env file`
    );
    console.log(
      `\n💡 Create a .env file with: GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here\n`
    );
    process.exit(1);
  }

  try {
    await fs.access(CONFIG.inputDir);
    console.log(`✅ Found input directory: ${CONFIG.inputDir}`);
  } catch (error) {
    console.error(
      `❌ ERROR: Input directory "${CONFIG.inputDir}" does not exist!`
    );
    console.log(`\n💡 Create it with: mkdir ${CONFIG.inputDir}`);
    console.log(`   Then add your card images (.jpg, .png, .webp, .gif)\n`);
    process.exit(1);
  }

  console.log(`🎨 Initializing node-vibrant...`);
  let vibrantInstance;
  try {
    vibrantInstance = await initVibrant();
    console.log(`✅ node-vibrant loaded`);
  } catch (error) {
    console.error(`❌ ERROR: Could not load node-vibrant:`, error.message);
    console.log(`\n💡 Install it with: npm install node-vibrant\n`);
    process.exit(1);
  }

  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  console.log(`✅ Created output directory: ${CONFIG.outputDir}`);

  const files = await fs.readdir(CONFIG.inputDir);
  const imageFiles = files
    .filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    .slice(0, CONFIG.maxImages);

  if (imageFiles.length === 0) {
    console.error(`\n❌ ERROR: No image files found in ${CONFIG.inputDir}!`);
    console.log(`\n💡 Supported formats: .jpg, .jpeg, .png, .gif, .webp\n`);
    process.exit(1);
  }

  console.log(`\n📊 Found ${imageFiles.length} images to process`);
  console.log(`🎯 Each card gets a signature move + connected flavor text!`);
  console.log(`⏱️  Rate limit: ${CONFIG.delayMs}ms between Gemini API calls\n`);

  const allResults = [];
  let processed = 0;

  for (const file of imageFiles) {
    const imagePath = path.join(CONFIG.inputDir, file);
    const result = await processImage(imagePath, vibrantInstance);

    if (result) {
      allResults.push(result);
    }

    processed++;
    console.log(
      `\n[${processed}/${imageFiles.length}] Progress: ${Math.round(
        (processed / imageFiles.length) * 100
      )}%`
    );

    if (processed < imageFiles.length) {
      console.log(`⏳ Waiting ${CONFIG.delayMs}ms before next API call...`);
      await sleep(CONFIG.delayMs);
    }
  }

  if (allResults.length === 0) {
    console.error(`\n❌ ERROR: No cards were successfully generated!\n`);
    process.exit(1);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n📝 Generating output files...\n`);

  const allThemes = allResults.map((r) => r.theme);
  const allCardData = allResults.map((r) => r.cardData);

  await saveThemeFile(allThemes);
  await saveCardDataFile(allCardData);
  await saveMetadataFiles(allResults);
  await saveFlavorTextFile(allResults);

  console.log(`
${"=".repeat(60)}

🎉 SUCCESS! Generated ${allResults.length} complete cards!

🎯 NEW SYSTEM Features:
   - Each card analyzed by AI for visual details
   - Signature move generated based on creature appearance
   - Flavor text directly references the move
   - Everything feels cohesive and connected!

📁 Output files:
   ├── ${CONFIG.outputDir}/generatedThemes.js
   ├── ${CONFIG.outputDir}/generatedCardData.js
   ├── ${CONFIG.outputDir}/flavorTexts.json
   ├── ${CONFIG.outputDir}/signatureMoves.json (NEW!)
   └── ${CONFIG.outputDir}/metadata/ (${allResults.length * 2} files)

${"=".repeat(60)}
`);
}

main().catch((error) => {
  console.error(`\n❌ FATAL ERROR:`, error);
  console.error(error.stack);
  process.exit(1);
});

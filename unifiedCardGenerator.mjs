// unifiedCardGenerator.mjs - Complete card generation pipeline
// Combines: color extraction, flavor text generation, theme creation, card data, and metadata

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { promises as fs } from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Dynamic import for node-vibrant v4
let Vibrant;

async function initVibrant() {
  const vibrantModule = await import("node-vibrant/node");
  Vibrant = vibrantModule.default || vibrantModule.Vibrant || vibrantModule;
  return Vibrant;
}

// Configuration
const CONFIG = {
  inputDir: "./input_dir",
  outputDir: "./generated-cards",
  baseUrl: "https://howlonghasitben.github.io/surf-works",
  externalUrl: "https://howlonghasitben.github.io/surf-works",
  imageBasePath: "/images/card-images",
  artist: "SURF FINANCE STUDIOS",
  collection: "Waves Collection",
  geminiModel: "gemini-2.0-flash-exp",
  delayMs: 4000, // Rate limiting between Gemini API calls
  batchSize: 20, // Process images in batches
  maxImages: 300, // Limit total images to process
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
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
    result[3],
    16
  )}, ${alpha})`;
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

// ==================== FLAVOR TEXT GENERATION ====================

async function generateFlavorText(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

    // Randomly select a flavor text style for variety
    const styles = [
      {
        name: "Prophecy",
        prompt: "Write a cryptic prophecy or ancient legend about this creature in 1-2 sentences. Use poetic, archaic language that speaks of destiny and doom.",
      },
      {
        name: "Battle Moment",
        prompt: "Describe this creature's most terrifying or awe-inspiring moment in battle. Make it visceral, dramatic, and unforgettable in 1-2 sentences.",
      },
      {
        name: "Survivor's Tale",
        prompt: "Write what a survivor whispered about encountering this creature. Make it haunting, personal, and filled with dread in 1-2 sentences.",
      },
      {
        name: "Origin Myth",
        prompt: "Describe this creature's origin or the myth surrounding its creation. Use mystical, cosmic language in 1-2 sentences.",
      },
      {
        name: "Last Words",
        prompt: "Write the last coherent words or thoughts of someone who faced this creature. Make it chilling and powerful in 1-2 sentences.",
      },
      {
        name: "Sensory Horror",
        prompt: "Describe the sound, smell, or feeling of this creature's presence approaching. Use sensory, atmospheric language that builds dread in 1-2 sentences.",
      },
      {
        name: "Ancient Text",
        prompt: "Write what ancient texts or forbidden scrolls say about this creature. Use formal, ominous language in 1-2 sentences.",
      },
      {
        name: "Domain",
        prompt: "Describe this creature's lair or domain and what fate befalls those who enter. Make it atmospheric and foreboding in 1-2 sentences.",
      },
      {
        name: "Reputation",
        prompt: "Describe this creature's reputation among warriors, scholars, or common folk. Use dramatic, legend-building language in 1-2 sentences.",
      },
      {
        name: "Moment Before",
        prompt: "Describe the moment just before this creature strikes or reveals itself. Build tension and atmosphere in 1-2 sentences.",
      },
    ];

    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    console.log(`  📖 Style: ${randomStyle.name}`);

    const { text } = await generateText({
      model: google(CONFIG.geminiModel),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: base64Image, mimeType },
            {
              type: "text",
              text: `You are a master writer creating flavor text for a fantasy trading card game like Magic: The Gathering or Flesh and Blood. Study this creature carefully.

${randomStyle.prompt}

CRITICAL RULES:
- Maximum 2 sentences (can be 1 long, powerful sentence)
- NEVER use character names or made-up proper nouns
- NEVER use quotation marks in the text
- NEVER describe the image literally ("This creature has...", "The image shows...")
- Focus on EMOTION, ATMOSPHERE, and VISCERAL DETAILS
- Use evocative, poetic language that creates a mood
- Make it MEMORABLE and QUOTABLE
- Make the reader FEEL something (dread, awe, horror, wonder)

EXCELLENT flavor text examples:
"In the depths where light fears to tread, even the bravest whisper prayers to forgotten gods."
"The last thing its prey sees is not fangs, but their own reflection in eyes older than kingdoms."
"Some say it guards treasure. Those who return speak only of silence and the smell of copper."
"Where it walks, the earth remembers pain."
"Three things never return from the deep places: mercy, sanity, and those who seek them."

BAD examples (avoid these):
"This powerful creature dominates the battlefield."
"An ancient being of immense power."
"The dragon breathes fire and destroys everything."

Generate the flavor text now (NO quotation marks, NO explanation, just the flavor text):`,
            },
          ],
        },
      ],
    });

    // Clean up any quotation marks that might have been added
    const cleanText = text.replace(/^["']|["']$/g, "").trim();

    return cleanText;
  } catch (error) {
    console.error(`  ❌ Error generating flavor text:`, error.message);
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

  const theme = {
    name: imageName,
    colors: colors,
    theme: {
      background: `radial-gradient(circle at 20% 30%, ${vibrantRgba} 0%, transparent 50%),
         radial-gradient(circle at 80% 70%, ${darkVibrantRgba} 0%, transparent 40%),
         radial-gradient(circle at 60% 10%, ${lightVibrantRgba} 0%, transparent 45%),
         linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant}, ${colors.muted})`,

      header: {
        background: `radial-gradient(circle at 25% 50%, ${vibrantRgba} 0%, transparent 60%),
           radial-gradient(circle at 75% 50%, ${mutedRgba} 0%, transparent 60%),
           linear-gradient(135deg, ${colors.vibrant}, ${colors.muted}, ${colors.lightVibrant}, ${colors.vibrant}, ${colors.darkVibrant})`,
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
        background: `radial-gradient(circle at 30% 20%, ${vibrantRgba} 0%, transparent 45%),
           radial-gradient(circle at 70% 80%, ${darkVibrantRgba} 0%, transparent 50%),
           linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant}, ${colors.muted})`,
        border: `min(0.25vw, 2px) solid ${colors.vibrant}`,
        boxShadow: `inset 0 min(0.5vw, 4px) min(1vw, 8px) rgba(0, 0, 0, 0.6), 0 0 min(2vw, 15px) ${hexToRgba(
          colors.vibrant,
          0.3
        )}`,
      },

      typeSection: {
        background: `radial-gradient(circle at 30% 60%, ${vibrantRgba} 0%, transparent 55%),
           radial-gradient(circle at 70% 60%, ${mutedRgba} 0%, transparent 55%),
           linear-gradient(135deg, ${colors.vibrant}, ${colors.muted}, ${colors.lightVibrant}, ${colors.vibrant}, ${colors.darkVibrant})`,
        color: getBestTextColor(colors.vibrant),
        textShadow: `2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px ${hexToRgba(
          colors.vibrant,
          0.6
        )}`,
      },

      flavorText: {
        background: `radial-gradient(circle at 40% 30%, ${vibrantRgba} 0%, transparent 50%),
           radial-gradient(circle at 60% 70%, ${mutedRgba} 0%, transparent 50%),
           linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant})`,
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

  return theme;
}

// ==================== CARD DATA GENERATION ====================

function generateCardData(imageName, imageExt, theme, flavorText) {
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

  const cardData = {
    id: imageName.toLowerCase().replace(/[^a-z0-9]/g, ""),
    name: displayName,
    subtitle: "⟨Generated⟩",
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
    flavorText:
      flavorText ||
      `Auto-generated card from ${imageName}. Customize this text to make it unique!`,
    artist: CONFIG.artist,
    rarity: "1/1",
  };

  return cardData;
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
      {
        trait_type: "Rarity",
        value: rarity,
      },
      {
        trait_type: "Level",
        value: cardData.level,
      },
    ],
  };

  if (cardData.stats) {
    metadata.attributes.push(
      {
        trait_type: "Attack",
        value: cardData.stats.attack,
      },
      {
        trait_type: "Defense",
        value: cardData.stats.defense,
      }
    );
  }

  metadata.attributes.push(
    {
      trait_type: "Theme",
      value: formatThemeName(cardData.theme),
    },
    {
      trait_type: "Type",
      value: cardData.type,
    },
    {
      trait_type: "Artist",
      value: cardData.artist,
    },
    {
      trait_type: "Collection",
      value: CONFIG.collection,
    }
  );

  if (cardData.manaCost && cardData.manaCost.length === 3) {
    metadata.attributes.push(
      {
        trait_type: "Health Points",
        value: cardData.manaCost[0].value,
      },
      {
        trait_type: "Mana Cost",
        value: cardData.manaCost[1].value,
      },
      {
        trait_type: "Terrain",
        value: cardData.manaCost[2].value,
      }
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
    // Step 1: Extract color palette
    console.log(`  🎨 Extracting color palette...`);
    const palette = await vibrantInstance.from(imagePath).getPalette();

    // Step 2: Generate flavor text with Gemini
    console.log(`  ✍️  Generating flavor text with Gemini...`);
    const flavorText = await generateFlavorText(imagePath);

    if (!flavorText) {
      console.log(`  ⚠️  Using default flavor text`);
    } else {
      console.log(`  ✅ Flavor text: "${flavorText}"`);
    }

    // Step 3: Generate theme
    console.log(`  🎭 Creating theme object...`);
    const theme = generateCardTheme(palette, imageName);

    // Step 4: Generate card data
    console.log(`  🃏 Creating card data...`);
    const cardData = generateCardData(imageName, imageExt, theme, flavorText);

    // Step 5: Generate metadata (both 1/1 and common)
    console.log(`  📝 Creating metadata files...`);
    const metadata1of1 = generateMetadata(cardData, true);
    const metadataCommon = generateMetadata(cardData, false);

    console.log(`  ✅ Complete!`);

    return {
      success: true,
      imageName,
      theme,
      cardData,
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

  const content = `// Auto-generated themes from unifiedCardGenerator.mjs
export const GENERATED_THEMES = ${JSON.stringify(themeObject, null, 2)};
`;

  await fs.writeFile(
    path.join(CONFIG.outputDir, "generatedThemes.js"),
    content
  );
  console.log(`✅ Saved: ${CONFIG.outputDir}/generatedThemes.js`);
}

async function saveCardDataFile(cardDataArray) {
  const content = `// Auto-generated card data from unifiedCardGenerator.mjs
export const GENERATED_CARDS = ${JSON.stringify(cardDataArray, null, 2)};
`;

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
  results.forEach((r) => {
    flavorTextMap[path.basename(r.cardData.image)] = r.cardData.flavorText;
  });

  await fs.writeFile(
    path.join(CONFIG.outputDir, "flavorTexts.json"),
    JSON.stringify(flavorTextMap, null, 2)
  );
  console.log(`✅ Saved: ${CONFIG.outputDir}/flavorTexts.json`);
}

// ==================== MAIN PROCESS ====================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🎴 UNIFIED CARD GENERATOR 🎴                      ║
║   Complete Pipeline: Images → Cards → Metadata           ║
╚═══════════════════════════════════════════════════════════╝
`);

  // Check for API key
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error(`❌ ERROR: GOOGLE_GENERATIVE_AI_API_KEY not found in .env file`);
    console.log(`\n💡 Create a .env file with:`);
    console.log(`   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here\n`);
    process.exit(1);
  }

  // Check input directory
  try {
    await fs.access(CONFIG.inputDir);
    console.log(`✅ Found input directory: ${CONFIG.inputDir}`);
  } catch (error) {
    console.error(`❌ ERROR: Input directory "${CONFIG.inputDir}" does not exist!`);
    console.log(`\n💡 Create it with: mkdir ${CONFIG.inputDir}`);
    console.log(`   Then add your card images (.jpg, .png, .webp, .gif)\n`);
    process.exit(1);
  }

  // Initialize Vibrant
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

  // Create output directory
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  console.log(`✅ Created output directory: ${CONFIG.outputDir}`);

  // Get image files
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
  console.log(`⏱️  Rate limit: ${CONFIG.delayMs}ms between Gemini API calls`);
  console.log(`\n${"=".repeat(60)}\n`);

  const allResults = [];
  let processed = 0;

  // Process images one by one (to respect Gemini rate limits)
  for (const file of imageFiles) {
    const imagePath = path.join(CONFIG.inputDir, file);
    const result = await processImage(imagePath, vibrantInstance);

    if (result) {
      allResults.push(result);
    }

    processed++;
    console.log(`\n[${processed}/${imageFiles.length}] Progress: ${Math.round((processed / imageFiles.length) * 100)}%`);

    // Rate limiting (except for last image)
    if (processed < imageFiles.length) {
      console.log(`⏳ Waiting ${CONFIG.delayMs}ms before next API call...`);
      await sleep(CONFIG.delayMs);
    }
  }

  if (allResults.length === 0) {
    console.error(`\n❌ ERROR: No cards were successfully generated!\n`);
    process.exit(1);
  }

  // Save all output files
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

📁 Output files:
   ├── ${CONFIG.outputDir}/generatedThemes.js
   ├── ${CONFIG.outputDir}/generatedCardData.js
   ├── ${CONFIG.outputDir}/flavorTexts.json
   └── ${CONFIG.outputDir}/metadata/
       ├── *-1of1.json (${allResults.length} files)
       └── *-common.json (${allResults.length} files)

📝 Next steps:
   1. Review generated themes and card data
   2. Edit flavor text if needed (it's in the cardData)
   3. Customize stats, names, and attributes
   4. Import into your main cardData.js:
      import { GENERATED_THEMES } from './generated-cards/generatedThemes.js'
      import { GENERATED_CARDS } from './generated-cards/generatedCardData.js'
   5. Upload metadata files for NFT minting

💡 Tips:
   - Each card has a unique theme based on its color palette
   - Flavor text uses 10 different styles for variety!
   - Metadata includes both 1/1 and common versions
   - All files are ready for immediate use!

${"=".repeat(60)}
`);
}

// Run it
main().catch((error) => {
  console.error(`\n❌ FATAL ERROR:`, error);
  console.error(error.stack);
  process.exit(1);
});

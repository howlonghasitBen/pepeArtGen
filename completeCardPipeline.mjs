// completeCardPipeline.mjs - UPDATED VERSION
// Unified Move + Flavor Text Generation based on image analysis

import { GoogleGenAI } from "@google/genai";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { promises as fs } from "fs";
import path from "path";
import { Buffer } from "buffer";
import dotenv from "dotenv";

dotenv.config();

// Dynamic import for node-vibrant
let Vibrant;

async function initVibrant() {
  const vibrantModule = await import("node-vibrant/node");
  Vibrant = vibrantModule.default || vibrantModule.Vibrant || vibrantModule;
  return Vibrant;
}

// ==================== CONFIGURATION ====================

const CONFIG = {
  outputDir: "./complete-cards",
  imageOutputDir: "./complete-cards/generated-images",
  imagenModel: "imagen-4.0-generate-001",
  geminiModel: "gemini-2.5-flash-lite",
  numberOfCards: 10,
  imageAspectRatio: "16:9",
  delayBetweenImages: 5000,
  delayBetweenFlavorText: 4000,
  baseUrl: "https://howlonghasitben.github.io/surf-works",
  externalUrl: "https://howlonghasitben.github.io/surf-works",
  imageBasePath: "/images/card-images",
  artist: "SURF FINANCE STUDIOS",
  collection: "Waves Collection",
  defaultStats: {
    level: "1",
    attack: "3",
    defense: "3",
    hp: "5",
    manaCost: "2",
    terrain: "?",
  },
  promptMode: "dnd-monsters",
  customPrompts: [],
  imagePromptTemplate: (monsterName) =>
    `A high-resolution, detailed, digital art illustration of a ${monsterName} monster in the distinct visual style of "Pepe the Frog". Complete Background.`,
};

// ==================== D&D API ====================

const DND_API_URL = "https://www.dnd5eapi.co/api/monsters";

async function getRandomMonsterName() {
  console.log(`  🎲 Fetching D&D monster...`);
  const response = await fetch(DND_API_URL);
  if (!response.ok)
    throw new Error(`Failed to fetch monster list: ${response.statusText}`);
  const data = await response.json();
  const randomIndex = Math.floor(Math.random() * data.results.length);
  const monsterName = data.results[randomIndex].name;
  console.log(`  ✅ Selected: ${monsterName}`);
  return monsterName;
}

// ==================== IMAGE GENERATION ====================

async function generateImage(ai, prompt, filename) {
  console.log(`  🎨 Generating image...`);
  console.log(`  📝 Prompt: "${prompt.substring(0, 60)}..."`);
  try {
    const response = await ai.models.generateImages({
      model: CONFIG.imagenModel,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
        aspectRatio: CONFIG.imageAspectRatio,
      },
    });
    if (response.generatedImages?.[0]?.image?.imageBytes) {
      const base64Data = response.generatedImages[0].image.imageBytes;
      const buffer = Buffer.from(base64Data, "base64");
      const imagePath = path.join(CONFIG.imageOutputDir, `${filename}.png`);
      await fs.writeFile(imagePath, buffer);
      console.log(`  ✅ Image saved: ${filename}.png`);
      return imagePath;
    } else {
      console.warn(
        `  ⚠️  Image generation returned no data (may be policy violation)`
      );
      return null;
    }
  } catch (error) {
    console.error(`  ❌ Image generation error:`, error.message);
    return null;
  }
}

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

// ==================== COLOR EXTRACTION ====================

async function extractColors(imagePath, vibrantInstance) {
  console.log(`  🎨 Extracting color palette...`);
  try {
    const palette = await vibrantInstance.from(imagePath).getPalette();
    console.log(`  ✅ Colors extracted`);
    return palette;
  } catch (error) {
    console.error(`  ❌ Color extraction error:`, error.message);
    return null;
  }
}

// ==================== MOVE + FLAVOR TEXT GENERATION ====================

async function generateMoveAndFlavorText(imagePath) {
  console.log(`  ✍️  Analyzing image and generating move + flavor text...`);
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");

    const { text } = await generateText({
      model: google(CONFIG.geminiModel),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: base64Image, mimeType: "image/png" },
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

    console.log(`  🎯 Move: "${moveName}"`);
    console.log(`  ✅ Flavor: "${flavorText.substring(0, 60)}..."`);
    
    return {
      move: moveName,
      flavorText: flavorText
    };
  } catch (error) {
    console.error(`  ❌ Generation error:`, error.message);
    return null;
  }
}

// ==================== THEME GENERATION ====================

function generateCardTheme(palette, cardName) {
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
    name: cardName,
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

function generateCardData(cardName, filename, theme, moveData) {
  const themeKey = cardName
    .split(/[-_\s]/)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
  const displayName = cardName
    .split(/[-_\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const cardId = cardName.toLowerCase().replace(/[^a-z0-9]/g, "");

  return {
    id: cardId,
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
    image: `${CONFIG.imageBasePath}/${filename}.png`,
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

// ==================== FILE OUTPUT ====================

async function saveAllOutputs(results) {
  console.log(`\n📝 Saving output files...\n`);
  const allThemes = results.map((r) => r.theme);
  const allCardData = results.map((r) => r.cardData);

  const themeObject = {};
  allThemes.forEach((t) => {
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

  const themeContent = `// Auto-generated themes from completeCardPipeline.mjs\nexport const GENERATED_THEMES = ${JSON.stringify(
    themeObject,
    null,
    2
  )};\n`;
  await fs.writeFile(
    path.join(CONFIG.outputDir, "generatedThemes.js"),
    themeContent
  );
  console.log(`✅ Saved: generatedThemes.js`);

  const cardDataContent = `// Auto-generated card data from completeCardPipeline.mjs\nexport const GENERATED_CARDS = ${JSON.stringify(
    allCardData,
    null,
    2
  )};\n`;
  await fs.writeFile(
    path.join(CONFIG.outputDir, "generatedCardData.js"),
    cardDataContent
  );
  console.log(`✅ Saved: generatedCardData.js`);

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
  console.log(`✅ Saved: ${results.length * 2} metadata files`);

  const flavorTextMap = {};
  const movesMap = {};
  results.forEach((r) => {
    flavorTextMap[r.filename] = r.cardData.flavorText;
    movesMap[r.filename] = r.moveData.move;
  });
  await fs.writeFile(
    path.join(CONFIG.outputDir, "flavorTexts.json"),
    JSON.stringify(flavorTextMap, null, 2)
  );
  await fs.writeFile(
    path.join(CONFIG.outputDir, "signatureMoves.json"),
    JSON.stringify(movesMap, null, 2)
  );
  console.log(`✅ Saved: flavorTexts.json & signatureMoves.json`);
}

// ==================== MAIN PIPELINE ====================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processOneCard(ai, vibrantInstance, cardName, index, total) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📸 Card ${index + 1}/${total}: ${cardName}`);
  console.log(`${"=".repeat(60)}`);

  const filename = cardName.toLowerCase().replace(/[^a-z0-9]/g, "_");

  try {
    const prompt = CONFIG.imagePromptTemplate(cardName);
    const imagePath = await generateImage(ai, prompt, filename);
    if (!imagePath) {
      console.log(`  ⚠️  Skipping card due to image generation failure`);
      return null;
    }

    await sleep(1000);

    const palette = await extractColors(imagePath, vibrantInstance);
    if (!palette) {
      console.log(`  ⚠️  Skipping card due to color extraction failure`);
      return null;
    }

    const moveData = await generateMoveAndFlavorText(imagePath);
    if (!moveData) {
      console.log(`  ⚠️  Using default move and flavor text`);
      moveData = {
        move: "Signature Move",
        flavorText: "A legendary ability that echoes through time."
      };
    }

    console.log(`  🎭 Creating theme...`);
    const theme = generateCardTheme(palette, cardName);

    console.log(`  🃏 Creating card data...`);
    const cardData = generateCardData(cardName, filename, theme, moveData);

    console.log(`  📝 Creating metadata...`);
    const metadata1of1 = generateMetadata(cardData, true);
    const metadataCommon = generateMetadata(cardData, false);

    console.log(`  ✅ Card complete!`);

    return {
      success: true,
      cardName,
      filename,
      imagePath,
      theme,
      cardData,
      moveData,
      metadata1of1,
      metadataCommon,
    };
  } catch (error) {
    console.error(`  ❌ Error processing card:`, error.message);
    return null;
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🎴 COMPLETE CARD PIPELINE - UPDATED 🎴           ║
║   Move + Flavor Text Generated Together From Image!     ║
╚═══════════════════════════════════════════════════════════╝
`);

  if (!process.env.API_KEY) {
    console.error(`❌ ERROR: API_KEY not found in .env file`);
    console.log(
      `\n💡 Create a .env file with: API_KEY=your_google_ai_studio_key\n`
    );
    console.log(`Get your key: https://aistudio.google.com/app/apikey\n`);
    process.exit(1);
  }

  console.log(`🔧 Initializing APIs...`);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  console.log(`✅ GoogleGenAI initialized (Imagen + Gemini)`);

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
  await fs.mkdir(CONFIG.imageOutputDir, { recursive: true });
  console.log(`✅ Created output directories`);

  let cardNames = [];
  if (CONFIG.promptMode === "custom") {
    console.log(`\n📝 Using custom prompts (${CONFIG.customPrompts.length})`);
    cardNames = CONFIG.customPrompts
      .slice(0, CONFIG.numberOfCards)
      .map((p, i) => `custom_${i + 1}`);
  } else {
    console.log(`\n🎲 Fetching ${CONFIG.numberOfCards} D&D monsters...`);
    for (let i = 0; i < CONFIG.numberOfCards; i++) {
      const monsterName = await getRandomMonsterName();
      cardNames.push(monsterName);
      await sleep(500);
    }
  }

  console.log(`\n📊 Generating ${cardNames.length} complete cards`);
  console.log(`🎯 Each card gets a signature move + connected flavor text!`);
  console.log(
    `⏱️  Estimated time: ~${Math.ceil((cardNames.length * 15) / 60)} minutes\n`
  );

  const allResults = [];

  for (let i = 0; i < cardNames.length; i++) {
    const cardName = cardNames[i];
    const result = await processOneCard(
      ai,
      vibrantInstance,
      cardName,
      i,
      cardNames.length
    );

    if (result) {
      allResults.push(result);
    }

    if (i < cardNames.length - 1) {
      const delay = Math.max(
        CONFIG.delayBetweenImages,
        CONFIG.delayBetweenFlavorText
      );
      console.log(`\n⏳ Waiting ${delay}ms before next card...`);
      await sleep(delay);
    }
  }

  if (allResults.length === 0) {
    console.error(`\n❌ ERROR: No cards were successfully generated!\n`);
    process.exit(1);
  }

  await saveAllOutputs(allResults);

  console.log(`
${"=".repeat(60)}

🎉 SUCCESS! Generated ${allResults.length} complete cards!

🎯 NEW SYSTEM Features:
   - Each card analyzed by AI for visual details
   - Signature move generated based on creature appearance
   - Flavor text directly references the move
   - Everything feels cohesive and connected!

📁 Output structure:
   ${CONFIG.outputDir}/
   ├── generated-images/ (${allResults.length} images)
   ├── generatedThemes.js
   ├── generatedCardData.js
   ├── flavorTexts.json
   ├── signatureMoves.json (NEW!)
   └── metadata/ (${allResults.length * 2} files)

${"=".repeat(60)}
`);
}

main().catch((error) => {
  console.error(`\n❌ FATAL ERROR:`, error);
  console.error(error.stack);
  process.exit(1);
});

// unifiedCardGenerator.mjs - MEGA VERSION
// 50+ FLAVOR TEXT STYLES for maximum diversity!
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

// ==================== 50+ FLAVOR TEXT STYLES ====================

const FLAVOR_TEXT_STYLES = [
  {
    name: "Prophecy",
    prompt:
      "Write a cryptic prophecy or ancient legend about this creature in 1-2 sentences. Use poetic, archaic language that speaks of destiny and doom.",
  },
  {
    name: "Battle Moment",
    prompt:
      "Describe this creature's most terrifying or awe-inspiring moment in battle. Make it visceral, dramatic, and unforgettable in 1-2 sentences.",
  },
  {
    name: "Survivor's Tale",
    prompt:
      "Write what a survivor whispered about encountering this creature. Make it haunting, personal, and filled with dread in 1-2 sentences.",
  },
  {
    name: "Origin Myth",
    prompt:
      "Describe this creature's origin or the myth surrounding its creation. Use mystical, cosmic language in 1-2 sentences.",
  },
  {
    name: "Last Words",
    prompt:
      "Write the last coherent words or thoughts of someone who faced this creature. Make it chilling and powerful in 1-2 sentences.",
  },
  {
    name: "Sensory Horror",
    prompt:
      "Describe the sound, smell, or feeling of this creature's presence approaching. Use sensory, atmospheric language that builds dread in 1-2 sentences.",
  },
  {
    name: "Ancient Text",
    prompt:
      "Write what ancient texts or forbidden scrolls say about this creature. Use formal, ominous language in 1-2 sentences.",
  },
  {
    name: "Domain",
    prompt:
      "Describe this creature's lair or domain and what fate befalls those who enter. Make it atmospheric and foreboding in 1-2 sentences.",
  },
  {
    name: "Reputation",
    prompt:
      "Describe this creature's reputation among warriors, scholars, or common folk. Use dramatic, legend-building language in 1-2 sentences.",
  },
  {
    name: "Moment Before",
    prompt:
      "Describe the moment just before this creature strikes or reveals itself. Build tension and atmosphere in 1-2 sentences.",
  },
  {
    name: "Dark Poetry",
    prompt:
      "Write a dark, poetic verse about this creature using metaphor and symbolism. Make it lyrical and haunting in 1-2 sentences.",
  },
  {
    name: "Haiku-Like",
    prompt:
      "Write an extremely concise, zen-like observation about this creature that captures its essence. Use sparse, impactful language in 1 sentence.",
  },
  {
    name: "Epic Verse",
    prompt:
      "Write in the style of epic poetry - grand, sweeping, and mythological. Make this creature sound legendary in 1-2 sentences.",
  },
  {
    name: "Nursery Rhyme Dark",
    prompt:
      "Write like a twisted children's rhyme or folk song about this creature. Make it deceptively simple but deeply unsettling in 1-2 sentences.",
  },
  {
    name: "First Person Encounter",
    prompt:
      "Write from the perspective of someone who encountered this creature using 'I'. Make it immediate and personal in 1-2 sentences.",
  },
  {
    name: "Scholar's Notes",
    prompt:
      "Write as a scholar's research note or field observation about this creature. Be clinical but hint at underlying dread in 1-2 sentences.",
  },
  {
    name: "Victim's Diary",
    prompt:
      "Write as a diary entry from someone who doesn't yet know they're doomed. Make it naive with dark irony in 1-2 sentences.",
  },
  {
    name: "Soldier's Report",
    prompt:
      "Write as a military or guard report about an encounter with this creature. Use formal language that barely contains the horror in 1-2 sentences.",
  },
  {
    name: "Melancholy",
    prompt:
      "Write with sadness and loss about this creature - perhaps it was once something else, or its existence is tragic. Make it mournful in 1-2 sentences.",
  },
  {
    name: "Primal Fear",
    prompt:
      "Tap into instinctual, evolutionary fear. Describe how this creature triggers ancient survival responses in 1-2 sentences.",
  },
  {
    name: "Awe and Wonder",
    prompt:
      "Write with reverence and wonder at this creature's existence. Make it sublime and magnificent, even if dangerous, in 1-2 sentences.",
  },
  {
    name: "Rage and Fury",
    prompt:
      "Describe the sheer fury and rage this creature embodies or inspires. Make it violent and intense in 1-2 sentences.",
  },
  {
    name: "Madness",
    prompt:
      "Write as if the observer is losing their sanity from witnessing this creature. Make it fractured and unhinged in 1-2 sentences.",
  },
  {
    name: "Ancient Past",
    prompt:
      "Set this in the deep past - describe this creature as it was in the world's youth. Use primordial, timeless language in 1-2 sentences.",
  },
  {
    name: "Distant Future",
    prompt:
      "Write from far future archaeologists or historians looking back at this creature. Make it mysterious and half-forgotten in 1-2 sentences.",
  },
  {
    name: "Eternal Present",
    prompt:
      "Describe this creature as something that exists outside time, always has and always will. Make it cosmic and inevitable in 1-2 sentences.",
  },
  {
    name: "Countdown",
    prompt:
      "Write about the time before this creature arrives or awakens. Build dread through inevitability in 1-2 sentences.",
  },
  {
    name: "Folk Warning",
    prompt:
      "Write as a folk saying or traditional warning parents tell children. Make it sound like wisdom passed down for generations in 1-2 sentences.",
  },
  {
    name: "Bardic Tale",
    prompt:
      "Write as a fragment from a bard's tale or traveling minstrel's song. Make it dramatic and performative in 1-2 sentences.",
  },
  {
    name: "Religious Text",
    prompt:
      "Write as if from a holy book or religious scripture about this creature. Use reverent, formal language in 1-2 sentences.",
  },
  {
    name: "Tribal Legend",
    prompt:
      "Write as an oral tradition passed down in remote villages. Make it sound like ancestral wisdom in 1-2 sentences.",
  },
  {
    name: "Nature's Balance",
    prompt:
      "Describe this creature's role in the natural order - predator, scavenger, or force of nature itself. Use ecological language in 1-2 sentences.",
  },
  {
    name: "Environmental Warning",
    prompt:
      "Write about how the environment changes when this creature is near - weather, plants, animals. Make it ominous in 1-2 sentences.",
  },
  {
    name: "Ecosystem Horror",
    prompt:
      "Describe this creature as an invasive force or corruption in nature. Make it feel like an infection spreading in 1-2 sentences.",
  },
  {
    name: "Existential Dread",
    prompt:
      "Write about the existential questions or cosmic insignificance this creature represents. Make it philosophically disturbing in 1-2 sentences.",
  },
  {
    name: "Metaphysical",
    prompt:
      "Describe this creature as a concept or idea made flesh - death, hunger, fear itself. Make it abstract and profound in 1-2 sentences.",
  },
  {
    name: "Moral Parable",
    prompt:
      "Write this creature as a lesson or moral warning about hubris, greed, or other failings. Make it sound like a cautionary tale in 1-2 sentences.",
  },
  {
    name: "Body Horror",
    prompt:
      "Focus on the physical wrongness or grotesque nature of this creature. Make it viscerally disturbing without being graphic in 1-2 sentences.",
  },
  {
    name: "Predator's Perspective",
    prompt:
      "Write from the creature's viewpoint as it hunts. Make it alien and predatory in 1-2 sentences.",
  },
  {
    name: "Anatomical Study",
    prompt:
      "Write as a medical or scientific description that reveals something deeply wrong. Keep it clinical but unsettling in 1-2 sentences.",
  },
  {
    name: "Weapon of War",
    prompt:
      "Describe this creature as something used or created for war. Write about the consequences in 1-2 sentences.",
  },
  {
    name: "Symbol of Power",
    prompt:
      "Write about how rulers or factions use this creature as their symbol or weapon. Make it about dominance in 1-2 sentences.",
  },
  {
    name: "Revolutionary Symbol",
    prompt:
      "Describe this creature as an icon of rebellion or change. Make it about upheaval and transformation in 1-2 sentences.",
  },
  {
    name: "Wanted Poster",
    prompt:
      "Write as a bounty notice or wanted poster for this creature. Use formal announcements style but reveal the danger in 1-2 sentences.",
  },
  {
    name: "Field Guide Entry",
    prompt:
      "Write as a naturalist's guide entry that starts factual but reveals something terrifying. Keep it informative but ominous in 1-2 sentences.",
  },
  {
    name: "Auction Description",
    prompt:
      "Write as if this creature is being sold or traded. Make the commerce of it darkly ironic in 1-2 sentences.",
  },
  {
    name: "Museum Placard",
    prompt:
      "Write as a museum display text about this creature. Be informative but hint at suppressed knowledge in 1-2 sentences.",
  },
  {
    name: "Ship's Log",
    prompt:
      "Write as a captain's log or travel journal entry encountering this creature. Use dated, formal language that grows more desperate in 1-2 sentences.",
  },
  {
    name: "Conspiracy",
    prompt:
      "Write about hidden knowledge or cover-ups regarding this creature. Make it paranoid and secretive in 1-2 sentences.",
  },
  {
    name: "Lost Civilization",
    prompt:
      "Connect this creature to a vanished empire or forgotten people. Make it archaeological and mysterious in 1-2 sentences.",
  },
  {
    name: "Sealed Knowledge",
    prompt:
      "Write about why information about this creature was deliberately hidden or destroyed. Make it about forbidden truth in 1-2 sentences.",
  },
];

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

// ==================== FLAVOR TEXT GENERATION ====================

async function generateFlavorText(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

    const randomStyle =
      FLAVOR_TEXT_STYLES[Math.floor(Math.random() * FLAVOR_TEXT_STYLES.length)];
    console.log(
      `  📖 Style: ${randomStyle.name} (${
        FLAVOR_TEXT_STYLES.findIndex((s) => s === randomStyle) + 1
      }/${FLAVOR_TEXT_STYLES.length})`
    );

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

  return {
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

    console.log(`  ✍️  Generating flavor text with Gemini...`);
    const flavorText = await generateFlavorText(imagePath);

    if (!flavorText) {
      console.log(`  ⚠️  Using default flavor text`);
    } else {
      console.log(`  ✅ Flavor text: "${flavorText}"`);
    }

    console.log(`  🎭 Creating theme object...`);
    const theme = generateCardTheme(palette, imageName);

    console.log(`  🃏 Creating card data...`);
    const cardData = generateCardData(imageName, imageExt, theme, flavorText);

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
║      🎴 UNIFIED CARD GENERATOR - MEGA VERSION 🎴         ║
║   50+ Flavor Text Styles for Maximum Diversity!         ║
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
  console.log(
    `🎭 Using ${FLAVOR_TEXT_STYLES.length} different flavor text styles!`
  );
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

🎭 Flavor Text Diversity: ${FLAVOR_TEXT_STYLES.length} unique styles used!

📁 Output files:
   ├── ${CONFIG.outputDir}/generatedThemes.js
   ├── ${CONFIG.outputDir}/generatedCardData.js
   ├── ${CONFIG.outputDir}/flavorTexts.json
   └── ${CONFIG.outputDir}/metadata/ (${allResults.length * 2} files)

💡 MEGA VERSION Features:
   - ${FLAVOR_TEXT_STYLES.length} different flavor text styles
   - Massive variety in card atmosphere
   - Every card feels completely unique!

${"=".repeat(60)}
`);
}

main().catch((error) => {
  console.error(`\n❌ FATAL ERROR:`, error);
  console.error(error.stack);
  process.exit(1);
});

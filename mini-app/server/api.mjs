// API Server for Card Generation
import {
  uploadBase64ImageToIPFS,
  uploadBufferToIPFS,
  uploadJSONToIPFS,
} from "./ipfsUpload.mjs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Buffer } from "buffer";
import { generateCardHTML } from "./cardHTMLGenerator.mjs";
import { renderCardToPNG } from "./cardRenderer.mjs";
import {
  paymentSessionService,
  cardService,
  ipfsService,
  analyticsService,
  isSupabaseConfigured,
} from "./supabaseClient.mjs";
import paymentRoutes from "./paymentRoutes.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = express();
const PORT = 3001;

// Free tier limits
const FREE_DAILY_LIMIT = 100;
const BATCH_LIMIT = 10;

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increased for base64 images

// Mount payment routes
app.use("/api/payment", paymentRoutes);

// In-memory storage for demo (use Redis/DB in production)
const generatedCards = new Map();
let dailyGenerationCount = 0;
let lastResetDate = new Date().toDateString();

// Import node-vibrant dynamically
let Vibrant;
async function initVibrant() {
  const vibrantModule = await import("node-vibrant/node");
  Vibrant = vibrantModule.default || vibrantModule.Vibrant || vibrantModule;
  return Vibrant;
}

// Reset daily counter
function checkAndResetDailyLimit() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyGenerationCount = 0;
    lastResetDate = today;
  }
}

// Color utilities from original script
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

// Extract colors from base64 image using node-vibrant
async function extractColorsFromImage(base64Image) {
  if (!Vibrant) {
    await initVibrant();
  }

  // Remove data URI prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const palette = await Vibrant.from(buffer).getPalette();

  return {
    vibrant: palette.Vibrant?.hex || "#808080",
    darkVibrant: palette.DarkVibrant?.hex || "#404040",
    lightVibrant: palette.LightVibrant?.hex || "#c0c0c0",
    muted: palette.Muted?.hex || "#808080",
    darkMuted: palette.DarkMuted?.hex || "#404040",
    lightMuted: palette.LightMuted?.hex || "#c0c0c0",
  };
}

// Generate card theme from extracted colors (from original script)
function generateCardTheme(colors) {
  const vibrantRgba = hexToRgba(colors.vibrant, 0.4);
  const darkVibrantRgba = hexToRgba(colors.darkVibrant, 0.5);
  const lightVibrantRgba = hexToRgba(colors.lightVibrant, 0.3);
  const mutedRgba = hexToRgba(colors.muted, 0.4);

  return {
    background: `radial-gradient(circle at 20% 30%, ${vibrantRgba} 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${darkVibrantRgba} 0%, transparent 40%), radial-gradient(circle at 60% 10%, ${lightVibrantRgba} 0%, transparent 45%), linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant}, ${colors.muted})`,
    header: {
      background: `radial-gradient(circle at 25% 50%, ${vibrantRgba} 0%, transparent 60%), radial-gradient(circle at 75% 50%, ${mutedRgba} 0%, transparent 60%), linear-gradient(135deg, ${colors.vibrant}, ${colors.muted}, ${colors.lightVibrant}, ${colors.vibrant}, ${colors.darkVibrant})`,
      color: getBestTextColor(colors.vibrant),
      textShadow: `2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px ${hexToRgba(
        colors.vibrant,
        0.6
      )}`,
      boxShadow: `0 4px 15px ${hexToRgba(
        colors.vibrant,
        0.4
      )}, inset 0 2px 0 ${hexToRgba(colors.lightVibrant, 0.3)}`,
    },
    imageArea: {
      background: `radial-gradient(circle at 30% 20%, ${vibrantRgba} 0%, transparent 45%), radial-gradient(circle at 70% 80%, ${darkVibrantRgba} 0%, transparent 50%), linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant}, ${colors.muted})`,
      border: `2px solid ${colors.vibrant}`,
      boxShadow: `inset 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 15px ${hexToRgba(
        colors.vibrant,
        0.3
      )}`,
    },
    typeSection: {
      background: `linear-gradient(135deg, ${colors.darkVibrant}, ${colors.darkMuted})`,
      color: colors.lightVibrant,
      textShadow: `1px 1px 2px rgba(0, 0, 0, 0.8)`,
      boxShadow: `0 4px 15px ${hexToRgba(
        colors.vibrant,
        0.4
      )}, inset 0 2px 0 ${hexToRgba(colors.lightVibrant, 0.3)}`,
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
  };
}

// Generate move and flavor text (from original script)
async function generateMoveAndFlavorText(monsterName) {
  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      messages: [
        {
          role: "user",
          content: `You are creating content for a fantasy trading card game for: ${monsterName}

Your task is to create TWO things:

1. **ONE SIGNATURE MOVE** (2-5 words)
   - Unique ability based on the monster's nature
   - Evocative and memorable
   - Examples: "Tidal Devastation", "Shadow Consumption", "Prismatic Burst"

2. **FLAVOR TEXT** (1-2 sentences)
   - References the signature move
   - Vivid, atmospheric language
   - Makes the reader FEEL something
   - NEVER uses quotation marks
   - NEVER mentions character names

Respond in this EXACT format:
MOVE: [Your 2-5 word signature move]
FLAVOR: [Your 1-2 sentence flavor text]`,
        },
      ],
    });

    // Parse response
    const lines = text.trim().split("\n");
    let moveName = "Signature Move";
    let flavorText = "A legendary ability that echoes through time.";

    for (const line of lines) {
      if (line.startsWith("MOVE:")) {
        moveName = line
          .replace("MOVE:", "")
          .trim()
          .replace(/^["']|["']$/g, "");
      } else if (line.startsWith("FLAVOR:")) {
        flavorText = line
          .replace("FLAVOR:", "")
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }

    return { move: moveName, flavorText };
  } catch (error) {
    console.error("Error generating move and flavor text:", error);
    return {
      move: "Signature Move",
      flavorText: "A legendary ability that echoes through time.",
    };
  }
}

// Generate card image using Google Imagen
async function generateCardImage(monsterName) {
  try {
    console.log(`  🎨 Generating image with Imagen for: ${monsterName}`);

    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.API_KEY,
    });

    const prompt = `A high-resolution, detailed, digital art illustration of a ${monsterName} monster in the distinct visual style of "Pepe the Frog". Complete Background.`;

    const response = await genAI.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
        aspectRatio: "16:9",
      },
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      const base64Data = response.generatedImages[0].image.imageBytes;
      const mimeType = "image/png";

      return {
        imageData: `data:${mimeType};base64,${base64Data}`,
        mimeType,
      };
    } else {
      console.warn(
        `  ⚠️  Image generation returned no data (may be policy violation)`
      );
      throw new Error("Image generation returned no data");
    }
  } catch (error) {
    console.error("  ❌ Imagen generation error:", error.message);
    throw new Error(`Image generation failed: ${error.message}`);
  }
}

// Generate card endpoint - generates images with Imagen
// NOW REQUIRES PAYMENT SESSION
app.post("/api/generate", async (req, res) => {
  try {
    const {
      monsterNames,
      batchMode = false,
      sessionId,
      walletAddress,
    } = req.body;

    if (!monsterNames || monsterNames.length === 0) {
      return res.status(400).json({ error: "No monster names provided" });
    }

    // Require payment session if Supabase is configured
    if (isSupabaseConfigured()) {
      if (!sessionId && !walletAddress) {
        return res.status(400).json({
          error: "Payment required",
          message: "Please complete payment before generating cards",
        });
      }

      // Get active session
      let session;
      if (sessionId) {
        session = await paymentSessionService.getSession(sessionId);
      } else {
        session = await paymentSessionService.getActiveSession(walletAddress);
      }

      if (!session) {
        return res.status(403).json({
          error: "No active payment session",
          message: "Please make a $2.50 USDC payment to generate cards",
        });
      }

      if (session.status !== "confirmed") {
        return res.status(403).json({
          error: "Payment not confirmed",
          message:
            "Please wait for your payment to be confirmed on the blockchain",
        });
      }

      if (session.generations_remaining <= 0) {
        return res.status(403).json({
          error: "No generations remaining",
          message:
            "You have used all 3 generations (1 initial + 2 re-rolls). Please make a new payment.",
        });
      }

      if (new Date(session.expires_at) < new Date()) {
        return res.status(403).json({
          error: "Session expired",
          message:
            "Your payment session has expired. Please make a new payment.",
        });
      }

      // Use one generation
      await paymentSessionService.useGeneration(session.id);

      // Track analytics
      await analyticsService.trackEvent(
        "card_generation_started",
        session.wallet_address,
        {
          sessionId: session.id,
          monsterName: monsterNames[0],
          generationsRemaining: session.generations_remaining - 1,
        }
      );
    } else {
      // Fallback to old free tier system if Supabase not configured
      checkAndResetDailyLimit();

      const requestCount = monsterNames.length;
      if (dailyGenerationCount + requestCount > FREE_DAILY_LIMIT) {
        return res.status(429).json({
          error: "Daily generation limit reached",
          limit: FREE_DAILY_LIMIT,
          used: dailyGenerationCount,
          remaining: FREE_DAILY_LIMIT - dailyGenerationCount,
        });
      }
    }

    // Limit to single card per generation (user can re-roll up to 2 times)
    if (monsterNames.length > 1) {
      return res.status(400).json({
        error: "Only one card can be generated per request",
      });
    }

    const cards = [];

    for (let i = 0; i < monsterNames.length; i++) {
      const monsterName = monsterNames[i];

      try {
        console.log(
          `\n🃏 Processing card ${i + 1}/${monsterNames.length}: ${monsterName}`
        );

        // Generate image with Imagen
        const { imageData } = await generateCardImage(monsterName);

        // Extract colors from generated image
        console.log("  🎨 Extracting colors from image...");
        const colors = await extractColorsFromImage(imageData);

        // Generate theme based on extracted colors
        console.log("  🎭 Generating theme from colors...");
        const theme = generateCardTheme(colors);

        // Generate move and flavor text
        console.log("  ✍️  Generating move and flavor text...");
        const { move, flavorText } = await generateMoveAndFlavorText(
          monsterName
        );

        const cardId = `${monsterName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")}-${Date.now()}`;

        // Generate random stats for surf-works format
        const hp = Math.floor(Math.random() * 5) + 5;
        const mana = Math.floor(Math.random() * 4) + 2;
        const attack = Math.floor(Math.random() * 5) + 3;
        const defense = Math.floor(Math.random() * 5) + 3;

        const card = {
          id: cardId,
          name: monsterName,
          subtitle: "⟨Generated⟩",
          level: "1",
          type: "Creature — Generated",
          manaCost: [
            {
              type: "hp",
              value: hp,
              color: "radial-gradient(circle, #dc143c, #8b0000)",
              textColor: "#ffffff",
            },
            {
              type: "mana",
              value: mana,
              color: "radial-gradient(circle, #4169e1, #0000cd)",
              textColor: "#ffffff",
            },
            {
              type: "terrain",
              value: "?",
              color: "radial-gradient(circle, #32cd32, #228b22)",
              textColor: "#ffffff",
            },
          ],
          stats: {
            attack,
            defense,
          },
          flavorText: `${move}\n${flavorText}`,
          artist: "Waves TCG",
          rarity: "1/1",
          imageData,
          colors,
          theme,
          timestamp: Date.now(),
        };

        // Store in Supabase if configured
        if (isSupabaseConfigured() && sessionId) {
          console.log("  💾 Storing card in database...");
          const dbCard = await cardService.createCard(sessionId, {
            name: monsterName,
            stats: {
              hp,
              attack,
              defense,
              speed: mana, // Using mana as speed for now
              rarity: "1/1",
            },
            move: {
              name: move,
              description: flavorText,
            },
            flavorText: `${move}\n${flavorText}`,
            themeColors: colors,
            imageData,
          });

          // Use database ID as card ID
          card.id = dbCard.id;
          card.databaseId = dbCard.id;
        }

        generatedCards.set(card.id, card);
        cards.push(card);

        // Only increment daily count if not using paid system
        if (!isSupabaseConfigured()) {
          dailyGenerationCount++;
        }

        console.log(`  ✅ Card generated successfully!`);

        // Rate limiting delay between cards
        if (i < monsterNames.length - 1) {
          console.log(`  ⏳ Waiting 3 seconds before next card...`);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error(`  ❌ Error generating card for ${monsterName}:`, error);
        cards.push({
          error: true,
          name: monsterName,
          message: error.message,
        });
      }
    }

    res.json({
      success: true,
      cards,
      remaining: FREE_DAILY_LIMIT - dailyGenerationCount,
    });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get generation limits
app.get("/api/limits", (req, res) => {
  checkAndResetDailyLimit();
  res.json({
    dailyLimit: FREE_DAILY_LIMIT,
    batchLimit: BATCH_LIMIT,
    used: dailyGenerationCount,
    remaining: FREE_DAILY_LIMIT - dailyGenerationCount,
  });
});

// Get card by ID
app.get("/api/card/:id", (req, res) => {
  const card = generatedCards.get(req.params.id);
  if (!card) {
    return res.status(404).json({ error: "Card not found" });
  }
  res.json(card);
});

// ============================================
// REPLACE the /api/upload-to-ipfs endpoint in api.mjs with this:
// ============================================

// Add this import at the top of api.mjs:
// import { uploadBase64ImageToIPFS, uploadBufferToIPFS, uploadJSONToIPFS } from './ipfsUpload.mjs';

// Upload card to IPFS endpoint (FIXED for Pinata SDK v2)
app.post("/api/upload-to-ipfs", async (req, res) => {
  try {
    const { card } = req.body;

    if (!card || !card.imageData) {
      return res.status(400).json({ error: "Card data with image required" });
    }

    if (!process.env.PINATA_JWT) {
      return res.status(500).json({
        error: "PINATA_JWT not configured. Add it to your .env file",
      });
    }

    console.log(`\n📤 Uploading card to IPFS: ${card.name}`);

    // Step 1: Upload raw AI image to IPFS
    console.log("  🎨 Uploading raw AI image...");

    const rawImageUpload = await uploadBase64ImageToIPFS(
      card.imageData,
      `${card.id}_raw.png`
    );
    const rawImageCID = rawImageUpload.IpfsHash;
    console.log(`  ✅ Raw image uploaded: ipfs://${rawImageCID}`);

    // Step 2: Generate HTML card
    console.log("  🎴 Generating HTML card...");
    const imageGatewayUrl = `https://gateway.pinata.cloud/ipfs/${rawImageCID}`;
    const cardHTML = generateCardHTML(card, imageGatewayUrl);

    // Step 3: Render HTML card to PNG
    console.log("  🖼️  Rendering card to PNG...");
    const cardImageBuffer = await renderCardToPNG(cardHTML);

    console.log("  📤 Uploading rendered card image...");
    const cardImageUpload = await uploadBufferToIPFS(
      cardImageBuffer,
      `${card.id}.png`,
      "image/png"
    );
    const cardImageCID = cardImageUpload.IpfsHash;
    console.log(`  ✅ Card image uploaded: ipfs://${cardImageCID}`);

    // Step 4: Upload HTML card
    console.log("  📤 Uploading HTML card...");
    const htmlBuffer = Buffer.from(cardHTML, "utf-8");
    const htmlUpload = await uploadBufferToIPFS(
      htmlBuffer,
      `${card.id}.html`,
      "text/html"
    );
    const htmlCID = htmlUpload.IpfsHash;
    console.log(`  ✅ HTML card uploaded: ipfs://${htmlCID}`);

    // Step 5: Create and upload metadata
    console.log("  📝 Creating metadata...");
    const metadata = {
      name: card.name,
      description: card.flavorText || `${card.name} - A unique trading card`,
      image: `ipfs://${cardImageCID}`,
      animation_url: `ipfs://${htmlCID}`,
      attributes: [
        { trait_type: "Type", value: card.type || "Creature" },
        { trait_type: "Level", value: card.level || "1" },
        { trait_type: "Attack", value: card.stats?.attack || 0 },
        { trait_type: "Defense", value: card.stats?.defense || 0 },
        { trait_type: "HP", value: card.manaCost?.[0]?.value || 0 },
        { trait_type: "Mana", value: card.manaCost?.[1]?.value || 0 },
        { trait_type: "Rarity", value: card.rarity || "Common" },
        { trait_type: "Artist", value: card.artist || "Waves TCG" },
      ],
    };

    console.log("  📤 Uploading metadata...");
    const metadataUpload = await uploadJSONToIPFS(metadata);
    const metadataCID = metadataUpload.IpfsHash;
    console.log(`  ✅ Metadata uploaded: ipfs://${metadataCID}`);

    // Store IPFS links in Supabase if configured
    if (isSupabaseConfigured() && card.databaseId) {
      console.log("  💾 Storing IPFS links in database...");
      try {
        await Promise.all([
          ipfsService.addLink(
            card.databaseId,
            rawImageCID,
            "raw_image",
            `https://gateway.pinata.cloud/ipfs/${rawImageCID}`,
            null
          ),
          ipfsService.addLink(
            card.databaseId,
            cardImageCID,
            "styled_card",
            `https://gateway.pinata.cloud/ipfs/${cardImageCID}`,
            null
          ),
          ipfsService.addLink(
            card.databaseId,
            htmlCID,
            "html",
            `https://gateway.pinata.cloud/ipfs/${htmlCID}`,
            null
          ),
          ipfsService.addLink(
            card.databaseId,
            metadataCID,
            "metadata",
            `https://gateway.pinata.cloud/ipfs/${metadataCID}`,
            null
          ),
        ]);
        console.log("  ✅ IPFS links stored in database");
      } catch (dbError) {
        console.warn("  ⚠️  Failed to store IPFS links:", dbError.message);
      }
    }

    const result = {
      success: true,
      rawImageCID,
      cardImageCID,
      htmlCID,
      metadataCID,
      imageURI: `ipfs://${cardImageCID}`,
      animationURI: `ipfs://${htmlCID}`,
      metadataURI: `ipfs://${metadataCID}`,
      rawImageGateway: `https://gateway.pinata.cloud/ipfs/${rawImageCID}`,
      cardImageGateway: `https://gateway.pinata.cloud/ipfs/${cardImageCID}`,
      htmlGateway: `https://gateway.pinata.cloud/ipfs/${htmlCID}`,
      metadataGateway: `https://gateway.pinata.cloud/ipfs/${metadataCID}`,
    };

    console.log("  🎉 Upload complete!");
    res.json(result);
  } catch (error) {
    console.error("❌ IPFS upload error:", error);

    let errorMessage = error.message;
    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized")
    ) {
      errorMessage = "Invalid Pinata JWT token. Check your .env configuration";
    } else if (
      error.message.includes("insufficient") ||
      error.message.includes("limit")
    ) {
      errorMessage = "Pinata account limit reached. Upgrade your plan";
    }

    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Card Generator API running on http://localhost:${PORT}`);
  console.log(`📊 Free tier limit: ${FREE_DAILY_LIMIT} cards/day`);
  console.log(`📦 Batch limit: ${BATCH_LIMIT} cards`);
  console.log(`🎨 Using node-vibrant for color extraction`);
  console.log(`📤 IPFS upload endpoint ready`);
});

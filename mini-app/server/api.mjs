// API Server for Card Generation
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import { GoogleGenAI } from '@google/genai';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = 3001;

// Free tier limits
const FREE_DAILY_LIMIT = 100; // Imagen free tier
const BATCH_LIMIT = 10; // Max batch size for free tier

app.use(cors());
app.use(express.json());

// In-memory storage for demo (use Redis/DB in production)
const generatedCards = new Map();
let dailyGenerationCount = 0;
let lastResetDate = new Date().toDateString();

// Reset daily counter
function checkAndResetDailyLimit() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyGenerationCount = 0;
    lastResetDate = today;
  }
}

// Generate card image using Imagen via Google AI SDK
async function generateCardImage(monsterName) {
  const genAI = new GoogleGenAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.API_KEY);

  const prompt = `Epic fantasy trading card art of ${monsterName}, highly detailed, dramatic lighting, vibrant colors, 16:9 aspect ratio, professional game art style`;

  try {
    // Use Imagen 3 for image generation
    const result = await genAI.models.imagen.generate({
      prompt,
      numberOfImages: 1,
      aspectRatio: '16:9',
    });

    // Get the generated image
    const image = result.images[0];
    return {
      imageData: image.imageBytes.toString('base64'),
      mimeType: 'image/png',
    };
  } catch (error) {
    console.error('Image generation error:', error);
    // For now, return a placeholder since Imagen API might need special setup
    // In production, this should properly handle the Imagen API
    throw new Error('Image generation not available. Please use the unified generator with existing images.');
  }
}

// Generate move and flavor text
async function generateMoveAndFlavorText(monsterName, imageData = null) {
  const content = [
    {
      type: 'text',
      text: `You are creating content for a fantasy trading card game for: ${monsterName}

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
  ];

  // If we have image data, include it
  if (imageData) {
    content.unshift({
      type: 'image',
      image: imageData,
      mimeType: 'image/png',
    });
  }

  const { text } = await generateText({
    model: google('gemini-2.0-flash-exp'),
    messages: [{ role: 'user', content }],
  });

  // Parse response
  const lines = text.trim().split('\n');
  let moveName = 'Signature Move';
  let flavorText = 'A legendary ability that echoes through time.';

  for (const line of lines) {
    if (line.startsWith('MOVE:')) {
      moveName = line.replace('MOVE:', '').trim().replace(/^["']|["']$/g, '');
    } else if (line.startsWith('FLAVOR:')) {
      flavorText = line.replace('FLAVOR:', '').trim().replace(/^["']|["']$/g, '');
    }
  }

  return { move: moveName, flavorText };
}

// Generate card endpoint
app.post('/api/generate', async (req, res) => {
  try {
    checkAndResetDailyLimit();

    const { monsterNames, batchMode = false } = req.body;

    if (!monsterNames || monsterNames.length === 0) {
      return res.status(400).json({ error: 'No monster names provided' });
    }

    // Check limits
    const requestCount = monsterNames.length;
    if (dailyGenerationCount + requestCount > FREE_DAILY_LIMIT) {
      return res.status(429).json({
        error: 'Daily generation limit reached',
        limit: FREE_DAILY_LIMIT,
        used: dailyGenerationCount,
        remaining: FREE_DAILY_LIMIT - dailyGenerationCount,
      });
    }

    if (batchMode && requestCount > BATCH_LIMIT) {
      return res.status(400).json({
        error: `Batch size exceeds limit of ${BATCH_LIMIT}`,
      });
    }

    const cards = [];

    for (const monsterName of monsterNames) {
      try {
        console.log(`Generating card for: ${monsterName}`);

        // Generate image
        const { imageData, mimeType } = await generateCardImage(monsterName);

        // Generate move and flavor text
        const { move, flavorText } = await generateMoveAndFlavorText(monsterName, imageData);

        const cardId = `${monsterName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;

        const card = {
          id: cardId,
          name: monsterName,
          move,
          flavorText,
          imageData: `data:${mimeType};base64,${imageData}`,
          stats: {
            level: '1',
            attack: Math.floor(Math.random() * 5) + 3,
            defense: Math.floor(Math.random() * 5) + 3,
            hp: Math.floor(Math.random() * 5) + 5,
            manaCost: Math.floor(Math.random() * 4) + 2,
          },
          timestamp: Date.now(),
        };

        generatedCards.set(cardId, card);
        cards.push(card);
        dailyGenerationCount++;

        // Rate limiting delay
        if (monsterNames.indexOf(monsterName) < monsterNames.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      } catch (error) {
        console.error(`Error generating card for ${monsterName}:`, error);
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
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get generation limits
app.get('/api/limits', (req, res) => {
  checkAndResetDailyLimit();
  res.json({
    dailyLimit: FREE_DAILY_LIMIT,
    batchLimit: BATCH_LIMIT,
    used: dailyGenerationCount,
    remaining: FREE_DAILY_LIMIT - dailyGenerationCount,
  });
});

// Get card by ID
app.get('/api/card/:id', (req, res) => {
  const card = generatedCards.get(req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json(card);
});

app.listen(PORT, () => {
  console.log(`🚀 Card Generator API running on http://localhost:${PORT}`);
  console.log(`📊 Free tier limit: ${FREE_DAILY_LIMIT} cards/day`);
  console.log(`📦 Batch limit: ${BATCH_LIMIT} cards`);
});

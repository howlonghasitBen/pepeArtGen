import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
// Fix: Import `process` and `Buffer` to resolve errors where Node.js globals are not automatically recognized.
import process from "process";
import { Buffer } from "buffer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// --- Configuration ---
const OUTPUT_DIR = "./generated-pepes";
const DND_API_URL = "https://www.dnd5eapi.co/api/monsters";

// --- API Key Check ---
// Ensure the API_KEY is set before proceeding.
if (!process.env.API_KEY) {
  console.error("ERROR: API_KEY environment variable not set.");
  console.error(
    'Please create a .env file and add your API key (e.g., API_KEY="your_key_here").'
  );
  process.exit(1);
}

// --- Helper Functions ---

/**
 * A simple delay function.
 * @param {number} ms - The number of milliseconds to wait.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The path to the directory.
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      console.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }
}

/**
 * Fetches a random monster name from the D&D 5e API.
 * @returns {Promise<string>} A promise that resolves to a random monster name.
 */
async function getRandomMonsterName() {
  console.log("Fetching list of monsters from D&D API...");
  const response = await fetch(DND_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch monster list: ${response.statusText}`);
  }
  const data = await response.json();
  const randomIndex = Math.floor(Math.random() * data.results.length);
  const monsterName = data.results[randomIndex].name;
  console.log(`Selected random monster: ${monsterName}`);
  return monsterName;
}

/**
 * Generates a "Pepe" style image of a given monster using the Gemini API.
 * @param {GoogleGenAI} ai - The GoogleGenAI client instance.
 * @param {string} monsterName - The name of the monster to generate.
 * @returns {Promise<string|null>} A promise that resolves to base64 image data, or null if failed.
 */
async function generatePepeMonsterImage(ai, monsterName) {
  const model = "imagen-4.0-generate-001";
  const prompt = `A high-resolution, detailed, digital art illustration of a ${monsterName} monster in the distinct visual style of "Pepe the Frog".`;

  console.log(`Generating image for "${monsterName}"...`);

  try {
    const response = await ai.models.generateImages({
      model: model,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/png",
        aspectRatio: "16:9",
      },
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      console.warn(
        "Image generation response did not contain image data. This could be due to a policy violation or other API issue."
      );
      return null;
    }
  } catch (error) {
    console.error(
      `Error calling Gemini API for "${monsterName}":`,
      error.message
    );
    return null; // Continue to the next monster
  }
}

/**
 * Saves the base64 image data to a file.
 * @param {string} base64Data - The base64 encoded image data.
 * @param {string} monsterName - The name of the monster, used for the filename.
 */
async function saveImage(base64Data, monsterName) {
  const safeFilename = monsterName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const timestamp = Date.now();
  const filename = `pepe_${safeFilename}_${timestamp}.png`;
  const filePath = path.join(OUTPUT_DIR, filename);

  try {
    const buffer = Buffer.from(base64Data, "base64");
    await fs.writeFile(filePath, buffer);
    console.log(`✅ Successfully saved image to: ${filePath}`);
  } catch (error) {
    console.error(`Error saving image file for "${monsterName}":`, error);
  }
}

// --- Main Execution ---

async function main() {
  console.log("--- Pepe Monster CLI Generator ---");
  console.log("Press Ctrl+C to stop.");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  await ensureDirectoryExists(OUTPUT_DIR);

  let running = true;
  process.on("SIGINT", () => {
    console.log("\nCaught interrupt signal. Shutting down gracefully...");
    running = false;
  });

  while (running) {
    try {
      const monsterName = await getRandomMonsterName();
      const base64ImageData = await generatePepeMonsterImage(ai, monsterName);

      if (base64ImageData) {
        await saveImage(base64ImageData, monsterName);
      } else {
        console.log(
          `Skipping save for "${monsterName}" due to generation failure.`
        );
      }
    } catch (error) {
      console.error("An unexpected error occurred in the main loop:", error);
    } finally {
      if (running) {
        // Wait a bit before the next cycle to be nice to the APIs
        await sleep(2000);
        console.log("\n------------------------------------\n");
      }
    }
  }

  console.log("Generator has stopped. Goodbye!");
}

main().catch(console.error);

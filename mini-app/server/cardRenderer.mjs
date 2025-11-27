/**
 * Render HTML card to PNG image using Puppeteer
 * This creates a preview image of the full styled card
 */

import puppeteer from "puppeteer";

export async function renderCardToPNG(cardHTML) {
  let browser;

  try {
    console.log("    🖼️  Launching browser...");

    // Launch headless browser with production-friendly config
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set viewport to card dimensions (3:4 aspect ratio)
    await page.setViewport({
      width: 600,
      height: 800,
      deviceScaleFactor: 2, // High DPI for quality
    });

    console.log("    📄 Loading HTML...");

    // Load the HTML content
    await page.setContent(cardHTML, {
      waitUntil: "networkidle0", // Wait for all resources (fonts, images)
    });

    // Wait a bit for any animations/transitions
    await page.waitForTimeout(500);

    console.log("    📸 Capturing screenshot...");

    // Take screenshot as buffer
    const screenshot = await page.screenshot({
      type: "png",
      omitBackground: false,
    });

    console.log("    ✅ Screenshot captured");

    return screenshot;
  } catch (error) {
    console.error("    ❌ Screenshot error:", error);
    throw new Error(`Failed to render card: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Simplified version that renders to a specific element
 * if you want to render just the card without the body padding
 */
export async function renderCardElementToPNG(cardHTML) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(cardHTML, { waitUntil: "networkidle0" });
    await page.waitForTimeout(500);

    // Find the card container element and screenshot just that
    const cardElement = await page.$(".card-container");

    if (!cardElement) {
      throw new Error("Card container not found in HTML");
    }

    const screenshot = await cardElement.screenshot({
      type: "png",
      omitBackground: false,
    });

    return screenshot;
  } catch (error) {
    console.error("Screenshot error:", error);
    throw new Error(`Failed to render card element: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

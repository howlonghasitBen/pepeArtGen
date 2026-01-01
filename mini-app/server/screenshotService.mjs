import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

const STORAGE_BUCKET = 'card-screenshots';

/**
 * Generate HTML for card rendering
 */
function generateCardHTML(card) {
  const theme = card.theme || {};

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 400px;
      height: 560px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
    }
    .card {
      width: 400px;
      height: 560px;
      border-radius: 16px;
      overflow: hidden;
      background: ${theme.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'};
      display: flex;
      flex-direction: column;
    }
    .card-header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: ${theme.header?.background || 'rgba(0,0,0,0.3)'};
      color: ${theme.header?.color || '#fff'};
    }
    .mana-cost {
      display: flex;
      gap: 6px;
      margin-bottom: 4px;
    }
    .mana-orb {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
    }
    .card-title {
      font-size: 18px;
      font-weight: bold;
    }
    .card-level {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      background: ${theme.stat?.background || 'rgba(255,255,255,0.2)'};
    }
    .image-area {
      flex: 1;
      margin: 8px 12px;
      border-radius: 8px;
      overflow: hidden;
      background: ${theme.imageArea?.background || 'rgba(0,0,0,0.2)'};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .type-power-section {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${theme.typeSection?.background || 'rgba(0,0,0,0.3)'};
      color: ${theme.typeSection?.color || '#fff'};
      font-size: 14px;
    }
    .power-stats {
      display: flex;
      gap: 8px;
    }
    .stat {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      background: ${theme.stat?.background || 'rgba(255,255,255,0.2)'};
    }
    .flavor-text {
      padding: 12px 16px;
      font-size: 13px;
      font-style: italic;
      line-height: 1.4;
      background: ${theme.flavorText?.background || 'rgba(0,0,0,0.2)'};
      color: ${theme.flavorText?.color || '#ccc'};
      min-height: 80px;
    }
    .bottom-section {
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${theme.bottomSection?.background || 'rgba(0,0,0,0.3)'};
    }
    .artist-info {
      font-size: 11px;
      color: ${theme.flavorText?.color || '#888'};
    }
    .rarity-indicator {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
      background: ${theme.rarity?.background || 'linear-gradient(135deg, gold, orange)'};
      color: ${theme.rarity?.color || '#000'};
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div>
        <div class="mana-cost">
          ${(card.manaCost || []).map(mana => `
            <div class="mana-orb" style="background: ${mana.color}; color: ${mana.textColor || '#fff'}">
              ${mana.value}
            </div>
          `).join('')}
        </div>
        <div class="card-title">${card.name || 'Untitled'} ${card.subtitle || ''}</div>
      </div>
      <div class="card-level">LVL ${card.level || 1}</div>
    </div>

    <div class="image-area">
      <img class="card-image" src="${card.imageData || ''}" alt="${card.name}" />
    </div>

    <div class="type-power-section">
      <div>${card.type || 'Creature'}</div>
      <div class="power-stats">
        <div class="stat">ATK: ${card.stats?.attack || 0}</div>
        <div class="stat">DEF: ${card.stats?.defense || 0}</div>
      </div>
    </div>

    <div class="flavor-text">${card.flavorText || ''}</div>

    <div class="bottom-section">
      <div class="artist-info">◆ ${card.artist || 'Waves TCG'} ◆</div>
      <div class="rarity-indicator">★ ${card.rarity || '1/1'} ★</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Capture a card as a PNG screenshot using Puppeteer
 */
export async function captureCardScreenshot(cardData) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 400, height: 560 });

    const html = generateCardHTML(cardData);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait a bit for any images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: true
    });

    return screenshot;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate a thumbnail from a full-size screenshot
 */
export async function generateThumbnail(screenshotBuffer, width = 200, height = 280) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    const base64 = screenshotBuffer.toString('base64');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; }
          body { width: ${width}px; height: ${height}px; }
          img { width: 100%; height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="data:image/png;base64,${base64}" />
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const thumbnail = await page.screenshot({
      type: 'png',
      omitBackground: true
    });

    return thumbnail;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Save screenshot to Supabase Storage
 */
export async function saveScreenshot(buffer, cardId, mintId, ownerAddress) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const fileId = crypto.randomUUID();
  const storagePath = `${ownerAddress}/${fileId}.png`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'image/png',
      cacheControl: '31536000' // 1 year cache
    });

  if (uploadError) {
    throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  const screenshotUrl = urlData.publicUrl;

  // Generate and upload thumbnail
  let thumbnailUrl = null;
  try {
    const thumbnailBuffer = await generateThumbnail(buffer);
    const thumbnailPath = `${ownerAddress}/thumbnails/${fileId}.png`;

    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000'
      });

    const { data: thumbUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(thumbnailPath);

    thumbnailUrl = thumbUrlData.publicUrl;
  } catch (err) {
    console.warn('Failed to generate thumbnail:', err.message);
  }

  // Save record to database
  const { data: dbData, error: dbError } = await supabase
    .from('card_screenshots')
    .insert({
      card_id: cardId,
      mint_id: mintId,
      owner_address: ownerAddress,
      screenshot_url: screenshotUrl,
      thumbnail_url: thumbnailUrl,
      storage_path: storagePath,
      width: 400,
      height: 560,
      file_size: buffer.length
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Failed to save screenshot record: ${dbError.message}`);
  }

  return {
    id: dbData.id,
    screenshotUrl,
    thumbnailUrl,
    storagePath
  };
}

/**
 * Get all screenshots for a card
 */
export async function getCardScreenshots(cardId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('card_screenshots')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get screenshots for gallery display
 */
export async function getGalleryScreenshots(limit = 50, offset = 0) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('gallery_cards')
    .select('*')
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete a screenshot
 */
export async function deleteScreenshot(screenshotId) {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Get the screenshot record first
  const { data: screenshot, error: fetchError } = await supabase
    .from('card_screenshots')
    .select('storage_path')
    .eq('id', screenshotId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Delete from storage
  if (screenshot?.storage_path) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([screenshot.storage_path]);
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('card_screenshots')
    .delete()
    .eq('id', screenshotId);

  if (deleteError) {
    throw deleteError;
  }

  return true;
}

export default {
  captureCardScreenshot,
  generateThumbnail,
  saveScreenshot,
  getCardScreenshots,
  getGalleryScreenshots,
  deleteScreenshot
};

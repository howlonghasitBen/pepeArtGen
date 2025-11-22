// curate.mjs - Card Curation Tool
// Visual gallery interface for curating generated cards
// VERSION: 2.0 - WINDOWS FIX - NO AUTO-BROWSER OPEN

import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  port: 3000,
  cardsDir: './complete-cards',
  imagesDir: './complete-cards/generated-images',
  themesFile: './complete-cards/generatedThemes.js',
  cardDataFile: './complete-cards/generatedCardData.js',
  metadataDir: './complete-cards/metadata',
};

// ==================== SERVER ====================

// NO BROWSER AUTO-OPEN - User opens manually

async function getCardData() {
  try {
    // Read all images
    const imageFiles = await fs.readdir(CONFIG.imagesDir);
    const cards = imageFiles
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
      .map(filename => ({
        filename,
        id: path.parse(filename).name,
        path: `/images/${filename}`
      }));

    return cards;
  } catch (error) {
    console.error('Error reading card data:', error.message);
    return [];
  }
}

async function deleteCards(cardIds) {
  console.log(`\n🗑️  Deleting ${cardIds.length} cards...`);
  
  const results = {
    images: 0,
    themes: 0,
    cardData: 0,
    metadata: 0,
    errors: []
  };

  // Delete image files
  for (const id of cardIds) {
    try {
      const files = await fs.readdir(CONFIG.imagesDir);
      const imageFile = files.find(f => path.parse(f).name === id);
      if (imageFile) {
        await fs.unlink(path.join(CONFIG.imagesDir, imageFile));
        results.images++;
        console.log(`  ✅ Deleted image: ${imageFile}`);
      }
    } catch (error) {
      results.errors.push(`Image ${id}: ${error.message}`);
    }
  }

  // Update generatedThemes.js
  try {
    const themesContent = await fs.readFile(CONFIG.themesFile, 'utf8');
    const themesMatch = themesContent.match(/export const GENERATED_THEMES = ({[\s\S]*});/);
    
    if (themesMatch) {
      let themesObj = eval(`(${themesMatch[1]})`);
      
      // Find theme keys to delete
      const keysToDelete = cardIds.map(id => {
        // Try different case variations
        const possibilities = [
          id,
          id.toLowerCase(),
          id.replace(/[^a-z0-9]/gi, ''),
          id.split(/[-_\s]/).map((word, i) => 
            i === 0 ? word.toLowerCase() : 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join('')
        ];
        
        for (const key of possibilities) {
          if (themesObj[key]) return key;
        }
        
        // Also check if any key contains the id
        const foundKey = Object.keys(themesObj).find(k => 
          k.toLowerCase().includes(id.toLowerCase()) ||
          id.toLowerCase().includes(k.toLowerCase())
        );
        return foundKey;
      }).filter(Boolean);

      keysToDelete.forEach(key => {
        delete themesObj[key];
        results.themes++;
        console.log(`  ✅ Removed theme: ${key}`);
      });

      const newContent = `// Auto-generated themes from completeCardPipeline.mjs\nexport const GENERATED_THEMES = ${JSON.stringify(themesObj, null, 2)};\n`;
      await fs.writeFile(CONFIG.themesFile, newContent);
    }
  } catch (error) {
    results.errors.push(`Themes file: ${error.message}`);
  }

  // Update generatedCardData.js
  try {
    const cardDataContent = await fs.readFile(CONFIG.cardDataFile, 'utf8');
    const cardDataMatch = cardDataContent.match(/export const GENERATED_CARDS = (\[[\s\S]*\]);/);
    
    if (cardDataMatch) {
      let cardsArray = eval(cardDataMatch[1]);
      
      const originalLength = cardsArray.length;
      cardsArray = cardsArray.filter(card => {
        const shouldDelete = cardIds.some(id => 
          card.id === id ||
          card.id === id.toLowerCase().replace(/[^a-z0-9]/g, '') ||
          card.image.includes(id)
        );
        
        if (shouldDelete) {
          console.log(`  ✅ Removed card data: ${card.name}`);
        }
        
        return !shouldDelete;
      });
      
      results.cardData = originalLength - cardsArray.length;

      const newContent = `// Auto-generated card data from completeCardPipeline.mjs\nexport const GENERATED_CARDS = ${JSON.stringify(cardsArray, null, 2)};\n`;
      await fs.writeFile(CONFIG.cardDataFile, newContent);
    }
  } catch (error) {
    results.errors.push(`Card data file: ${error.message}`);
  }

  // Delete metadata files
  try {
    const metadataFiles = await fs.readdir(CONFIG.metadataDir);
    
    for (const id of cardIds) {
      const relatedFiles = metadataFiles.filter(f => 
        f.startsWith(id.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
      
      for (const file of relatedFiles) {
        await fs.unlink(path.join(CONFIG.metadataDir, file));
        results.metadata++;
        console.log(`  ✅ Deleted metadata: ${file}`);
      }
    }
  } catch (error) {
    results.errors.push(`Metadata: ${error.message}`);
  }

  console.log(`\n✅ Deletion complete!`);
  console.log(`   Images: ${results.images}`);
  console.log(`   Themes: ${results.themes}`);
  console.log(`   Card Data: ${results.cardData}`);
  console.log(`   Metadata: ${results.metadata}`);
  
  if (results.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered:`);
    results.errors.forEach(err => console.log(`   - ${err}`));
  }

  return results;
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve images
  if (req.url.startsWith('/images/')) {
    const filename = req.url.substring(8);
    const imagePath = path.join(CONFIG.imagesDir, filename);
    
    try {
      const data = await fs.readFile(imagePath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }[ext] || 'image/png';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (error) {
      res.writeHead(404);
      res.end('Image not found');
    }
    return;
  }

  // API: Get cards
  if (req.url === '/api/cards') {
    const cards = await getCardData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cards));
    return;
  }

  // API: Delete cards
  if (req.url === '/api/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { cardIds } = JSON.parse(body);
        const results = await deleteCards(cardIds);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, results }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // Serve HTML interface
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getHTMLInterface());
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

function getHTMLInterface() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎴 SURF Card Curation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
      padding: 20px;
      min-height: 100vh;
    }

    .header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 30px;
    }

    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .stats {
      font-size: 1.2em;
      color: #a8b2d1;
      margin-top: 10px;
    }

    .stats span {
      color: #667eea;
      font-weight: bold;
    }

    .controls {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    button {
      padding: 12px 30px;
      font-size: 1.1em;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .btn-delete {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .btn-delete:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(245, 87, 108, 0.4);
    }

    .btn-delete:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-select-all, .btn-deselect-all {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-select-all:hover, .btn-deselect-all:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
      padding: 20px 0;
    }

    .card-item {
      position: relative;
      aspect-ratio: 16/9;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 3px solid transparent;
      background: rgba(255, 255, 255, 0.05);
    }

    .card-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .card-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-item.marked-delete {
      border-color: #f5576c;
      box-shadow: 0 0 20px rgba(245, 87, 108, 0.6);
    }

    .card-item.marked-delete::after {
      content: '✗';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background: #f5576c;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    .card-item:not(.marked-delete)::after {
      content: '✓';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background: rgba(102, 126, 234, 0.9);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card-item:hover:not(.marked-delete)::after {
      opacity: 1;
    }

    .card-name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.8);
      padding: 10px;
      text-align: center;
      font-size: 0.9em;
      font-weight: 600;
    }

    .loading {
      text-align: center;
      font-size: 1.5em;
      padding: 100px 20px;
      color: #667eea;
    }

    .empty {
      text-align: center;
      padding: 100px 20px;
      font-size: 1.5em;
      color: #a8b2d1;
    }

    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal.show {
      display: flex;
    }

    .modal-content {
      background: #1a1a2e;
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      max-width: 500px;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }

    .modal-content h2 {
      margin-bottom: 20px;
      color: #667eea;
    }

    .modal-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .btn-cancel {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    @media (max-width: 768px) {
      .gallery {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
      }

      h1 {
        font-size: 1.8em;
      }

      .controls {
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎴 SURF Card Curation</h1>
    <div class="stats">
      <span id="total-cards">0</span> cards loaded | 
      <span id="marked-count">0</span> marked for deletion
    </div>
  </div>

  <div class="controls">
    <button class="btn-select-all" onclick="selectAll()">Select All</button>
    <button class="btn-deselect-all" onclick="deselectAll()">Deselect All</button>
    <button class="btn-delete" id="delete-btn" onclick="confirmDelete()" disabled>
      Delete Selected
    </button>
  </div>

  <div id="gallery" class="gallery">
    <div class="loading">Loading cards...</div>
  </div>

  <div id="confirm-modal" class="modal">
    <div class="modal-content">
      <h2>⚠️ Confirm Deletion</h2>
      <p>Are you sure you want to permanently delete <strong id="delete-count">0</strong> cards?</p>
      <p style="margin-top: 15px; color: #f5576c; font-size: 0.9em;">
        This will remove images, themes, card data, and metadata files.
      </p>
      <div class="modal-buttons">
        <button class="btn-confirm" onclick="executeDelete()">Delete Forever</button>
        <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      </div>
    </div>
  </div>

  <script>
    let cards = [];
    let markedForDeletion = new Set();

    async function loadCards() {
      try {
        const response = await fetch('/api/cards');
        cards = await response.json();
        
        document.getElementById('total-cards').textContent = cards.length;
        renderGallery();
      } catch (error) {
        document.getElementById('gallery').innerHTML = 
          '<div class="empty">Error loading cards: ' + error.message + '</div>';
      }
    }

    function renderGallery() {
      const gallery = document.getElementById('gallery');
      
      if (cards.length === 0) {
        gallery.innerHTML = '<div class="empty">No cards found in complete-cards/generated-images/</div>';
        return;
      }

      gallery.innerHTML = cards.map(card => \`
        <div class="card-item \${markedForDeletion.has(card.id) ? 'marked-delete' : ''}" 
             onclick="toggleCard('\${card.id}')">
          <img src="\${card.path}" alt="\${card.id}" loading="lazy">
          <div class="card-name">\${card.id}</div>
        </div>
      \`).join('');

      updateStats();
    }

    function toggleCard(cardId) {
      if (markedForDeletion.has(cardId)) {
        markedForDeletion.delete(cardId);
      } else {
        markedForDeletion.add(cardId);
      }
      renderGallery();
    }

    function selectAll() {
      cards.forEach(card => markedForDeletion.add(card.id));
      renderGallery();
    }

    function deselectAll() {
      markedForDeletion.clear();
      renderGallery();
    }

    function updateStats() {
      const count = markedForDeletion.size;
      document.getElementById('marked-count').textContent = count;
      document.getElementById('delete-btn').disabled = count === 0;
    }

    function confirmDelete() {
      if (markedForDeletion.size === 0) return;
      
      document.getElementById('delete-count').textContent = markedForDeletion.size;
      document.getElementById('confirm-modal').classList.add('show');
    }

    function closeModal() {
      document.getElementById('confirm-modal').classList.remove('show');
    }

    async function executeDelete() {
      closeModal();
      
      const deleteBtn = document.getElementById('delete-btn');
      deleteBtn.textContent = 'Deleting...';
      deleteBtn.disabled = true;

      try {
        const response = await fetch('/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardIds: Array.from(markedForDeletion) })
        });

        const result = await response.json();
        
        if (result.success) {
          // Remove deleted cards from array
          cards = cards.filter(card => !markedForDeletion.has(card.id));
          markedForDeletion.clear();
          renderGallery();
          
          alert('✅ Successfully deleted cards!');
        } else {
          alert('❌ Error: ' + result.error);
        }
      } catch (error) {
        alert('❌ Error deleting cards: ' + error.message);
      }

      deleteBtn.textContent = 'Delete Selected';
      deleteBtn.disabled = markedForDeletion.size === 0;
    }

    // Load cards on page load
    loadCards();
  </script>
</body>
</html>`;
}

// ==================== MAIN ====================

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║              🎴 SURF CARD CURATION TOOL 🎴                ║
║                 VERSION 2.0 - WINDOWS FIX                 ║
║              NO AUTO-BROWSER OPEN (MANUAL)                ║
╚═══════════════════════════════════════════════════════════╝
`);

  // Check if complete-cards directory exists
  try {
    await fs.access(CONFIG.cardsDir);
    console.log(`✅ Found cards directory: ${CONFIG.cardsDir}`);
  } catch (error) {
    console.error(`❌ ERROR: Directory "${CONFIG.cardsDir}" not found!`);
    console.log(`\n💡 This tool curates cards in the complete-cards directory.`);
    console.log(`   Run completeCardPipeline.mjs first to generate cards.\n`);
    process.exit(1);
  }

  // Check if images exist
  try {
    const imageFiles = await fs.readdir(CONFIG.imagesDir);
    const cardImages = imageFiles.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    
    if (cardImages.length === 0) {
      console.error(`❌ ERROR: No images found in ${CONFIG.imagesDir}`);
      process.exit(1);
    }

    console.log(`📊 Found ${cardImages.length} cards to curate`);
  } catch (error) {
    console.error(`❌ ERROR: Could not read images directory`);
    process.exit(1);
  }

  // Start server
  server.listen(CONFIG.port, () => {
    const url = `http://localhost:${CONFIG.port}`;
    console.log(`\n🚀 Server running at ${url}`);
    console.log(`\n🌐 Please open this URL in your browser:\n`);
    console.log(`   👉 ${url}\n`);
    console.log(`💡 Instructions:`);
    console.log(`   - Click cards to mark for deletion (red border)`);
    console.log(`   - Use "Select All" / "Deselect All" for bulk operations`);
    console.log(`   - Click "Delete Selected" to permanently remove cards`);
    console.log(`   - Press Ctrl+C to stop the server when done\n`);
  });
}

main().catch(error => {
  console.error(`\n❌ FATAL ERROR:`, error);
  process.exit(1);
});

/**
 * Generate a standalone HTML file for a trading card
 * This creates a self-contained HTML file that can be uploaded to IPFS
 * and used as the animation_url in NFT metadata
 */

export function generateCardHTML(card, imageIPFSUrl) {
  // Helper to escape HTML
  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const theme = card.theme || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(card.name)} - Trading Card</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 20px;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .card-container {
      position: relative;
      width: 100%;
      max-width: 400px;
      aspect-ratio: 3 / 4;
    }

    .card-content {
      letter-spacing: 0.1px;
      width: 100%;
      height: 100%;
      border: 6px solid #1a1a1a;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      background: ${theme.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'};
    }

    .card-header {
      border-bottom: 3px solid #1a1a2e;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: "Cinzel", serif;
      flex-shrink: 0;
      position: relative;
      background: ${theme.header?.background || 'linear-gradient(135deg, #4a4a4a, #2a2a2a)'};
      color: ${theme.header?.color || '#ffffff'};
      text-shadow: ${theme.header?.textShadow || '2px 2px 4px rgba(0, 0, 0, 0.8)'};
      box-shadow: ${theme.header?.boxShadow || '0 4px 15px rgba(0, 0, 0, 0.4)'};
    }

    .card-title {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .card-level {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      white-space: nowrap;
      background: ${theme.stat?.background || 'rgba(0, 0, 0, 0.8)'};
      color: ${theme.stat?.color || '#ffffff'};
      box-shadow: ${theme.stat?.boxShadow || '0 0 8px rgba(255, 255, 255, 0.5)'};
      border: ${theme.stat?.border || '2px solid #ffffff'};
    }

    .mana-cost {
      display: flex;
      gap: 4px;
      margin-bottom: 4px;
    }

    .mana-orb {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 2px solid #1a1a1a;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      position: relative;
      transition: transform 0.2s ease;
    }

    .mana-orb:hover {
      transform: scale(1.1);
    }

    .orb-value {
      font-size: 0.6rem;
      font-weight: 700;
      line-height: 1;
    }

    .image-area {
      height: 40%;
      margin: 8px;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${theme.imageArea?.background || 'linear-gradient(145deg, #2a2a2a, #1a1a1a)'};
      border: ${theme.imageArea?.border || '2px solid #ffffff'};
      box-shadow: ${theme.imageArea?.boxShadow || 'inset 0 4px 8px rgba(0, 0, 0, 0.6)'};
    }

    .card-image {
      width: auto;
      height: 100%;
      transform: scale(1.1);
      object-fit: cover;
    }

    .type-power-section {
      padding: 10px 16px;
      font-family: "Cinzel", serif;
      font-size: 0.525rem;
      font-weight: 600;
      border-top: 2px solid #1a1a2e;
      border-bottom: 2px solid #1a1a2e;
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: ${theme.typeSection?.background || 'linear-gradient(135deg, #3a3a3a, #2a2a2a)'};
      color: ${theme.typeSection?.color || '#ffffff'};
      text-shadow: ${theme.typeSection?.textShadow || '1px 1px 2px rgba(0, 0, 0, 0.8)'};
      box-shadow: ${theme.typeSection?.boxShadow || '0 4px 15px rgba(0, 0, 0, 0.4)'};
    }

    .power-stats {
      font-size: 0.45rem;
      display: flex;
      gap: 8px;
      white-space: nowrap;
    }

    .stat {
      padding: 4px 8px;
      border-radius: 4px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      background: ${theme.stat?.background || 'rgba(0, 0, 0, 0.8)'};
      border: ${theme.stat?.border || '2px solid #ffffff'};
      color: ${theme.stat?.color || '#ffffff'};
      box-shadow: ${theme.stat?.boxShadow || '0 0 8px rgba(255, 255, 255, 0.5)'};
    }

    .flavor-text {
      padding: 0 16px;
      font-family: "Crimson Text", serif;
      font-size: 0.6rem;
      line-height: 1.1;
      text-align: center;
      font-style: italic;
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: ${theme.flavorText?.background || 'transparent'};
      color: ${theme.flavorText?.color || '#cccccc'};
      border-bottom: ${theme.flavorText?.border || 'none'};
    }

    .flavor-text::before {
      content: '"';
      font-size: 1.8rem;
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0.4;
      color: ${theme.flavorText?.accentColor || theme.flavorText?.color || '#cccccc'};
    }

    .flavor-text::after {
      content: '"';
      font-size: 1.8rem;
      position: absolute;
      bottom: -0.5rem;
      right: 0.2rem;
      opacity: 0.4;
      color: ${theme.flavorText?.accentColor || theme.flavorText?.color || '#cccccc'};
    }

    .flavor-text-content {
      white-space: pre-line;
    }

    .bottom-section {
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: ${theme.bottomSection?.background || 'linear-gradient(135deg, #2a2a2a, #1a1a1a)'};
    }

    .artist-info {
      font-size: 0.6rem;
      font-family: "Cinzel", serif;
      opacity: 0.8;
      color: ${theme.flavorText?.color || '#cccccc'};
    }

    .rarity-indicator {
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 0.625rem;
      font-weight: 700;
      border: 2px solid #1a1a1a;
      font-family: "Cinzel", serif;
      letter-spacing: 0.1em;
      background: ${theme.rarity?.background || 'linear-gradient(135deg, #4a4a4a, #2a2a2a)'};
      color: ${theme.rarity?.color || '#ffffff'};
      box-shadow: ${theme.rarity?.boxShadow || '0 0 10px rgba(255, 255, 255, 0.6)'};
    }

    @media (max-width: 480px) {
      .card-container {
        max-width: 300px;
      }

      .card-title {
        font-size: 0.65rem;
      }

      .type-power-section {
        font-size: 0.5rem;
      }

      .flavor-text {
        font-size: 0.6rem;
      }
    }
  </style>
</head>
<body>
  <div class="card-container">
    <div class="card-content">
      <!-- Header -->
      <div class="card-header">
        <div>
          <div class="mana-cost">
            ${(card.manaCost || []).map(mana => `
            <div class="mana-orb" style="background: ${mana.color}; color: ${mana.textColor || '#fff'};" title="${mana.type}">
              <div class="orb-value">${mana.value}</div>
            </div>
            `).join('')}
          </div>
          <div class="card-title">
            ${escapeHtml(card.name)} ${escapeHtml(card.subtitle || '')}
          </div>
        </div>
        <div class="card-level">
          LVL ${escapeHtml(card.level || '1')}
        </div>
      </div>

      <!-- Image Area -->
      <div class="image-area">
        <img src="${imageIPFSUrl}" alt="${escapeHtml(card.name)}" class="card-image" />
      </div>

      <!-- Type and Power Section -->
      <div class="type-power-section">
        <div>${escapeHtml(card.type || 'Creature')}</div>
        ${card.stats ? `
        <div class="power-stats">
          <div class="stat">ATK: ${card.stats.attack || 0}</div>
          <div class="stat">DEF: ${card.stats.defense || 0}</div>
        </div>
        ` : ''}
      </div>

      <!-- Flavor Text -->
      <div class="flavor-text">
        <div class="flavor-text-content">${escapeHtml(card.flavorText || '')}</div>
      </div>

      <!-- Bottom Section -->
      <div class="bottom-section">
        <div class="artist-info">
          ◆ ${escapeHtml(card.artist || 'Waves TCG')} ◆
        </div>
        <div class="rarity-indicator">
          ★ ${escapeHtml(card.rarity || '1/1')} ★
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

import React from "react";
import "./MintedCardDisplay.css";

/**
 * Static card display component for post-mint success screen
 * Shows the full card without swipe functionality
 */
function MintedCardDisplay({ card }) {
  const theme = card.theme || {};

  const getOrbTooltip = (type) => {
    const tooltips = {
      hp: "Health Points",
      mana: "Mana Cost to Play",
      terrain: "Terrain Alignment",
    };
    return tooltips[type] || type;
  };

  return (
    <div className="minted-card">
      <div
        className="minted-card-content"
        style={{
          background:
            theme.background || "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
        }}
      >
        {/* Header */}
        <div
          className="minted-card-header"
          style={{
            background: theme.header?.background,
            color: theme.header?.color,
            textShadow: theme.header?.textShadow,
            boxShadow: theme.header?.boxShadow,
          }}
        >
          <div>
            <div className="minted-mana-cost">
              {card.manaCost?.map((mana, idx) => (
                <div
                  key={idx}
                  className="minted-mana-orb"
                  style={{
                    background: mana.color,
                    color: mana.textColor || "#fff",
                  }}
                  title={getOrbTooltip(mana.type)}
                >
                  <div className="minted-orb-value">{mana.value}</div>
                </div>
              ))}
            </div>
            <div className="minted-card-title">
              {card.name} {card.subtitle}
            </div>
          </div>
          <div
            className="minted-card-level"
            style={{
              background: theme.stat?.background,
              color: theme.stat?.color,
              boxShadow: theme.stat?.boxShadow,
              border: theme.stat?.border,
            }}
          >
            LVL {card.level}
          </div>
        </div>

        {/* Image Area */}
        <div
          className="minted-image-area"
          style={{
            background: theme.imageArea?.background,
            border: theme.imageArea?.border,
            boxShadow: theme.imageArea?.boxShadow,
          }}
        >
          <img src={card.imageData} alt={card.name} className="minted-card-image" />
        </div>

        {/* Type and Power Section */}
        <div
          className="minted-type-power-section"
          style={{
            background: theme.typeSection?.background,
            color: theme.typeSection?.color,
            textShadow: theme.typeSection?.textShadow,
            boxShadow: theme.typeSection?.boxShadow,
          }}
        >
          <div>{card.type}</div>
          {card.stats && (
            <div className="minted-power-stats">
              <div
                className="minted-stat"
                style={{
                  background: theme.stat?.background,
                  border: theme.stat?.border,
                  color: theme.stat?.color,
                  boxShadow: theme.stat?.boxShadow,
                }}
              >
                ATK: {card.stats.attack}
              </div>
              <div
                className="minted-stat"
                style={{
                  background: theme.stat?.background,
                  border: theme.stat?.border,
                  color: theme.stat?.color,
                  boxShadow: theme.stat?.boxShadow,
                }}
              >
                DEF: {card.stats.defense}
              </div>
            </div>
          )}
        </div>

        {/* Flavor Text */}
        <div
          className="minted-flavor-text"
          style={{
            background: theme.flavorText?.background,
            color: theme.flavorText?.color,
            borderBottom: theme.flavorText?.border,
          }}
        >
          <div className="minted-flavor-text-content">{card.flavorText}</div>
        </div>

        {/* Bottom Section */}
        <div
          className="minted-bottom-section"
          style={{ background: theme.bottomSection?.background }}
        >
          <div
            className="minted-artist-info"
            style={{ color: theme.flavorText?.color }}
          >
            ◆ {card.artist} ◆
          </div>
          <div
            className="minted-rarity-indicator"
            style={{
              background: theme.rarity?.background,
              color: theme.rarity?.color,
              border: theme.rarity?.border,
              boxShadow: theme.rarity?.boxShadow,
            }}
          >
            ★ {card.rarity} ★
          </div>
        </div>
      </div>
    </div>
  );
}

export default MintedCardDisplay;

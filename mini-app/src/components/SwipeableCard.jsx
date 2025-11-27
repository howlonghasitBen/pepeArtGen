import React from "react";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import "./SwipeableCard.css";

function SwipeableCard({ card, onSwipeLeft, onSwipeRight }) {
  const [{ x, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    rotate: 0,
    scale: 1,
    config: { tension: 200, friction: 20 },
  }));

  // Initial tilt animation to hint at swipeability
  const [hasShownHint, setHasShownHint] = React.useState(false);

  React.useEffect(() => {
    if (!hasShownHint) {
      // Subtle tilt left, then right, then center
      const showHint = async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        api.start({ rotate: -3, x: -20 });
        await new Promise((resolve) => setTimeout(resolve, 400));
        api.start({ rotate: 3, x: 20 });
        await new Promise((resolve) => setTimeout(resolve, 400));
        api.start({ rotate: 0, x: 0 });
        setHasShownHint(true);
      };
      showHint();
    }
  }, [hasShownHint, api]);

  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      const trigger = vx > 0.2 || Math.abs(mx) > 100;

      if (!active && trigger) {
        // Swipe completed
        if (xDir > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
        api.start({
          x: xDir > 0 ? 1000 : -1000,
          rotate: xDir * 50,
          scale: 0.8,
        });
      } else {
        // Dragging or released without trigger
        api.start({
          x: active ? mx : 0,
          rotate: active ? mx / 10 : 0,
          scale: active ? 1.05 : 1,
        });
      }
    },
    {
      axis: "x",
      bounds: { left: -300, right: 300 },
      rubberband: true,
    }
  );

  // Color indicators during swipe - subtle glow only
  const leftGlow = x.to((val) => (val < -50 ? Math.abs(val) / 300 : 0));
  const rightGlow = x.to((val) => (val > 50 ? val / 300 : 0));

  const theme = card.theme || {};

  // Helper functions for orb labels and tooltips
  const getOrbTooltip = (type) => {
    const tooltips = {
      hp: "Health Points",
      mana: "Mana Cost to Play",
      terrain: "Terrain Alignment",
    };
    return tooltips[type] || type;
  };

  return (
    <animated.div
      {...bind()}
      className="swipeable-card"
      style={{
        x,
        rotate,
        scale,
        touchAction: "none",
      }}
    >
      {/* Subtle glow indicators */}
      <animated.div
        className="swipe-glow left"
        style={{
          opacity: leftGlow,
        }}
      />
      <animated.div
        className="swipe-glow right"
        style={{
          opacity: rightGlow,
        }}
      />

      <div
        className="card-content"
        style={{
          background:
            theme.background || "linear-gradient(145deg, #2a2a2a, #1a1a1a)",
        }}
      >
        {/* Header */}
        <div
          className="card-header"
          style={{
            background: theme.header?.background,
            color: theme.header?.color,
            textShadow: theme.header?.textShadow,
            boxShadow: theme.header?.boxShadow,
          }}
        >
          <div>
            <div className="mana-cost">
              {card.manaCost?.map((mana, idx) => (
                <div
                  key={idx}
                  className="mana-orb"
                  style={{
                    background: mana.color,
                    color: mana.textColor || "#fff",
                  }}
                  title={getOrbTooltip(mana.type)}
                >
                  <div className="orb-value">{mana.value}</div>
                </div>
              ))}
            </div>
            <div className="card-title">
              {card.name} {card.subtitle}
            </div>
          </div>
          <div
            className="card-level"
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
          className="image-area"
          style={{
            background: theme.imageArea?.background,
            border: theme.imageArea?.border,
            boxShadow: theme.imageArea?.boxShadow,
          }}
        >
          <img src={card.imageData} alt={card.name} className="card-image" />
        </div>

        {/* Type and Power Section */}
        <div
          className="type-power-section"
          style={{
            background: theme.typeSection?.background,
            color: theme.typeSection?.color,
            textShadow: theme.typeSection?.textShadow,
            boxShadow: theme.typeSection?.boxShadow,
          }}
        >
          <div>{card.type}</div>
          {card.stats && (
            <div className="power-stats">
              <div
                className="stat"
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
                className="stat"
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
          className="flavor-text"
          style={{
            background: theme.flavorText?.background,
            color: theme.flavorText?.color,
            borderBottom: theme.flavorText?.border,
          }}
        >
          <div className="flavor-text-content">{card.flavorText}</div>
          {theme.flavorText?.accentColor && (
            <style>{`
              .flavor-text::before,
              .flavor-text::after {
                color: ${theme.flavorText.accentColor};
              }
            `}</style>
          )}
        </div>

        {/* Bottom Section */}
        <div
          className="bottom-section"
          style={{ background: theme.bottomSection?.background }}
        >
          <div
            className="artist-info"
            style={{ color: theme.flavorText?.color }}
          >
            ◆ {card.artist} ◆
          </div>
          <div
            className="rarity-indicator"
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
    </animated.div>
  );
}

export default SwipeableCard;

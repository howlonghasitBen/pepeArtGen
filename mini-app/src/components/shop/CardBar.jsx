import { useRef, useState, useMemo, useEffect } from "react";
import Card3D from "./Card3D";
import { CARD_LAYOUT } from "../../constants/cardLayout";

const { CARD_BAR, ASPECT_RATIO } = CARD_LAYOUT;

/**
 * Bar counter with card display stands and rotating card showcase
 * Displays cards on counter (rotating) and on wall shelves (static)
 */
function CardBar({ cards = [], onCardClick }) {
  const groupRef = useRef();
  const [displayOffset, setDisplayOffset] = useState(0);

  const { BAR, COUNTER, SHELVES } = CARD_BAR;

  // Rotate counter cards at configured interval
  useEffect(() => {
    if (cards.length <= COUNTER.MAX_CARDS) return;

    const interval = setInterval(() => {
      setDisplayOffset((prev) => (prev + 1) % cards.length);
    }, COUNTER.ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [cards.length]);

  // Calculate card positions for counter (rotating through all cards)
  const counterCards = useMemo(() => {
    if (!cards.length) return [];

    const displayCount = Math.min(cards.length, COUNTER.MAX_CARDS);
    const spacing = COUNTER.BAR_WIDTH / (displayCount + 1);

    return Array.from({ length: displayCount }, (_, i) => {
      const cardIndex = (displayOffset + i) % cards.length;
      return {
        card: cards[cardIndex],
        position: [
          -COUNTER.BAR_WIDTH / 2 + spacing * (i + 1),
          COUNTER.Y_POSITION,
          COUNTER.Z_POSITION,
        ],
      };
    });
  }, [cards, displayOffset]);

  // Distribute cards across shelves evenly
  const shelfCards = useMemo(() => {
    if (!cards.length) return [];

    const { CARDS_PER_SHELF, SHELF_WIDTH, POSITIONS, CARD_SCALE } = SHELVES;
    const totalShelfSlots = POSITIONS.length * CARDS_PER_SHELF;

    // Take cards for shelves (skip first few if they're on counter)
    const shelfCardsList = cards.slice(0, totalShelfSlots);

    return shelfCardsList.map((card, index) => {
      const shelfIndex = Math.floor(index / CARDS_PER_SHELF);
      const posInShelf = index % CARDS_PER_SHELF;
      const spacing = SHELF_WIDTH / (CARDS_PER_SHELF + 1);

      if (shelfIndex >= POSITIONS.length) return null;

      const shelfPos = POSITIONS[shelfIndex];
      return {
        card,
        shelfIndex,
        position: [
          -SHELF_WIDTH / 2 + spacing * (posInShelf + 1),
          shelfPos.y,
          shelfPos.z,
        ],
        scale: CARD_SCALE,
      };
    }).filter(Boolean);
  }, [cards]);

  return (
    <group ref={groupRef}>
      {/* Main bar counter */}
      <group position={[0, 0, -3.5]}>
        {/* Bar top surface */}
        <mesh receiveShadow castShadow position={[0, 1.1, 0]}>
          <boxGeometry args={[BAR.WIDTH, BAR.HEIGHT, BAR.DEPTH]} />
          <meshStandardMaterial
            color={BAR.TOP_COLOR}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* Bar front panel */}
        <mesh receiveShadow castShadow position={[0, 0.5, 0.65]}>
          <boxGeometry args={[BAR.WIDTH, 1, 0.1]} />
          <meshStandardMaterial color={BAR.BASE_COLOR} roughness={0.7} />
        </mesh>

        {/* Bar back panel */}
        <mesh receiveShadow castShadow position={[0, 0.5, -0.65]}>
          <boxGeometry args={[BAR.WIDTH, 1, 0.1]} />
          <meshStandardMaterial color={BAR.BASE_COLOR} roughness={0.7} />
        </mesh>

        {/* Bar side panels */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            receiveShadow
            castShadow
            position={[side * (BAR.WIDTH / 2 - 0.05), 0.5, 0]}
          >
            <boxGeometry args={[0.1, 1, BAR.DEPTH]} />
            <meshStandardMaterial color={BAR.BASE_COLOR} roughness={0.7} />
          </mesh>
        ))}

        {/* Bar foot rail */}
        <mesh position={[0, 0.2, 0.8]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, BAR.WIDTH - 1, 8]} />
          <meshStandardMaterial
            color={BAR.METAL_COLOR}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Neon strip under bar top */}
        <mesh position={[0, 1.0, 0.7]}>
          <boxGeometry args={[BAR.WIDTH - 0.5, 0.03, 0.03]} />
          <meshStandardMaterial
            color={BAR.NEON_COLOR}
            emissive={BAR.NEON_COLOR}
            emissiveIntensity={2}
          />
        </mesh>
        <pointLight
          position={[0, 1.0, 0.7]}
          intensity={0.3}
          color={BAR.NEON_COLOR}
          distance={3}
        />

        {/* Bar stools */}
        {[-4, -2, 0, 2, 4].map((x, i) => (
          <group key={i} position={[x, 0, 1.5]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 0.1, 8]} />
              <meshStandardMaterial
                color={BAR.METAL_COLOR}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
              <meshStandardMaterial
                color={BAR.METAL_COLOR}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <mesh castShadow position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.25, 0.22, 0.1, 16]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Back wall with shelves */}
      <group position={[0, 0, -5]}>
        {/* Back wall */}
        <mesh receiveShadow position={[0, 3, -0.3]}>
          <boxGeometry args={[BAR.WIDTH, 5, 0.2]} />
          <meshStandardMaterial color="#1a1515" roughness={0.9} />
        </mesh>

        {/* Shelves */}
        {SHELVES.POSITIONS.map((shelfPos, shelfIndex) => (
          <group key={shelfIndex} position={[0, shelfPos.y - 0.4, 0]}>
            {/* Shelf board */}
            <mesh receiveShadow>
              <boxGeometry args={[SHELVES.SHELF_WIDTH + 1, 0.06, 0.5]} />
              <meshStandardMaterial color={BAR.BASE_COLOR} roughness={0.6} />
            </mesh>

            {/* Shelf brackets */}
            {[-4, -1.5, 1.5, 4].map((x, i) => (
              <mesh key={i} position={[x, -0.12, 0]} castShadow>
                <boxGeometry args={[0.06, 0.25, 0.35]} />
                <meshStandardMaterial
                  color={BAR.METAL_COLOR}
                  metalness={0.6}
                  roughness={0.4}
                />
              </mesh>
            ))}

            {/* LED strip */}
            <mesh position={[0, 0.02, 0.28]}>
              <boxGeometry args={[SHELVES.SHELF_WIDTH, 0.015, 0.015]} />
              <meshStandardMaterial
                color={SHELVES.LED_COLORS[shelfIndex]}
                emissive={SHELVES.LED_COLORS[shelfIndex]}
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Cards on shelves */}
      {shelfCards.map(({ card, position, scale, shelfIndex }, index) => (
        <group key={`shelf-${card.id || index}`} position={[0, 0, -5]}>
          <Card3D
            card={card}
            position={position}
            onClick={() => onCardClick?.(card)}
            index={index + shelfIndex * 10}
            scale={scale}
          />
        </group>
      ))}

      {/* Counter display cards (rotating) */}
      {counterCards.map(({ card, position }, index) => (
        <Card3D
          key={`counter-${card.id || index}-${displayOffset}`}
          card={card}
          position={position}
          onClick={() => onCardClick?.(card)}
          index={index}
          scale={0.85}
        />
      ))}

      {/* "CARDS" sign */}
      <group position={[0, 5.2, -5.3]}>
        <mesh>
          <boxGeometry args={[2.5, 0.6, 0.1]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.3, 0.4]} />
          <meshStandardMaterial
            color={BAR.NEON_COLOR}
            emissive={BAR.NEON_COLOR}
            emissiveIntensity={3}
            transparent
            opacity={0.9}
          />
        </mesh>
        <pointLight
          position={[0, 0, 0.5]}
          intensity={0.5}
          color={BAR.NEON_COLOR}
          distance={2}
        />
      </group>

      {/* Empty state */}
      {cards.length === 0 && (
        <group position={[0, 1.6, -3]}>
          <mesh>
            <planeGeometry args={[3, 0.5]} />
            <meshStandardMaterial color="#333" transparent opacity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default CardBar;

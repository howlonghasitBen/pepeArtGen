import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Card3D from "./Card3D";

// Bar counter with card display stands and rotating card showcase
function CardBar({ cards = [], onCardClick }) {
  const groupRef = useRef();
  const [displayOffset, setDisplayOffset] = useState(0);

  // Colors
  const colors = {
    barTop: "#4a3728",
    barBase: "#3d2817",
    metal: "#888888",
    neon: "#00ff88",
  };

  // Rotate cards every 5 seconds
  const maxCounterCards = 6;
  useEffect(() => {
    if (cards.length <= maxCounterCards) return;

    const interval = setInterval(() => {
      setDisplayOffset((prev) => (prev + 1) % cards.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [cards.length]);

  // Calculate card positions for counter (rotating through all cards)
  const counterCardPositions = useMemo(() => {
    if (!cards.length) return [];

    const barWidth = 10;
    const displayCount = Math.min(cards.length, maxCounterCards);
    const spacing = barWidth / (displayCount + 1);

    // Get cards to display with rotation offset
    const displayCards = [];
    for (let i = 0; i < displayCount; i++) {
      const cardIndex = (displayOffset + i) % cards.length;
      displayCards.push({
        card: cards[cardIndex],
        position: [
          -barWidth / 2 + spacing * (i + 1),
          1.7,
          -3,
        ],
        rotation: [0, 0, 0],
      });
    }

    return displayCards;
  }, [cards, displayOffset]);

  // Calculate card positions for shelves (static display of more cards)
  const shelfCardPositions = useMemo(() => {
    if (!cards.length) return { shelf1: [], shelf2: [], shelf3: [], shelf4: [] };

    const shelfWidth = 9;
    const cardsPerShelf = 8;

    // Distribute cards across 4 shelves
    const shelf1Cards = [];
    const shelf2Cards = [];
    const shelf3Cards = [];
    const shelf4Cards = [];

    cards.forEach((card, index) => {
      const shelfIndex = Math.floor(index / cardsPerShelf) % 4;
      const posInShelf = index % cardsPerShelf;
      const spacing = shelfWidth / (cardsPerShelf + 1);
      const xPos = -shelfWidth / 2 + spacing * (posInShelf + 1);

      const cardData = {
        card,
        position: [xPos, 0, 0],
      };

      if (shelfIndex === 0 && shelf1Cards.length < cardsPerShelf) {
        shelf1Cards.push(cardData);
      } else if (shelfIndex === 1 && shelf2Cards.length < cardsPerShelf) {
        shelf2Cards.push(cardData);
      } else if (shelfIndex === 2 && shelf3Cards.length < cardsPerShelf) {
        shelf3Cards.push(cardData);
      } else if (shelfIndex === 3 && shelf4Cards.length < cardsPerShelf) {
        shelf4Cards.push(cardData);
      }
    });

    return { shelf1: shelf1Cards, shelf2: shelf2Cards, shelf3: shelf3Cards, shelf4: shelf4Cards };
  }, [cards]);

  return (
    <group ref={groupRef}>
      {/* Main bar counter */}
      <group position={[0, 0, -3.5]}>
        {/* Bar top surface */}
        <mesh receiveShadow castShadow position={[0, 1.1, 0]}>
          <boxGeometry args={[12, 0.15, 1.5]} />
          <meshStandardMaterial
            color={colors.barTop}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>

        {/* Bar front panel */}
        <mesh receiveShadow castShadow position={[0, 0.5, 0.65]}>
          <boxGeometry args={[12, 1, 0.1]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.7} />
        </mesh>

        {/* Bar back panel */}
        <mesh receiveShadow castShadow position={[0, 0.5, -0.65]}>
          <boxGeometry args={[12, 1, 0.1]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.7} />
        </mesh>

        {/* Bar side panels */}
        <mesh receiveShadow castShadow position={[-5.95, 0.5, 0]}>
          <boxGeometry args={[0.1, 1, 1.5]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.7} />
        </mesh>
        <mesh receiveShadow castShadow position={[5.95, 0.5, 0]}>
          <boxGeometry args={[0.1, 1, 1.5]} />
          <meshStandardMaterial color={colors.barBase} roughness={0.7} />
        </mesh>

        {/* Bar foot rail */}
        <mesh position={[0, 0.2, 0.8]}>
          <cylinderGeometry args={[0.04, 0.04, 11, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Neon strip under bar top */}
        <mesh position={[0, 1.0, 0.7]}>
          <boxGeometry args={[11.5, 0.03, 0.03]} />
          <meshStandardMaterial
            color={colors.neon}
            emissive={colors.neon}
            emissiveIntensity={2}
          />
        </mesh>
        <pointLight position={[0, 1.0, 0.7]} intensity={0.3} color={colors.neon} distance={3} />

        {/* Bar stools */}
        {[-4, -2, 0, 2, 4].map((x, i) => (
          <group key={i} position={[x, 0, 1.5]}>
            {/* Stool base */}
            <mesh castShadow>
              <cylinderGeometry args={[0.3, 0.35, 0.1, 8]} />
              <meshStandardMaterial color={colors.metal} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Stool pole */}
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
              <meshStandardMaterial color={colors.metal} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Stool seat */}
            <mesh castShadow position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.25, 0.22, 0.1, 16]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Extended back shelf system for displaying many cards */}
      <group position={[0, 0, -5]}>
        {/* Back wall */}
        <mesh receiveShadow position={[0, 2.5, -0.3]}>
          <boxGeometry args={[12, 4, 0.2]} />
          <meshStandardMaterial color="#2a2020" roughness={0.8} />
        </mesh>

        {/* Shelf 1 - lowest */}
        <group position={[0, 1.4, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[11, 0.08, 0.5]} />
            <meshStandardMaterial color={colors.barBase} roughness={0.6} />
          </mesh>
          {/* Shelf bracket */}
          {[-4.5, -1.5, 1.5, 4.5].map((x, i) => (
            <mesh key={i} position={[x, -0.15, 0]} castShadow>
              <boxGeometry args={[0.08, 0.3, 0.4]} />
              <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          {/* LED strip */}
          <mesh position={[0, -0.02, 0.28]}>
            <boxGeometry args={[10.5, 0.02, 0.02]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={1.5} />
          </mesh>
          {/* Cards on shelf 1 */}
          {shelfCardPositions.shelf1.map(({ card, position }, index) => (
            <Card3D
              key={`shelf1-${card.id || index}`}
              card={card}
              position={[position[0], 0.5, 0.1]}
              onClick={() => onCardClick?.(card)}
              index={index}
            />
          ))}
        </group>

        {/* Shelf 2 */}
        <group position={[0, 2.4, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[11, 0.08, 0.5]} />
            <meshStandardMaterial color={colors.barBase} roughness={0.6} />
          </mesh>
          {[-4.5, -1.5, 1.5, 4.5].map((x, i) => (
            <mesh key={i} position={[x, -0.15, 0]} castShadow>
              <boxGeometry args={[0.08, 0.3, 0.4]} />
              <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, -0.02, 0.28]}>
            <boxGeometry args={[10.5, 0.02, 0.02]} />
            <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1.5} />
          </mesh>
          {/* Cards on shelf 2 */}
          {shelfCardPositions.shelf2.map(({ card, position }, index) => (
            <Card3D
              key={`shelf2-${card.id || index}`}
              card={card}
              position={[position[0], 0.5, 0.1]}
              onClick={() => onCardClick?.(card)}
              index={index + 10}
            />
          ))}
        </group>

        {/* Shelf 3 */}
        <group position={[0, 3.4, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[11, 0.08, 0.5]} />
            <meshStandardMaterial color={colors.barBase} roughness={0.6} />
          </mesh>
          {[-4.5, -1.5, 1.5, 4.5].map((x, i) => (
            <mesh key={i} position={[x, -0.15, 0]} castShadow>
              <boxGeometry args={[0.08, 0.3, 0.4]} />
              <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, -0.02, 0.28]}>
            <boxGeometry args={[10.5, 0.02, 0.02]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} />
          </mesh>
          {/* Cards on shelf 3 */}
          {shelfCardPositions.shelf3.map(({ card, position }, index) => (
            <Card3D
              key={`shelf3-${card.id || index}`}
              card={card}
              position={[position[0], 0.5, 0.1]}
              onClick={() => onCardClick?.(card)}
              index={index + 20}
            />
          ))}
        </group>

        {/* Shelf 4 - highest */}
        <group position={[0, 4.4, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[11, 0.08, 0.5]} />
            <meshStandardMaterial color={colors.barBase} roughness={0.6} />
          </mesh>
          {[-4.5, -1.5, 1.5, 4.5].map((x, i) => (
            <mesh key={i} position={[x, -0.15, 0]} castShadow>
              <boxGeometry args={[0.08, 0.3, 0.4]} />
              <meshStandardMaterial color={colors.metal} metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, -0.02, 0.28]}>
            <boxGeometry args={[10.5, 0.02, 0.02]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1.5} />
          </mesh>
          {/* Cards on shelf 4 */}
          {shelfCardPositions.shelf4.map(({ card, position }, index) => (
            <Card3D
              key={`shelf4-${card.id || index}`}
              card={card}
              position={[position[0], 0.5, 0.1]}
              onClick={() => onCardClick?.(card)}
              index={index + 30}
            />
          ))}
        </group>
      </group>

      {/* Display stand cards on the bar - rotating through all cards */}
      {counterCardPositions.map(({ card, position }, index) => (
        <Card3D
          key={`counter-${card.id || index}-${displayOffset}`}
          card={card}
          position={position}
          onClick={() => onCardClick?.(card)}
          index={index}
        />
      ))}

      {/* "CARDS" sign */}
      <group position={[0, 4.8, -5.3]}>
        <mesh>
          <boxGeometry args={[2.5, 0.6, 0.1]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
        {/* Neon text effect */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.3, 0.4]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={3}
            transparent
            opacity={0.9}
          />
        </mesh>
        <pointLight position={[0, 0, 0.5]} intensity={0.5} color="#00ff88" distance={2} />
      </group>

      {/* Card count indicator */}
      {cards.length > maxCounterCards && (
        <group position={[0, 0.9, -2.8]}>
          <mesh>
            <planeGeometry args={[2, 0.3]} />
            <meshStandardMaterial
              color="#000"
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>
      )}

      {/* Empty state message when no cards */}
      {cards.length === 0 && (
        <group position={[0, 1.6, -3]}>
          <mesh>
            <planeGeometry args={[3, 0.5]} />
            <meshStandardMaterial
              color="#333"
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default CardBar;

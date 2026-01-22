/**
 * ShopProps.jsx
 *
 * Container component for Meshy AI generated props and card displays.
 * Shelves are positioned inside the shack with cards displayed on them.
 */

import { Suspense, useMemo } from 'react';
import MeshyModel, { preloadModel } from './MeshyModel';
import Card3D from './Card3D';

// ============================================
// CONFIGURATION
// ============================================

// Shelf configuration - unified sizing
const SHELF_CONFIG = {
  scale: 1.2,              // Reduced scale to fit interior
  cardScale: 0.55,         // Card scale to fit shelves
  cardsPerShelf: 3,        // Cards per shelf row (reduced for tighter fit)
  cardSpacing: 0.75,       // Horizontal spacing between cards
  cardYOffset: 0.6,        // Height offset for cards on shelf surface
};

// Shack interior dimensions - adjusted based on visual feedback
// Shack is at [0, 0, -5] with scale 7.5
// Interior is narrower than expected from screenshots
const SHACK_INTERIOR = {
  centerX: 0,
  floorY: 0,
  backZ: -5.5,    // Back wall (pulled forward)
  frontZ: -2.5,   // Entrance area
  leftX: -2,      // Narrower interior
  rightX: 2,
};

// Shelf placements inside the shack - centered and pulled away from walls
const SHELF_PLACEMENTS = [
  // Back wall shelves (2 levels) - centered on back wall
  {
    id: 'shelf-back-lower',
    position: [0, 1.0, SHACK_INTERIOR.backZ],
    rotation: [0, 0, 0],
    shelfIndex: 0,
  },
  {
    id: 'shelf-back-upper',
    position: [0, 2.4, SHACK_INTERIOR.backZ],
    rotation: [0, 0, 0],
    shelfIndex: 1,
  },
  // Left wall shelf - pulled inward
  {
    id: 'shelf-left',
    position: [SHACK_INTERIOR.leftX + 0.3, 1.6, -4],
    rotation: [0, Math.PI / 2, 0],
    shelfIndex: 2,
  },
  // Right wall shelf - pulled inward
  {
    id: 'shelf-right',
    position: [SHACK_INTERIOR.rightX - 0.3, 1.6, -4],
    rotation: [0, -Math.PI / 2, 0],
    shelfIndex: 3,
  },
];

// Neon sign configuration - rotated to face outward
const NEON_SIGN = {
  id: 'neon-open-sign',
  url: '/models/props/neonOpenSign.glb',
  position: [0, 3.5, -2.5],  // Lower and at entrance
  rotation: [0, 0, 0],        // Face forward (toward player)
  scale: 0.5,
  emissiveIntensity: 1.5,
  emissiveColor: '#ff00ff',
};

// ============================================
// COMPONENT
// ============================================

function ShopProps({ cards = [], onCardClick, onPropClick }) {
  // Distribute cards across shelves
  const shelfCardAssignments = useMemo(() => {
    if (!cards.length) return [];

    const assignments = [];
    let cardIndex = 0;

    SHELF_PLACEMENTS.forEach((shelf) => {
      const shelfCards = [];
      for (let i = 0; i < SHELF_CONFIG.cardsPerShelf && cardIndex < cards.length; i++) {
        shelfCards.push({
          card: cards[cardIndex],
          slotIndex: i,
        });
        cardIndex++;
      }
      assignments.push({
        shelf,
        cards: shelfCards,
      });
    });

    return assignments;
  }, [cards]);

  // Calculate card position on a shelf
  const getCardPosition = (shelf, slotIndex) => {
    const { cardsPerShelf, cardSpacing, cardYOffset } = SHELF_CONFIG;
    const totalWidth = (cardsPerShelf - 1) * cardSpacing;
    const startX = -totalWidth / 2;

    // Base position from shelf
    const [sx, sy, sz] = shelf.position;
    const rotation = shelf.rotation[1]; // Y rotation

    // Calculate offset based on slot
    const localX = startX + slotIndex * cardSpacing;

    // Apply rotation to get world position
    if (Math.abs(rotation) < 0.1) {
      // Facing forward (back wall)
      return [sx + localX, sy + cardYOffset, sz + 0.3];
    } else if (rotation > 0) {
      // Left wall (rotated 90 degrees)
      return [sx + 0.3, sy + cardYOffset, sz + localX];
    } else {
      // Right wall (rotated -90 degrees)
      return [sx - 0.3, sy + cardYOffset, sz - localX];
    }
  };

  return (
    <group name="shop-props">
      {/* Neon sign above entrance */}
      <Suspense fallback={null}>
        <MeshyModel
          url={NEON_SIGN.url}
          position={NEON_SIGN.position}
          rotation={NEON_SIGN.rotation}
          scale={NEON_SIGN.scale}
          emissiveIntensity={NEON_SIGN.emissiveIntensity}
          emissiveColor={NEON_SIGN.emissiveColor}
          onClick={() => onPropClick?.(NEON_SIGN)}
        />
      </Suspense>

      {/* Neon sign lights */}
      <pointLight
        position={[0, 4.5, -0.5]}
        intensity={2}
        color="#ff00ff"
        distance={8}
        decay={2}
      />
      <pointLight
        position={[0, 4.5, -0.5]}
        intensity={1}
        color="#00ffff"
        distance={6}
        decay={2}
      />

      {/* Shelves with cards */}
      {shelfCardAssignments.map(({ shelf, cards: shelfCards }) => (
        <group key={shelf.id}>
          {/* Shelf model */}
          <Suspense fallback={null}>
            <MeshyModel
              url="/models/props/cardShelf.glb"
              position={shelf.position}
              rotation={shelf.rotation}
              scale={SHELF_CONFIG.scale}
              onClick={() => onPropClick?.(shelf)}
            />
          </Suspense>

          {/* Cards on this shelf */}
          {shelfCards.map(({ card, slotIndex }) => (
            <Card3D
              key={`${shelf.id}-card-${slotIndex}`}
              card={card}
              position={getCardPosition(shelf, slotIndex)}
              onClick={() => onCardClick?.(card)}
              index={shelf.shelfIndex * SHELF_CONFIG.cardsPerShelf + slotIndex}
              scale={SHELF_CONFIG.cardScale}
            />
          ))}
        </group>
      ))}

      {/* Interior ambient lighting */}
      <pointLight
        position={[0, 3, -5]}
        intensity={0.8}
        color="#ffcc77"
        distance={10}
        decay={2}
      />
      <pointLight
        position={[-2, 2, -4]}
        intensity={0.4}
        color="#ffaa55"
        distance={6}
        decay={2}
      />
      <pointLight
        position={[2, 2, -4]}
        intensity={0.4}
        color="#ffaa55"
        distance={6}
        decay={2}
      />
    </group>
  );
}

export default ShopProps;

// Preload models
preloadModel('/models/props/neonOpenSign.glb');
preloadModel('/models/props/cardShelf.glb');

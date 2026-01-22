/**
 * ShopProps.jsx
 *
 * Container component for Meshy AI generated props and card displays.
 * Shelves are positioned inside the double shack with cards displayed on them.
 */

import { Suspense, useMemo } from 'react';
import MeshyModel, { preloadModel } from './MeshyModel';
import Card3D from './Card3D';

// ============================================
// CONFIGURATION
// ============================================

// Shelf configuration - larger shelves for better visibility
const SHELF_CONFIG = {
  scale: 2.0,              // Larger scale for bigger shelves
  cardScale: 0.7,          // Card scale to fit shelves
  cardsPerShelf: 4,        // Cards per shelf row
  cardSpacing: 1.0,        // Horizontal spacing between cards
  cardYOffset: 0.9,        // Height offset for cards on shelf surface
};

// Double shack interior dimensions
// Front shack at [0, 2.5, -3], back shack at [0, 2.5, -9]
// Combined interior spans roughly Z = -2 to -10
const SHACK_INTERIOR = {
  centerX: 0,
  floorY: 0,
  // Front section (first shack)
  frontZ: -2,
  midZ: -6,      // Where the two shacks meet
  backZ: -10,    // Back of second shack
  leftX: -3,
  rightX: 3,
};

// Uniform shelf height for all shelves
const SHELF_HEIGHT_LOW = 1.2;
const SHELF_HEIGHT_HIGH = 2.8;

// Shelf placements - uniform heights, spread across both shacks
const SHELF_PLACEMENTS = [
  // === FRONT SHACK SHELVES ===
  // Back wall of front section (lower)
  {
    id: 'shelf-front-back-lower',
    position: [0, SHELF_HEIGHT_LOW, -5],
    rotation: [0, 0, 0],
    cardRotation: [0, 0, 0],
    shelfIndex: 0,
  },
  // Back wall of front section (upper)
  {
    id: 'shelf-front-back-upper',
    position: [0, SHELF_HEIGHT_HIGH, -5],
    rotation: [0, 0, 0],
    cardRotation: [0, 0, 0],
    shelfIndex: 1,
  },
  // Left wall front section
  {
    id: 'shelf-front-left',
    position: [-2.5, SHELF_HEIGHT_LOW, -4],
    rotation: [0, Math.PI / 2, 0],
    cardRotation: [0, Math.PI / 2, 0],
    shelfIndex: 2,
  },
  // Right wall front section
  {
    id: 'shelf-front-right',
    position: [2.5, SHELF_HEIGHT_LOW, -4],
    rotation: [0, -Math.PI / 2, 0],
    cardRotation: [0, -Math.PI / 2, 0],
    shelfIndex: 3,
  },
  // === BACK SHACK SHELVES ===
  // Back wall of back section (lower)
  {
    id: 'shelf-back-back-lower',
    position: [0, SHELF_HEIGHT_LOW, -8.5],
    rotation: [0, Math.PI, 0],  // Facing forward
    cardRotation: [0, Math.PI, 0],
    shelfIndex: 4,
  },
  // Back wall of back section (upper)
  {
    id: 'shelf-back-back-upper',
    position: [0, SHELF_HEIGHT_HIGH, -8.5],
    rotation: [0, Math.PI, 0],
    cardRotation: [0, Math.PI, 0],
    shelfIndex: 5,
  },
];

// Neon sign configuration
const NEON_SIGN = {
  id: 'neon-open-sign',
  url: '/models/props/neonOpenSign.glb',
  position: [0, 5, -1],
  rotation: [0, 0, 0],
  scale: 0.8,
  emissiveIntensity: 2,
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

  // Calculate card position and rotation on a shelf
  const getCardTransform = (shelf, slotIndex) => {
    const { cardsPerShelf, cardSpacing, cardYOffset } = SHELF_CONFIG;
    const totalWidth = (cardsPerShelf - 1) * cardSpacing;
    const startOffset = -totalWidth / 2;

    const [sx, sy, sz] = shelf.position;
    const yRotation = shelf.rotation[1];

    const localOffset = startOffset + slotIndex * cardSpacing;

    let position;
    // Calculate world position based on shelf rotation
    if (Math.abs(yRotation) < 0.1) {
      // Facing forward (Z+)
      position = [sx + localOffset, sy + cardYOffset, sz + 0.5];
    } else if (Math.abs(yRotation - Math.PI) < 0.1 || Math.abs(yRotation + Math.PI) < 0.1) {
      // Facing backward (Z-)
      position = [sx - localOffset, sy + cardYOffset, sz - 0.5];
    } else if (yRotation > 0) {
      // Facing right (X+)
      position = [sx + 0.5, sy + cardYOffset, sz + localOffset];
    } else {
      // Facing left (X-)
      position = [sx - 0.5, sy + cardYOffset, sz - localOffset];
    }

    return {
      position,
      rotation: shelf.cardRotation,
    };
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

      {/* Neon sign glow */}
      <pointLight
        position={[0, 5, -0.5]}
        intensity={3}
        color="#ff00ff"
        distance={10}
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
          {shelfCards.map(({ card, slotIndex }) => {
            const { position, rotation } = getCardTransform(shelf, slotIndex);
            return (
              <group key={`${shelf.id}-card-${slotIndex}`} rotation={rotation}>
                <Card3D
                  card={card}
                  position={position}
                  onClick={() => onCardClick?.(card)}
                  index={shelf.shelfIndex * SHELF_CONFIG.cardsPerShelf + slotIndex}
                  scale={SHELF_CONFIG.cardScale}
                />
              </group>
            );
          })}
        </group>
      ))}

      {/* Interior lighting for double shack */}
      <pointLight position={[0, 3, -4]} intensity={1} color="#ffcc77" distance={12} decay={2} />
      <pointLight position={[0, 3, -7]} intensity={1} color="#ffcc77" distance={12} decay={2} />
      <pointLight position={[-2, 2.5, -5]} intensity={0.5} color="#ffaa55" distance={8} decay={2} />
      <pointLight position={[2, 2.5, -5]} intensity={0.5} color="#ffaa55" distance={8} decay={2} />
    </group>
  );
}

export default ShopProps;

// Preload models
preloadModel('/models/props/neonOpenSign.glb');
preloadModel('/models/props/cardShelf.glb');

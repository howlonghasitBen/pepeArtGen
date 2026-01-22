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

// Shelf configuration - adjusted for better fit
const SHELF_CONFIG = {
  scale: 2.3,              // Increased from 2.2 (was 2.4, then 2.2, now 2.3)
  cardScale: 0.7,          // Card scale to fit shelves
  cardsPerRow: 4,          // Cards per shelf row (horizontally)
  rowsPerShelf: 3,         // Number of rows per shelf (vertically)
  cardSpacing: 0.9,        // Horizontal spacing between cards (slightly tighter for smaller shelf)
  rowSpacing: 1.0,         // Vertical spacing between rows
  cardYOffset: 1.0,        // Absolute floor position (floor 0 + 1.0)
};

// Double shack interior dimensions (centered on beach plane)
// Front shack at [0, 5.25, 13], back shack at [0, 5.25, 7]
const SHACK_INTERIOR = {
  centerX: 0,
  floorY: 0,
  frontZ: 15,      // Front of front shack (entrance)
  midZ: 10,        // Where the two shacks meet
  backZ: 5,        // Back of back shack
  leftX: -4,       // Flush with walls
  rightX: 4,
};

// Uniform shelf height - single level at floor height
const SHELF_HEIGHT = 1.9;  // Floor level shelves

// Shelf placements - U-shaped layout along left, back, and right walls
// Forms a U when viewed from entrance (Z=15 looking toward Z=5)
// Spacing increased to 4 units between shelves on side walls to prevent overlap
// Left and right wall shelves moved forward 0.4 units, back wall pushed back 1 unit
const SHELF_PLACEMENTS = [
  // === LEFT WALL (2 shelves) ===
  // Front left
  {
    id: 'shelf-left-front',
    position: [-4.0, SHELF_HEIGHT, 13.9],
    rotation: [0, Math.PI / 2, 0],
    cardRotation: [0, Math.PI / 2, 0],
    shelfIndex: 0,
  },
  // Back left corner
  {
    id: 'shelf-left-back',
    position: [-4.0, SHELF_HEIGHT, 9.9],
    rotation: [0, Math.PI / 2, 0],
    cardRotation: [0, Math.PI / 2, 0],
    shelfIndex: 1,
  },
  // === BACK WALL (2 shelves) ===
  // Back center-left (facing forward toward entrance)
  {
    id: 'shelf-back-left',
    position: [-2.0, SHELF_HEIGHT, 6],
    rotation: [0, 0, 0],
    cardRotation: [0, 0, 0],
    shelfIndex: 2,
  },
  // Back center-right (facing forward toward entrance)
  {
    id: 'shelf-back-right',
    position: [2.0, SHELF_HEIGHT, 6],
    rotation: [0, 0, 0],
    cardRotation: [0, 0, 0],
    shelfIndex: 3,
  },
  // === RIGHT WALL (2 shelves) ===
  // Back right corner
  {
    id: 'shelf-right-back',
    position: [4.0, SHELF_HEIGHT, 9.9],
    rotation: [0, -Math.PI / 2, 0],
    cardRotation: [0, -Math.PI / 2, 0],
    shelfIndex: 4,
  },
  // Front right
  {
    id: 'shelf-right-front',
    position: [4.0, SHELF_HEIGHT, 13.9],
    rotation: [0, -Math.PI / 2, 0],
    cardRotation: [0, -Math.PI / 2, 0],
    shelfIndex: 5,
  },
];

// Neon sign configuration (positioned at front entrance)
const NEON_SIGN = {
  id: 'neon-open-sign',
  url: '/models/props/neonOpenSign.glb',
  position: [0, 6, 15],  // Above front shack entrance
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
    const cardsPerShelf = SHELF_CONFIG.cardsPerRow * SHELF_CONFIG.rowsPerShelf;

    SHELF_PLACEMENTS.forEach((shelf) => {
      const shelfCards = [];
      // Fill all rows on this shelf
      for (let row = 0; row < SHELF_CONFIG.rowsPerShelf && cardIndex < cards.length; row++) {
        for (let col = 0; col < SHELF_CONFIG.cardsPerRow && cardIndex < cards.length; col++) {
          shelfCards.push({
            card: cards[cardIndex],
            row: row,
            col: col,
          });
          cardIndex++;
        }
      }
      assignments.push({
        shelf,
        cards: shelfCards,
      });
    });

    return assignments;
  }, [cards]);

  // Calculate card position and rotation on a shelf
  const getCardTransform = (shelf, row, col) => {
    const { cardsPerRow, cardSpacing, rowSpacing, cardYOffset } = SHELF_CONFIG;
    const totalWidth = (cardsPerRow - 1) * cardSpacing;
    const startOffset = -totalWidth / 2;

    const [sx, sy, sz] = shelf.position;
    const yRotation = shelf.rotation[1];

    // Calculate horizontal offset based on column
    const localOffset = startOffset + col * cardSpacing;
    // Calculate absolute vertical position (cardYOffset is absolute floor + 1.5)
    const absoluteY = cardYOffset + row * rowSpacing;

    let position;
    // Calculate world position based on shelf rotation
    if (Math.abs(yRotation) < 0.1) {
      // Facing forward (Z+)
      position = [sx + localOffset, absoluteY, sz + 0.5];
    } else if (Math.abs(yRotation - Math.PI) < 0.1 || Math.abs(yRotation + Math.PI) < 0.1) {
      // Facing backward (Z-)
      position = [sx - localOffset, absoluteY, sz - 0.5];
    } else if (yRotation > 0) {
      // Facing right (X+)
      position = [sx + 0.5, absoluteY, sz + localOffset];
    } else {
      // Facing left (X-)
      position = [sx - 0.5, absoluteY, sz - localOffset];
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
        position={[0, 6, 15.5]}
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
          {shelfCards.map(({ card, row, col }) => {
            const { position, rotation } = getCardTransform(shelf, row, col);
            const cardIndex = shelf.shelfIndex * SHELF_CONFIG.cardsPerRow * SHELF_CONFIG.rowsPerShelf + row * SHELF_CONFIG.cardsPerRow + col;
            return (
              <group key={`${shelf.id}-card-${row}-${col}`} position={position} rotation={rotation}>
                <Card3D
                  card={card}
                  position={[0, 0, 0]}
                  onClick={() => onCardClick?.(card)}
                  index={cardIndex}
                  scale={SHELF_CONFIG.cardScale}
                />
              </group>
            );
          })}
        </group>
      ))}

      {/* Interior lighting for double shack (centered on beach) */}
      <pointLight position={[0, 4, 12]} intensity={1} color="#ffcc77" distance={12} decay={2} />
      <pointLight position={[0, 4, 8]} intensity={1} color="#ffcc77" distance={12} decay={2} />
      <pointLight position={[-2, 3.5, 10]} intensity={0.5} color="#ffaa55" distance={8} decay={2} />
      <pointLight position={[2, 3.5, 10]} intensity={0.5} color="#ffaa55" distance={8} decay={2} />
    </group>
  );
}

export default ShopProps;

// Preload models
preloadModel('/models/props/neonOpenSign.glb');
preloadModel('/models/props/cardShelf.glb');

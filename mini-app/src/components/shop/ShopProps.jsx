/**
 * ShopProps.jsx
 *
 * Container component for all Meshy AI generated props in the shop.
 * Includes neon sign and card shelf configurations.
 */

import { Suspense } from 'react';
import MeshyModel, { preloadModel } from './MeshyModel';

// ============================================
// PROP CONFIGURATIONS
// ============================================

const SHOP_PROPS = [
  // Neon "OPEN" sign - centered above the entrance
  {
    id: 'neon-open-sign',
    url: '/models/props/neonOpenSign.glb',
    position: [0, 4, 5],  // Above entrance (adjust Y for height, Z for door position)
    rotation: [0, Math.PI, 0],  // Face outward toward visitors
    scale: 0.5,  // Adjust based on model size
    emissiveIntensity: 1.5,
    emissiveColor: '#ff00ff',  // Neon pink glow
    category: 'props',
  },
];

const DISPLAY_PROPS = [
  // ============================================
  // WALL SHELVES - Along the back and side walls
  // ============================================

  // Back wall - left shelf
  {
    id: 'shelf-wall-back-left',
    url: '/models/props/cardShelf.glb',
    position: [-4, 1.5, -4.5],  // Against back wall, left side
    rotation: [0, 0, 0],  // Facing forward
    scale: 0.3,
    category: 'displays',
  },
  // Back wall - right shelf
  {
    id: 'shelf-wall-back-right',
    url: '/models/props/cardShelf.glb',
    position: [4, 1.5, -4.5],  // Against back wall, right side
    rotation: [0, 0, 0],  // Facing forward
    scale: 0.3,
    category: 'displays',
  },
  // Left wall shelf
  {
    id: 'shelf-wall-left',
    url: '/models/props/cardShelf.glb',
    position: [-5.5, 1.5, 0],  // Against left wall
    rotation: [0, Math.PI / 2, 0],  // Rotated to face inward
    scale: 0.3,
    category: 'displays',
  },
  // Right wall shelf
  {
    id: 'shelf-wall-right',
    url: '/models/props/cardShelf.glb',
    position: [5.5, 1.5, 0],  // Against right wall
    rotation: [0, -Math.PI / 2, 0],  // Rotated to face inward
    scale: 0.3,
    category: 'displays',
  },

  // ============================================
  // FLOOR SHELVES - 2 sets of 2 back-to-back
  // ============================================

  // Floor set 1 - Left side of shop
  {
    id: 'shelf-floor-1a',
    url: '/models/props/cardShelf.glb',
    position: [-2, 0, -1],  // Left floor area, facing one way
    rotation: [0, 0, 0],
    scale: 0.25,
    category: 'displays',
  },
  {
    id: 'shelf-floor-1b',
    url: '/models/props/cardShelf.glb',
    position: [-2, 0, -1.5],  // Back-to-back with 1a
    rotation: [0, Math.PI, 0],  // Facing opposite direction
    scale: 0.25,
    category: 'displays',
  },

  // Floor set 2 - Right side of shop
  {
    id: 'shelf-floor-2a',
    url: '/models/props/cardShelf.glb',
    position: [2, 0, -1],  // Right floor area, facing one way
    rotation: [0, 0, 0],
    scale: 0.25,
    category: 'displays',
  },
  {
    id: 'shelf-floor-2b',
    url: '/models/props/cardShelf.glb',
    position: [2, 0, -1.5],  // Back-to-back with 2a
    rotation: [0, Math.PI, 0],  // Facing opposite direction
    scale: 0.25,
    category: 'displays',
  },
];

// Combine all props
const ALL_PROPS = [...SHOP_PROPS, ...DISPLAY_PROPS];

// Preload all models
export function preloadAllModels() {
  ALL_PROPS.forEach(prop => {
    if (prop.url) {
      preloadModel(prop.url);
    }
  });
}

function ShopProps({ onPropClick }) {
  if (ALL_PROPS.length === 0) {
    return null;
  }

  return (
    <group name="shop-props">
      {ALL_PROPS.map((prop) => (
        <Suspense key={prop.id} fallback={null}>
          <MeshyModel
            url={prop.url}
            position={prop.position}
            rotation={prop.rotation || [0, 0, 0]}
            scale={prop.scale || 1}
            animate={prop.animate}
            floatSpeed={prop.floatSpeed}
            floatAmplitude={prop.floatAmplitude}
            rotateSpeed={prop.rotateSpeed}
            emissiveIntensity={prop.emissiveIntensity}
            emissiveColor={prop.emissiveColor}
            metalness={prop.metalness}
            roughness={prop.roughness}
            onClick={() => onPropClick?.(prop)}
          />
        </Suspense>
      ))}

      {/* Add point light for neon sign glow effect */}
      <pointLight
        position={[0, 4, 5.5]}
        intensity={2}
        color="#ff00ff"
        distance={8}
        decay={2}
      />
      <pointLight
        position={[0, 4, 5.5]}
        intensity={1}
        color="#00ffff"
        distance={6}
        decay={2}
      />
    </group>
  );
}

export default ShopProps;

// ============================================
// POSITION ADJUSTMENT GUIDE
// ============================================
/*
If models appear in wrong positions, adjust these values:

NEON SIGN:
- position[1] (Y): Raise/lower the sign
- position[2] (Z): Move closer/further from building
- scale: Make bigger/smaller

SHELVES:
- Wall shelves position[1] (Y): Height on wall
- Floor shelves: Currently at Y=0 (floor level)
- scale: Adjust size to fit space
- rotation[1] (Y): Rotate to face different direction

After running the app, check the console for any loading errors
and visually confirm positions, then adjust values here.
*/

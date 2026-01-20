/**
 * ShopProps.jsx
 *
 * Container component for all Meshy AI generated props in the shop.
 * Add new props here as you create them in Meshy AI.
 *
 * Model Directory Structure:
 *   /public/models/
 *     /props/        - Shop items (arcade machines, furniture, decor)
 *     /environment/  - Beach/outdoor items (palm trees, rocks, boats)
 *     /displays/     - Card display items (pedestals, frames, cases)
 *     /characters/   - Character items (hats, accessories)
 */

import { Suspense } from 'react';
import MeshyModel, { preloadModel } from './MeshyModel';

// ============================================
// PROP CONFIGURATIONS
// Add your Meshy AI models here after exporting
// ============================================

const SHOP_PROPS = [
  // Example configurations (uncomment when you have the models):

  // {
  //   id: 'arcade-machine-1',
  //   url: '/models/props/arcade-machine.glb',
  //   position: [8, 0, -5],
  //   rotation: [0, -Math.PI / 4, 0],
  //   scale: 1.5,
  //   category: 'props',
  // },
  // {
  //   id: 'jukebox',
  //   url: '/models/props/jukebox.glb',
  //   position: [-6, 0, -4],
  //   rotation: [0, Math.PI / 6, 0],
  //   scale: 1.2,
  //   emissiveIntensity: 0.5,
  //   emissiveColor: '#ff00ff',
  //   category: 'props',
  // },
];

const ENVIRONMENT_PROPS = [
  // {
  //   id: 'palm-tree-1',
  //   url: '/models/environment/palm-tree.glb',
  //   position: [15, 0, 5],
  //   scale: 2,
  //   category: 'environment',
  // },
  // {
  //   id: 'beach-umbrella',
  //   url: '/models/environment/beach-umbrella.glb',
  //   position: [10, 0, 8],
  //   rotation: [0, Math.PI / 3, 0],
  //   scale: 1,
  //   category: 'environment',
  // },
];

const DISPLAY_PROPS = [
  // {
  //   id: 'card-pedestal-1',
  //   url: '/models/displays/card-pedestal.glb',
  //   position: [0, 0, -8],
  //   scale: 0.8,
  //   animate: true,
  //   floatAmplitude: 0,
  //   rotateSpeed: 0.5,
  //   category: 'displays',
  // },
  // {
  //   id: 'trophy-case',
  //   url: '/models/displays/trophy-case.glb',
  //   position: [-4, 0, -6],
  //   scale: 1,
  //   emissiveIntensity: 0.3,
  //   emissiveColor: '#ffd700',
  //   category: 'displays',
  // },
];

// Combine all props
const ALL_PROPS = [...SHOP_PROPS, ...ENVIRONMENT_PROPS, ...DISPLAY_PROPS];

// Preload all models (call this once)
export function preloadAllModels() {
  ALL_PROPS.forEach(prop => {
    if (prop.url) {
      preloadModel(prop.url);
    }
  });
}

function ShopProps({ onPropClick }) {
  // If no props defined yet, return null
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
    </group>
  );
}

export default ShopProps;

// ============================================
// QUICK REFERENCE: How to add a new prop
// ============================================
/*
1. Create model in Meshy AI (Image-to-3D)
2. Export as GLB format
3. Place file in appropriate /public/models/ subfolder
4. Add configuration to the relevant array above:

{
  id: 'unique-id',           // Unique identifier
  url: '/models/props/x.glb', // Path to GLB file
  position: [x, y, z],        // World position
  rotation: [x, y, z],        // Rotation in radians (optional)
  scale: 1,                   // Scale factor (optional)

  // Animation options (optional)
  animate: true,              // Enable animations
  floatAmplitude: 0.1,        // Vertical bob amount
  floatSpeed: 1,              // Bob speed
  rotateSpeed: 0.5,           // Auto-rotation speed

  // Material overrides (optional)
  emissiveIntensity: 0.5,     // Glow amount
  emissiveColor: '#ff00ff',   // Glow color
  metalness: 0.8,             // Metal look
  roughness: 0.2,             // Surface smoothness

  category: 'props',          // For filtering
}
*/
